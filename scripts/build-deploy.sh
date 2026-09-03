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

# === Креды НЕ хардкодим: DATABASE_URL обязательна, ADMIN_PASSWORD — опциональна ===
if [ -z "${DATABASE_URL:-}" ]; then
  read -rp "DATABASE_URL (например mysql://user:pass@localhost:3306/plant_shop): " DATABASE_URL
fi
if [ -z "$DATABASE_URL" ]; then
  echo "Ошибка: переменная DATABASE_URL обязательна (строка подключения к MySQL)." >&2
  exit 1
fi

if [ -z "${ADMIN_PASSWORD:-}" ]; then
  read -rsp "ADMIN_PASSWORD (пароль админа для init-db, Enter — сгенерировать случайный): " ADMIN_PASSWORD
  echo
fi

echo "=== Plant Shop — сборка деплой-пакета ==="
echo ""

# 1. Сборка проекта (ограничиваем параллелизм для xS-тарифа NPROC 50)
echo "[1/5] Сборка Next.js (cpus=1, UV_THREADPOOL_SIZE=2)..."
cd "$ROOT_DIR"
# UV_THREADPOOL_SIZE снижает число libuv-тредов при сборке.
# next.config: experimental.cpus=1 уже ограничивает воркеры, но ставим явно на всякий случай.
UV_THREADPOOL_SIZE=2 npm run build

# 2. Создаём init-db.mjs для настройки БД на сервере
echo "[2/5] Создание init-db.mjs..."
cat > "$ROOT_DIR/.temp-init-db.mjs" << 'INITEOF'
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL не задана — укажите строку подключения к MySQL.');
  process.exit(1);
}
const pool = mysql.createPool({ uri: url, waitForConnections: true, connectionLimit: 3, queueLimit: 0 });

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

  // Seed админа: пароль из ADMIN_PASSWORD, иначе — случайный (выводится один раз)
  const crypto = await import('crypto');
  const existing = await queryOne('SELECT id FROM admins WHERE username = ?', ['admin']);
  if (!existing) {
    const seedPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
    const hash = bcrypt.hashSync(seedPassword, 10);
    await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', ['admin', hash]);
    console.log(`  + Админ создан. Логин: admin, пароль: ${seedPassword}`);
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
# MySQL — БД для plant-shop (заполните своими данными; standalone-сервер НЕ читает .env.local,
# DATABASE_URL обязательно задаётся в ISPmanager в переменных окружения Node.js-приложения)
DATABASE_URL=$DATABASE_URL
ENVEOF

# Патчим standalone server.js — добавляем лимиты потоков, graceful shutdown и АВТО-ОЧИСТКУ
# (без SSH: сервер сам убивает зависшие копии, если их >2, иначе NPROC 50 не хватает для рестарта)
if [ -f "$DEPLOY_DIR/server.js" ]; then
  TMP_SERVER=$(mktemp)
  cat > "$TMP_SERVER" << 'PATCHEOF'
// [NPROC 50 fix] Ограничиваем треды до старта сервера
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '2';
try { const _sharp = require('sharp'); _sharp.concurrency(1); _sharp.cache({ files: 0 }); } catch {}
// Graceful shutdown — корректно завершаем процесс по SIGTERM/SIGINT (иначе ISPmanager оставит зомби)
process.on('SIGTERM', () => { console.log('[server] SIGTERM — завершаем'); process.exit(0); });
process.on('SIGINT',  () => { console.log('[server] SIGINT — завершаем');  process.exit(0); });
// [NPROC auto-clean — без SSH, мультисайт] Если зависло >N процессов ЭТОГО приложения — убиваем старые.
// Важно: на одном аккаунте может быть 2 сайта (plant-shop + второй). Чистим ТОЛЬКО свою папку (по /proc/<pid>/cwd),
// чтобы не убить соседний сайт. Работает без pgrep/pkill, через чистый Node.
(function(){
  const PER_APP_THRESHOLD = parseInt(process.env.NPROC_PER_APP_LIMIT || '1', 10); // 1 на сайт = всего 2 процесса на 2 сайта
  const GLOBAL_THRESHOLD = parseInt(process.env.NPROC_GLOBAL_LIMIT || '3', 10); // всего node на аккаунте
  const INTERVAL_MS = 30000;
  const APP_DIR = __dirname;
  function pidBelongsToThisApp(pid){
    try{ const fs=require('fs'); const cwd=fs.readlinkSync('/proc/'+pid+'/cwd'); return cwd===APP_DIR || cwd.startsWith(APP_DIR+'/'); }catch{ return null; } // null = неизвестно (нет /proc) — считаем чужим осторожно
  }
  function autoClean(){
    try{
      const { execSync } = require('child_process');
      let raw = '';
      try{ raw = execSync('pgrep -f "node.*server\\.js" 2>/dev/null || true', {encoding:'utf8'}); }catch{}
      let allPids = raw.split('\n').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n));
      if(allPids.length===0){
        try{
          const out = execSync('ps -eo pid,command 2>/dev/null || ps aux 2>/dev/null || true', {encoding:'utf8'});
          allPids = out.split('\n').filter(l=>l.includes('server.js') && l.includes('node')).map(l=>{
            const m=l.trim().match(/^(\d+)/); return m?parseInt(m[1],10):NaN;
          }).filter(n=>!isNaN(n));
        }catch{}
      }
      if(allPids.length===0) allPids=[process.pid];
      // Фильтруем только пиды этого приложения (по cwd), если /proc доступен — точно, иначе fallback по всем
      let myPids = [];
      let unknown = false;
      for(const pid of allPids){
        const belongs = pidBelongsToThisApp(pid);
        if(belongs===true) myPids.push(pid);
        else if(belongs===null) unknown=true;
      }
      // если /proc недоступен — считаем что все пиды наши (старый fallback), но с повышенным порогом
      if(unknown && myPids.length===0) myPids = allPids;
      // если мы точно определили — чистим только своё
      if(myPids.length===0) myPids=[process.pid];
      const myTotal = myPids.length;
      // 1) per-app лимит
      if(myTotal > PER_APP_THRESHOLD){
        const others = myPids.filter(pid=>pid!==process.pid).sort((a,b)=>a-b);
        const toKill = others.slice(0, myTotal - PER_APP_THRESHOLD);
        if(toKill.length){
          console.log('[autoclean] per-app: '+myTotal+'/'+PER_APP_THRESHOLD+' в '+APP_DIR+', убиваю '+toKill.join(','));
          toKill.forEach(pid=>{ try{ process.kill(pid,'SIGTERM'); }catch{ try{ execSync('kill '+pid+' 2>/dev/null || true'); }catch{} } });
          setTimeout(()=>{ toKill.forEach(pid=>{ try{ process.kill(pid,0); process.kill(pid,'SIGKILL'); }catch{} try{ execSync('kill -9 '+pid+' 2>/dev/null || true'); }catch{} }); },2500);
        }
      }
      // 2) глобальный лимит на аккаунте (если можем посчитать все node)
      try{
        let totalNode = 0;
        try{ const c=execSync('pgrep -c node 2>/dev/null || pgrep -f node 2>/dev/null | wc -l', {encoding:'utf8'}); totalNode=parseInt(c.trim(),10)||0; }catch{ totalNode=allPids.length; }
        if(totalNode > GLOBAL_THRESHOLD){
          console.log('[autoclean] global: всего node '+totalNode+'/'+GLOBAL_THRESHOLD+' — проверь второй сайт, ставь NPROC_PER_APP_LIMIT=1 и UV_THREADPOOL_SIZE=2');
        }
      }catch{}
    }catch(e){}
  }
  setTimeout(autoClean, 7000);
  setInterval(autoClean, INTERVAL_MS);
})();
PATCHEOF
  cat "$DEPLOY_DIR/server.js" >> "$TMP_SERVER"
  mv "$TMP_SERVER" "$DEPLOY_DIR/server.js"
  echo "  + server.js патчен: UV_THREADPOOL_SIZE=2, sharp.concurrency(1), SIGTERM-handler, auto-clean >2 процессов"
fi

# Скрипт быстрого запуска (NPROC-оптимизирован, мультисайт)
cat > "$DEPLOY_DIR/start.sh" << 'STARTEOF'
#!/bin/bash
# Plant Shop — запуск на сервере (NPROC 50 оптимизация, 2 сайта на одном аккаунте)
# Каждый сайт = ~8 тредов (UV=2 + sharp=1). 2 сайта = ~16 тредов + система ~10 = запас до 50.
# Чистим ТОЛЬКО процессы своей папки (по /proc/<pid>/cwd), чтобы не убить второй сайт.
cd "$(dirname "$0")"
APP_DIR="$(pwd)"
export NODE_ENV=production
export UV_THREADPOOL_SIZE=2
export DB_POOL_LIMIT=3
export NPROC_PER_APP_LIMIT=1
export NPROC_GLOBAL_LIMIT=3
export NODE_OPTIONS="--max-old-space-size=512 ${NODE_OPTIONS:-}"

# Авто-очистка зависших server.js ЭТОГО приложения (если их >1, убиваем старые)
# Работает с /proc/cwd, без pkill — безопасно для второго сайта
CLEANED=0
for pid in $(pgrep -f "node.*server\.js" 2>/dev/null || ps -eo pid,command 2>/dev/null | awk '/node.*server\.js/{print $1}'); do
  [ -z "$pid" ] && continue
  # проверяем, что это наша папка
  if [ -e "/proc/$pid/cwd" ]; then
    LINK=$(readlink "/proc/$pid/cwd" 2>/dev/null || echo "")
    case "$LINK" in
      "$APP_DIR"|"$APP_DIR"/*) ;; # наш — чистим
      *) continue ;; # чужой сайт — пропускаем
    esac
  fi
  # не убиваем себя (ещё не запущен, но на всякий)
  if [ "$pid" = "$$" ]; then continue; fi
  # считаем — убиваем, оставляя 1 (текущий будущий + самый свежий)
  # Простая стратегия: если нашли >1 процесса этого приложения до старта — убиваем все старые
  echo "[start.sh] найден зависший $pid ($LINK) — SIGTERM"
  kill "$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  CLEANED=1
done
if [ "$CLEANED" = "1" ]; then
  sleep 2
  for pid in $(pgrep -f "node.*server\.js" 2>/dev/null || ps -eo pid,command 2>/dev/null | awk '/node.*server\.js/{print $1}'); do
    [ -e "/proc/$pid/cwd" ] && [ "$(readlink /proc/$pid/cwd 2>/dev/null)" != "$APP_DIR" ] && [ "$(readlink /proc/$pid/cwd 2>/dev/null)" != "$APP_DIR/"* ] && continue
    kill -0 "$pid" 2>/dev/null && echo "[start.sh] SIGKILL $pid" && kill -9 "$pid" 2>/dev/null || true
  done
  sleep 1
fi

echo "[start.sh] APP_DIR=$APP_DIR UV_THREADPOOL_SIZE=$UV_THREADPOOL_SIZE DB_POOL_LIMIT=$DB_POOL_LIMIT NPROC_PER_APP_LIMIT=$NPROC_PER_APP_LIMIT"
exec node server.js
STARTEOF
chmod +x "$DEPLOY_DIR/start.sh"

# Диагностика NPROC для хостинга
cat > "$DEPLOY_DIR/check-nproc.sh" << 'CHECKEOF'
#!/bin/bash
# Диагностика лимита NPROC 50
echo "=== NPROC диагностика ==="
echo "Лимит (ulimit -u): $(ulimit -u 2>/dev/null || echo 'недоступно')"
echo ""
echo "Процессы пользователя ($USER):"
ps -u "$USER" -o pid,ppid,nlwp,cmd 2>/dev/null | head -n 50 || ps aux 2>/dev/null | head -n 50
echo ""
echo "Треды (LWP) всего у пользователя:"
ps -u "$USER" -o nlwp= 2>/dev/null | awk '{s+=$1} END {print s " тредов"}' || echo "ps -L недоступен"
echo ""
echo "Node процессы:"
pgrep -a node 2>/dev/null || ps aux 2>/dev/null | grep -i node | grep -v grep || echo "нет Node процессов"
echo ""
echo "Проверка лимита: $(ps -u $USER -o nlwp= 2>/dev/null | awk '{s+=$1} END {print s}') / $(ulimit -u) (используется/лимит)"
CHECKEOF
chmod +x "$DEPLOY_DIR/check-nproc.sh"

# 5. Готово
echo "[5/5] Готово!"
DEPLOY_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
echo ""
echo "Размер пакета: $DEPLOY_SIZE"
echo ""
echo "=== Инструкция по деплою ==="
echo ""
echo "1. База данных: укажите вашу БД в переменной DATABASE_URL при сборке"
echo "   и при настройке приложения в ISPmanager (см. п.6)."
echo ""
echo "2. Загрузите папку deploy/ на хостинг через FTP (всё содержимое)."
echo "   ВАЖНО: НЕ удаляйте на сервере папку public/uploads — в ней хранятся"
echo "   фото товаров, загруженные через админку прямо на хостинге. При заливке"
echo "   выбирайте «перезаписать существующие» и НЕ удаляйте файлы, которых нет в пакете."
echo ""
echo "3. ТОЛЬКО при первом запуске на НОВОМ сервере: распакуйте uploads.zip"
echo "   в папку приложения (появится папка public/uploads с фото seed-товаров)."
echo ""
echo "4. Данные БД прописаны в .env.local (переменная DATABASE_URL из текущей сборки)."
echo "   Если хостинг использует другой хост MySQL (не localhost), поправьте вручную."
echo ""
echo "5. Инициализируйте БД (однократно, через SSH):"
echo "   cd ПУТЬ_К_ПАПКЕ_НА_СЕРВЕРЕ"
echo "   DATABASE_URL=\"$DATABASE_URL\" ADMIN_PASSWORD=\"$ADMIN_PASSWORD\" node init-db.mjs"
echo "   (если ADMIN_PASSWORD не задана, init-db создаст админа со случайным паролем и выведет его один раз)"
echo ""
echo "6. В ISPmanager настройте Node.js приложение:"
echo "   WWW → Node.js-приложения → Создать"
echo "   - Рабочая директория: путь к папке на сервере"
echo "   - Стартовый файл: server.js"
echo "   - Переменные окружения:"
echo "       DATABASE_URL=\"$DATABASE_URL\""
echo "       UV_THREADPOOL_SIZE=2"
echo "       DB_POOL_LIMIT=3"
echo "       NPROC_PER_APP_LIMIT=1"
echo "       NPROC_GLOBAL_LIMIT=3"
echo "       NODE_OPTIONS=--max-old-space-size=512"
echo "   - Режим: production, количество экземпляров/воркеров = 1 (НЕ cluster!)"
echo "   - Авто-очистка: server.js теперь сам убивает зависшие копии своей папки (>1) каждые 30с — без SSH, безопасно для второго сайта"
echo "   - После рестарта проверьте: ./check-nproc.sh (или ps -u \$USER -L | wc -l)"
echo ""
echo "6b. Если ставите ВТОРОЙ сайт на этом же аккаунте (тот же xS 50 NPROC):"
echo "   - Каждое Node-приложение = ~8 тредов (UV=2+sharp=1). 2 сайта = ~16 + система ~10 = ~26/50 — запас есть"
echo "   - Для второго сайта в его server.js/app.js вставьте тот же блок авто-очистки из plant-shop (см. scripts/nproc-autoclean-snippet.js)"
echo "   - В его ISPmanager-переменных задайте: UV_THREADPOOL_SIZE=2, NPROC_PER_APP_LIMIT=1, NODE_OPTIONS=--max-old-space-size=256 (или 512)"
echo "   - Обязательно разные папки! Авто-очистка различает сайты по /proc/<pid>/cwd и не трогает чужой"
echo "   - Собирайте ВТОРОЙ сайт тоже локально (npm run build дома), не на хостинге — параллельные сборки жрут NPROC"
echo "   - Не используйте cluster/PM2 с инстансами >1 — каждый форк удваивает треды"
echo ""
echo "7. Готово! Магазин работает по вашему домену."
echo ""
echo "=== Данные для входа в админку ==="
echo "   Адрес: /admin"
echo "   Логин: admin"
if [ -n "$ADMIN_PASSWORD" ]; then
  echo "   Пароль: задан через ADMIN_PASSWORD (см. вывод init-db при первом запуске)"
else
  echo "   Пароль: случайный, будет выведен init-db при первом запуске на сервере"
fi
echo ""
