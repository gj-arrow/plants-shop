@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo === Plant Shop ===
echo.

REM --- проверка Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] Node.js не найден. Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] npm не найден. Переустановите Node.js
    pause
    exit /b 1
)

REM --- установка зависимостей ---
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить зависимости
        pause
        exit /b 1
    )
    echo.
)

REM better-sqlite3 не в package.json (extraneous) - нужен для SQLite на Windows
if not exist "node_modules\better-sqlite3" (
    echo Установка better-sqlite3 для SQLite...
    call npm install better-sqlite3 --no-save
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить better-sqlite3
        pause
        exit /b 1
    )
    echo.
)

REM --- инициализация БД если нет файла ---
if not exist "plant-shop.db" (
    echo Инициализация базы данных...
    call npm run init-db
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось инициализировать БД
        pause
        exit /b 1
    )
    echo.
)

echo Запуск сервера на http://localhost:3000 ...
echo Нажмите Ctrl+C чтобы остановить
echo.

REM открыть браузер (убрана цепочка cmd /c & - триггерила эвристику антивируса)
start http://localhost:3000

call npm run dev
