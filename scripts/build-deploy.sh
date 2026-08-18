#!/bin/bash
# ==========================================================
# Plant Shop — сборка деплой-пакета для ISPmanager
# ==========================================================
# Использование:
#   ./scripts/build-deploy.sh
#
# Результат: папка deploy/ — копируйте её содержимое на хостинг.
# Папка public/uploads НЕ входит в пакет (загруженные фото живут только на сервере).
# Локальные фото лежат в deploy/uploads.zip — распаковывать только при первом запуске.
# ==========================================================

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="$ROOT_DIR/deploy"

echo "=== Plant Shop — сборка деплой-пакета ==="
echo ""

# 1. Сборка проекта
echo "[1/5] Сборка Next.js..."
cd "$ROOT_DIR"
npm run build

# 2. Создаём init-db.mjs для настройки БД на сервере
echo "[2/5] Создание init-db.mjs..."
cat > "$ROOT_DIR/.temp-init-db.mjs" << 'INITEOF'
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL || 'mysql://gjarrown_user:Qwerty_123!@localhost:3306/gjarrown_plant_shop';
const pool = mysql.createPool({ uri: url, waitForConnections: true, connectionLimit: 5, queueLimit: 0 });

async function run(sql, params) {
  const [result] = await pool.execute(sql, params);
  return result;
}

async function queryOne(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function init() {
  console.log('Инициализация базы данных...');
  console.log('Подключение:', url.replace(/\/\/.*@/, '//***@'));

  // Таблица администраторов
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица категорий
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Удаляем колонку description, если есть
  try { await pool.execute('ALTER TABLE categories DROP COLUMN description'); } catch {}

  // Таблица товаров
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INT DEFAULT 0,
      image_url TEXT,
      category VARCHAR(255),
      subcategory VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Миграции
  try { await pool.execute("ALTER TABLE products ADD COLUMN subcategory VARCHAR(255) AFTER category"); } catch {}

  // Seed категорий
  const catCount = await queryOne('SELECT COUNT(*) as count FROM categories');
  if (catCount && catCount.count === 0) {
    for (const name of ['Комнатные', 'Деревья', 'Цветущие']) {
      await run('INSERT INTO categories (name) VALUES (?)', [name]);
    }
    console.log('  + Категории созданы');
  }

  // Seed админа
  const hash = bcrypt.hashSync('admin123', 10);
  const existing = await queryOne('SELECT id FROM admins WHERE username = ?', ['admin']);
  if (!existing) {
    await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log('  + Админ создан (admin/admin123)');
  }

  // Seed товаров (10 штук)
  const products = [
    { name: 'Монстера деликатесная', desc: 'Крупное тропическое растение с эффектными резными листьями.', price: 3500, stock: 15, cat: 'Комнатные', img: '/uploads/products/plant-17.jpg' },
    { name: 'Фикус лирата', desc: 'Эффектное вечнозелёное дерево с крупными волнистыми листьями.', price: 5200, stock: 8, cat: 'Деревья', img: '/uploads/products/plant-28.jpg' },
    { name: 'Сансевиерия цилиндрическая', desc: 'Неприхотливый суккулент с необычными трубчатыми листьями.', price: 1800, stock: 25, cat: 'Комнатные', img: '/uploads/products/1782836700125-pp051k.jpg' },
    { name: 'Папоротник Нефролепис', desc: 'Пышный ампельный папоротник с ажурными вайями.', price: 2200, stock: 12, cat: 'Комнатные', img: '/uploads/products/1782836815587-uipyl4.jpg' },
    { name: 'Орхидея Фаленопсис', desc: 'Элегантная орхидея с крупными цветами.', price: 3800, stock: 10, cat: 'Цветущие', img: '/uploads/products/1782836856906-jn32rh.jpg' },
    { name: 'Эхинокактус Грусона', desc: 'Крупный шаровидный кактус — «тещин стул».', price: 2000, stock: 20, cat: 'Комнатные', img: '/uploads/products/1782836889573-e3rdnf.jpg' },
    { name: 'Спатифиллум Шопен', desc: '«Женское счастье» с изящными белыми цветами.', price: 2100, stock: 18, cat: 'Цветущие', img: '/uploads/products/plant-17.jpg' },
    { name: 'Драцена Маргината', desc: 'Эффектное древовидное растение с узкими изогнутыми листьями.', price: 3400, stock: 14, cat: 'Деревья', img: '/uploads/products/plant-28.jpg' },
  ];

  for (const p of products) {
    const exists = await queryOne('SELECT id FROM products WHERE name = ?', [p.name]);
    if (!exists) {
      await run('INSERT INTO products (name, description, price, stock, category, subcategory, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.desc, p.price, p.stock, p.cat, null, p.img]);
    }
  }
  console.log('  + Товары добавлены');

  await pool.end();
  console.log('');
  console.log('База данных успешно инициализирована!');
}

init().catch(err => { console.error('Ошибка:', err); process.exit(1); });
INITEOF

# 3. Создаём deploy-директорию
echo "[3/5] Подготовка deploy-пакета..."
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 4. Копируем файлы
echo "[4/5] Копирование файлов..."
# Используем . (dot) чтобы захватить скрытые папки вроде .next
cp -r .next/standalone/. "$DEPLOY_DIR/"
# Копируем статику (chunks, и т.д.) в .next внутри deploy — её нет в standalone
mkdir -p "$DEPLOY_DIR/.next/static"
cp -r .next/static/. "$DEPLOY_DIR/.next/static/"
# Копируем package-lock для npm ci (если понадобится)
cp package-lock.json "$DEPLOY_DIR/"
# Копируем runtime-зависимости, которые standalone не захватил (mysql2, bcryptjs, uuid)
for pkg in mysql2 bcryptjs uuid tsx; do
  if [ ! -d "$DEPLOY_DIR/node_modules/$pkg" ]; then
    cp -r "node_modules/$pkg" "$DEPLOY_DIR/node_modules/$pkg"
  fi
done
# mysql2 имеет транзитивные зависимости — копируем их
for dep in aws-ssl-profiles denque generate-function iconv-lite long lru.min named-placeholders sql-escaper; do
  if [ ! -d "$DEPLOY_DIR/node_modules/$dep" ]; then
    cp -r "node_modules/$dep" "$DEPLOY_DIR/node_modules/$dep"
  fi
done
# Linux-бинарники sharp для хостинга: сборка на macOS кладёт в пакет только
# macOS-бинарники (@img/sharp-darwin-*), из-за чего HEIC-фото на Linux-хостинге
# не конвертируются (ошибка 500). Дополняем пакет Linux-бинарниками best-effort.
# ВАЖНО: версии должны точно совпадать с версией sharp (0.34.5 -> @img/sharp-* 0.34.5,
# libvips 1.2.4), иначе sharp упадёт на хостинге. Версии берём из локальной установки.
# Устанавливаем во временную папку, а НЕ в deploy/ — иначе npm пересоберёт весь
# node_modules standalone-сборки (+400M). npm блокирует пакеты чужой платформы -> --force.
if [ -d "$DEPLOY_DIR/node_modules/sharp" ]; then
  SHARP_VERSION=$(node -p "require('$ROOT_DIR/node_modules/sharp/package.json').version" 2>/dev/null || echo "")
  LIBVIPS_VERSION=$(node -p "require('$ROOT_DIR/node_modules/sharp/package.json').optionalDependencies['@img/sharp-libvips-linux-x64']" 2>/dev/null || echo "")
  if [ -n "$SHARP_VERSION" ] && [ -n "$LIBVIPS_VERSION" ]; then
    TMP_NPM=""
    if TMP_NPM=$(mktemp -d) && \
       ( cd "$TMP_NPM" && npm install --no-save --force --ignore-scripts \
         "@img/sharp-linux-x64@$SHARP_VERSION" "@img/sharp-libvips-linux-x64@$LIBVIPS_VERSION" \
         "@img/sharp-linux-arm64@$SHARP_VERSION" "@img/sharp-libvips-linux-arm64@$LIBVIPS_VERSION" >/dev/null 2>&1 ) && \
       cp -r "$TMP_NPM/node_modules/@img/." "$DEPLOY_DIR/node_modules/@img/" ; then
      echo "  + Linux-бинарники sharp $SHARP_VERSION добавлены (HEIC на хостинге будет работать)"
    else
      echo "  ! Не удалось добавить Linux-бинарники sharp — HEIC-фото на хостинге работать не будут"
    fi
    [ -n "$TMP_NPM" ] && rm -rf "$TMP_NPM"
  fi
fi
# Копируем public/ — НО БЕЗ папки uploads/!
# Фото, загруженные через админку прямо на хостинге, живут только в
# public/uploads/products на сервере. Если пакет содержит эту папку, FTP-заливка
# перезапишет её и удалит серверные фото (БД продолжит на них ссылаться -> битые картинки).
cp -r public/. "$DEPLOY_DIR/public/"
rm -rf "$DEPLOY_DIR/public/uploads"

# Архив uploads/ — ТОЛЬКО для первого запуска на новом сервере (фото seed-товаров)
if [ -d "$ROOT_DIR/public/uploads" ]; then
  ( cd "$ROOT_DIR/public" && zip -r "$DEPLOY_DIR/uploads.zip" uploads -x "*.DS_Store" >/dev/null )
  echo "  + uploads.zip создан (распаковывать только при первом запуске на новом сервере)"
fi

# Копируем init-db.js
cp "$ROOT_DIR/.temp-init-db.mjs" "$DEPLOY_DIR/init-db.mjs"
rm "$ROOT_DIR/.temp-init-db.mjs"

# Создаём .env.local
cat > "$DEPLOY_DIR/.env.local" << ENVEOF
# MySQL — БД для plant-shop
DATABASE_URL=mysql://gjarrown_user:Qwerty_123!@localhost:3306/gjarrown_plant_shop
ENVEOF

# Скрипт быстрого запуска
cat > "$DEPLOY_DIR/start.sh" << 'STARTEOF'
#!/bin/bash
# Plant Shop — запуск на сервере
cd "$(dirname "$0")"
NODE_ENV=production node server.js
STARTEOF
chmod +x "$DEPLOY_DIR/start.sh"

# 5. Готово
echo "[5/5] Готово!"
DEPLOY_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
echo ""
echo "Размер пакета: $DEPLOY_SIZE"
echo ""
echo "=== Инструкция по деплою ==="
echo ""
echo "1. База данных gjarrown_plant_shop уже создана. Ничего делать не нужно."
echo ""
echo "2. Загрузите папку deploy/ на хостинг через FTP (всё содержимое)."
echo "   ВАЖНО: НЕ удаляйте на сервере папку public/uploads — в ней хранятся"
echo "   фото товаров, загруженные через админку прямо на хостинге. При заливке"
echo "   выбирайте «перезаписать существующие» и НЕ удаляйте файлы, которых нет в пакете."
echo ""
echo "3. ТОЛЬКО при первом запуске на НОВОМ сервере: распакуйте uploads.zip"
echo "   в папку приложения (появится папка public/uploads с фото seed-товаров)."
echo ""
echo "4. Данные БД уже настроены в .env.local:"
echo "   DATABASE_URL=mysql://gjarrown_user:Qwerty_123!@localhost:3306/gjarrown_plant_shop"
echo "   Если хостинг использует другой хост MySQL (не localhost), поправьте вручную."
echo ""
echo "5. Инициализируйте БД (однократно, через SSH):"
echo "   cd ПУТЬ_К_ПАПКЕ_НА_СЕРВЕРЕ"
echo "   DATABASE_URL=mysql://gjarrown_user:Qwerty_123!@localhost:3306/gjarrown_plant_shop node init-db.mjs"
echo ""
echo "6. В ISPmanager настройте Node.js приложение:"
echo "   WWW → Node.js-приложения → Создать"
echo "   - Рабочая директория: путь к папке на сервере"
echo "   - Стартовый файл: server.js"
echo "   - Переменные окружения: DATABASE_URL=mysql://gjarrown_user:Qwerty_123!@localhost:3306/gjarrown_plant_shop"
echo ""
echo "7. Готово! Магазин работает по вашему домену."
echo ""
echo "=== Данные для входа в админку ==="
echo "   Адрес: /admin"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
