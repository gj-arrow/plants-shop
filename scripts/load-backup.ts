import fs from 'fs';
import path from 'path';
// @ts-ignore
import Database from 'better-sqlite3';

const dumpPath = path.join(process.cwd(), 'gjarrown_plant_shop.sql');
const dbPath = path.join(process.cwd(), 'plant-shop.db');

const sql = fs.readFileSync(dumpPath, 'utf8');

// Удалим старую БД, чтобы импорт был чистым (как на хостинге — DROP TABLE)
if (fs.existsSync(dbPath)) {
  try { fs.unlinkSync(dbPath); } catch {}
  // также удалить -wal/-shm
  try { fs.unlinkSync(dbPath + '-wal'); } catch {}
  try { fs.unlinkSync(dbPath + '-shm'); } catch {}
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Создаём таблицы в SQLite-совместимом виде (берём структуру из дампа)
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT,
    subcategory TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    out_of_stock INTEGER NOT NULL DEFAULT 0
  );
`);

// Парсим INSERT INTO statements из дампа и выполняем их через sqlite
// Извлекаем все INSERT INTO `table` VALUES ...; блоки
const insertRegex = /INSERT INTO `(\w+)` VALUES\s*([\s\S]*?);/g;
let match: RegExpExecArray | null;
let total = 0;

while ((match = insertRegex.exec(sql)) !== null) {
  const table = match[1];
  const valuesBlock = match[2].trim();
  // valuesBlock — это список кортежей: (1,'a',...),(2,'b',...)
  // Разбираем на отдельные кортежи с учётом кавычек
  const tuples: string[] = [];
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;
  let start = 0;
  for (let i = 0; i < valuesBlock.length; i++) {
    const ch = valuesBlock[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (!inSingle && !inDouble) {
      if (ch === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          tuples.push(valuesBlock.slice(start, i + 1));
        }
      }
    }
  }

  console.log(`Найдено ${tuples.length} строк для таблицы ${table}`);

  for (const tuple of tuples) {
    // tuple = (1,'admin','hash','2026-06-30 ...')
    // Убираем внешние скобки
    const inner = tuple.slice(1, -1);
    // Парсим значения внутри кортежа: split по запятым вне кавычек
    const values: any[] = [];
    let cur = '';
    let sInSingle = false;
    let sInDouble = false;
    let sEscape = false;
    for (let i = 0; i < inner.length; i++) {
      const ch = inner[i];
      if (sEscape) { cur += ch; sEscape = false; continue; }
      if (ch === '\\') { sEscape = true; cur += ch; continue; }
      if (ch === "'" && !sInDouble) { sInSingle = !sInSingle; cur += ch; continue; }
      if (ch === '"' && !sInSingle) { sInDouble = !sInDouble; cur += ch; continue; }
      if (ch === ',' && !sInSingle && !sInDouble) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());

    // Преобразуем SQL-литералы в JS значения
    const jsValues = values.map(v => {
      if (v === 'NULL') return null;
      if (v.startsWith("'") && v.endsWith("'")) {
        // убираем внешние кавычки и разэкранируем
        let s = v.slice(1, -1);
        s = s.replace(/\\'/g, "'").replace(/''/g, "'").replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return s;
      }
      // числа
      if (!isNaN(Number(v))) return Number(v);
      return v;
    });

    try {
      if (table === 'admins') {
        db.prepare('INSERT INTO admins (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)').run(jsValues[0], jsValues[1], jsValues[2], jsValues[3]);
      } else if (table === 'categories') {
        db.prepare('INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)').run(jsValues[0], jsValues[1], jsValues[2]);
      } else if (table === 'products') {
        // дамп: id, name, description, price, image_url, category, subcategory, created_at, out_of_stock
        db.prepare('INSERT INTO products (id, name, description, price, image_url, category, subcategory, created_at, out_of_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
          jsValues[0], jsValues[1], jsValues[2], jsValues[3], jsValues[4], jsValues[5], jsValues[6], jsValues[7], jsValues[8]
        );
      }
      total++;
    } catch (e: any) {
      console.error(`Ошибка вставки в ${table}:`, e.message, 'values:', jsValues.slice(0, 3));
    }
  }
}

// Поправим sqlite_sequence для корректного AUTOINCREMENT
try {
  const maxProd = db.prepare('SELECT MAX(id) as m FROM products').get() as any;
  if (maxProd?.m) db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'products'").run(maxProd.m);
} catch {}
try {
  const maxCat = db.prepare('SELECT MAX(id) as m FROM categories').get() as any;
  if (maxCat?.m) db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'categories'").run(maxCat.m);
} catch {}

console.log(`\nИмпорт завершён. Всего вставлено строк: ${total}`);
console.log('admins:', db.prepare('SELECT COUNT(*) as c FROM admins').get());
console.log('categories:', db.prepare('SELECT COUNT(*) as c FROM categories').get());
console.log('products:', db.prepare('SELECT COUNT(*) as c FROM products').get());
console.log('Пример продукта:', db.prepare('SELECT id, name, category, price FROM products LIMIT 3').all());

db.close();
