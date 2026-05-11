#!/bin/bash

# Usage:
#   ./deploy.sh              — build + deploy
#   ./deploy.sh --with-db    — build + deploy + import PostgreSQL
#   ./deploy.sh --build-only — build
#
# Local requirements:
#   - Docker Desktop run
#   - SSH access to server without password (ssh-copy-id)

set -euo pipefail

#  Settings: 
SERVER="root@155.212.190.166"
SERVER_DIR="/opt/linza"
IMAGE_NAME="linza-app"
IMAGE_TAG="latest"
IMAGE_FILE="linza-app.tar.gz"
PG_DUMP="init-db/01_data.sql"

#  Flags 
WITH_DB=false
BUILD_ONLY=false
for arg in "$@"; do
  case $arg in
    --with-db)    WITH_DB=true ;;
    --build-only) BUILD_ONLY=true ;;
  esac
done

#  Colors 
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $*${NC}"; }
info() { echo -e "${YELLOW}ℹ️  $*${NC}"; }
err()  { echo -e "${RED}❌ $*${NC}"; exit 1; }

echo "════════════════════════════════════════"
echo "  Linza Docker Deploy"
echo "════════════════════════════════════════"

# ── 1. Building a Docker image
info "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
docker build \
  --platform linux/amd64 \
  --tag "${IMAGE_NAME}:${IMAGE_TAG}" \
  --file Dockerfile \
  .
ok "Image built"

# ── 2. Exporting an image to an archive
info "Exporting image to ${IMAGE_FILE}..."
docker save "${IMAGE_NAME}:${IMAGE_TAG}" | gzip > "${IMAGE_FILE}"
SIZE=$(du -sh "${IMAGE_FILE}" | cut -f1)
ok "Image exported (${SIZE})"

if [ "$BUILD_ONLY" = true ]; then
  ok "Build-only mode — done!"
  exit 0
fi

# ── 3. Checking the SSH connectionя 
info "Checking SSH connection to ${SERVER}..."
ssh -o ConnectTimeout=10 "${SERVER}" 
ok "echo 'SSH OK'" || err "Cannot connect to ${SERVER}"

# ── 4. Creating a directory on the server 
ssh "${SERVER}" "mkdir -p ${SERVER_DIR}/init-db"

# ── 5. Dispatch docker-compose and .env 
info "Uploading docker-compose.yml..."
scp docker-compose.yml "${SERVER}:${SERVER_DIR}/"

# upload .env only if it is not on the server (we do not overwrite production secrets!)
ssh "${SERVER}" "[ -f ${SERVER_DIR}/.env ] && echo '.env already exists on server — skipping' || echo 'No .env found — will create from example'"
if ssh "${SERVER}" "[ ! -f ${SERVER_DIR}/.env ]"; then
  if [ -f ".env.production" ]; then
    info "Uploading .env.production as .env..."
    scp ".env.production" "${SERVER}:${SERVER_DIR}/.env"
    ok ".env uploaded"
  else
    echo ""
    echo -e "${YELLOW}⚠️  No .env.production found locally and no .env on server!${NC}"
    echo "   Create ${SERVER_DIR}/.env on the server before starting the app."
    echo "   Template: .env.example"
  fi
fi

# ── 6. Loading a database dump
if [ "$WITH_DB" = true ]; then
  if [ ! -f "${PG_DUMP}" ]; then
    err "File ${PG_DUMP} not found. Run mysql_to_pg.py first."
  fi

  DB_SIZE=$(du -sh "${PG_DUMP}" | cut -f1)
  echo ""
  echo -e "${YELLOW}⚠️  --with-db: uploading ${PG_DUMP} (${DB_SIZE}) to server${NC}"
  echo "   This will be imported into PostgreSQL on first DB container start."
  read -p "   Continue? (y/N): " confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Cancelled."
    exit 0
  fi

  info "Uploading ${PG_DUMP}..."
  scp "${PG_DUMP}" "${SERVER}:${SERVER_DIR}/init-db/01_data.sql"
  ok "DB dump uploaded to init-db/"
fi

# ── 7. Uploading a Docker image 
info "Uploading Docker image (${SIZE}) to server..."
info "This may take a few minutes..."
scp "${IMAGE_FILE}" "${SERVER}:${SERVER_DIR}/"
ok "Image uploaded"

# ── 8. Deploy to the server
info "Running server-side deploy..."
ssh "${SERVER}" bash << ENDSSH
set -e
cd ${SERVER_DIR}

echo "📦 Loading Docker image..."
docker load < ${IMAGE_FILE}
rm -f ${IMAGE_FILE}
echo "✅ Image loaded"

echo "🔄 Restarting services..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up -d
echo "✅ Services started"

echo "🧹 Cleaning up old Docker images..."
docker image prune -f
echo "✅ Cleanup done"

echo "⏳ Waiting for health check (60s)..."
sleep 10
for i in \$(seq 1 10); do
  if docker compose ps | grep -q "healthy"; then
    echo "✅ App is healthy!"
    break
  fi
  echo "   Attempt \$i/10..."
  sleep 6
done

echo ""
echo "📊 Container status:"
docker compose ps
echo ""
echo "📋 App logs (last 20 lines):"
docker compose logs --tail=20 app
ENDSSH

# ── 9. Cleaning up local artifacts
rm -f "${IMAGE_FILE}"

echo ""
echo "════════════════════════════════════════"
ok "Deploy complete! 🎉"
echo "   URL: https://linzarental.ru"
echo "════════════════════════════════════════"