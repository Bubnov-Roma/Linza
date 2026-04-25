#!/bin/sh
set -e

echo "🚀 Linza startup..."
echo "⏳ Waiting for database..."
while ! nc -z db 5432; do
  sleep 1
done
echo "✅ Database is ready"

echo "🔄 Baselining database..."
npx prisma migrate resolve --applied 0_init || true

echo "🔄 Applying any new Prisma migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied"

echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec node server.js