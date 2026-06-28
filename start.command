#!/bin/bash
# Plant Shop — one-click launcher for macOS

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=== Plant Shop ==="
echo ""

# Устанавливаем зависимости, если нужно
if [ ! -d "node_modules" ]; then
  echo "📦 Установка зависимостей..."
  npm install --silent
fi

# Запускаем дев-сервер
echo "🚀 Запуск сервера..."
echo ""
npm run dev &
DEV_PID=$!

# Ждём запуска и открываем браузер
sleep 3
open http://localhost:3000

# Возвращаемся к фоновому процессу
wait $DEV_PID
