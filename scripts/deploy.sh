#!/bin/bash
# 1. Сборка
set -e
npm run build

# 2. Подготовка папки
rm -rf dist release.tar.gz
mkdir -p dist/.next

# 3. Копирование файлов
cp -r .next/standalone/. dist/
cp -r .next/static/. dist/.next/static/
cp -r public/. dist/public/
# Явно удаляем .env из папки dist, если он туда попал
rm -f dist/.env
# Копируем Prisma для стабильности (как обсуждали)
mkdir -p dist/prisma
cp prisma/schema.prisma dist/prisma/

# 4. Упаковка
tar -czf release.tar.gz -C dist .

# 5. Отправка на сервер
echo "Sending archive to server..."
scp release.tar.gz root@155.212.190.166:/var/www/html/

# 6. Запуск деплоя на сервере
echo "Executing remote deploy script..."
ssh root@155.212.190.166 "/var/www/html/server_deploy.sh"

# 7. Очистка локально
rm -rf dist
echo "Done! Project updated on linzarental.ru"