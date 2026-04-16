#!/bin/bash
# 1. Сборка проекта
npm run build

# 2. Подготовка чистой папки для упаковки
rm -rf dist release.tar.gz
mkdir -p dist/.next

# 3. Копируем всё необходимое (используем . чтобы захватить скрытые файлы)
cp -r .next/standalone/. dist/
cp -r .next/static/. dist/.next/static/
cp -r public/. dist/public/

# 4. Упаковка
tar -czf release.tar.gz -C dist .

# 5. Отправка на сервер
scp release.tar.gz root@155.212.190.166:/var/www/html/

# 6. Очистка локального мусора
rm -rf dist
echo "Архив готов и отправлен!"