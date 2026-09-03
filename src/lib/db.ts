import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Определяет, использовать ли Unix-сокет для подключения к MySQL.
function resolveSocketPath(url: string): string | undefined {
  if (process.env.MYSQL_SOCKET_PATH) {
    return process.env.MYSQL_SOCKET_PATH;
  }
  try {
    const parsed = new URL(url);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    return isLocalHost && parsed.password === '' ? '/tmp/mysql.sock' : undefined;
  } catch {
    return undefined;
  }
}

function shouldUseMySql(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  // На Windows локальный MySQL без пароля через /tmp/mysql.sock не работает — используем SQLite
  try {
    const parsed = new URL(url);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (isLocalHost && parsed.password === '') {
      // Если явно не указан MYSQL_SOCKET_PATH и мы на win32 — точно нет сокета
      if (process.platform === 'win32') return false;
      // Даже на Linux — если сокет файла нет, лучше fallback, но оставляем MySQL попытку
      // Для локальной разработки без MySQL используем SQLite
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

const useMySql = shouldUseMySql();

let pool: mysql.Pool | null = null;
let sqliteDb: any = null;

function getPool(): mysql.Pool {
  if (pool) return pool;
  const url = process.env.DATABASE_URL || 'mysql://root@localhost:3306/plant_shop';
  const socketPath = resolveSocketPath(url);
  pool = mysql.createPool({
    uri: url,
    socketPath,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  return pool;
}

function getSqlite(): any {
  if (sqliteDb) return sqliteDb;
  // lazy require чтобы не падать на хостинге где нет better-sqlite3
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'plant-shop.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  return sqliteDb;
}

export async function queryAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  if (useMySql) {
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return rows as T[];
  } else {
    const db = getSqlite();
    const stmt = db.prepare(sql);
    const rows = stmt.all(...(params || []));
    return rows as T[];
  }
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  if (useMySql) {
    const p = getPool();
    const [rows] = await p.execute(sql, params);
    return (rows as T[])[0] || null;
  } else {
    const db = getSqlite();
    const stmt = db.prepare(sql);
    const row = stmt.get(...(params || []));
    return (row as T) || null;
  }
}

export async function run(
  sql: string,
  params?: any[]
): Promise<{ insertId: number; affectedRows: number }> {
  if (useMySql) {
    const p = getPool();
    const [result] = await p.execute(sql, params);
    return result as unknown as { insertId: number; affectedRows: number };
  } else {
    const db = getSqlite();
    const stmt = db.prepare(sql);
    const result = stmt.run(...(params || []));
    return { insertId: Number(result.lastInsertRowid) || 0, affectedRows: Number(result.changes) || 0 };
  }
}

// Инициализация схемы БД
export async function initDatabase() {
  if (useMySql) {
    const p = getPool();
    await p.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await p.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await p.execute('ALTER TABLE categories DROP COLUMN description');
    } catch {}
    const existingCatCount = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories'
    );
    if (existingCatCount && existingCatCount.count === 0) {
      const defaultCategories = ['Комнатные', 'Деревья', 'Цветущие'];
      for (const name of defaultCategories) {
        await run('INSERT INTO categories (name) VALUES (?)', [name]);
      }
    }
    await p.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        category VARCHAR(255),
        subcategory VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await p.execute('ALTER TABLE products ADD COLUMN subcategory VARCHAR(255) AFTER category');
    } catch {}
    try {
      await p.execute('ALTER TABLE products ADD COLUMN out_of_stock TINYINT(1) NOT NULL DEFAULT 0 AFTER subcategory');
    } catch {}
    const defaultPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    const existingAdmin = await queryOne<{ id: number }>(
      'SELECT id FROM admins WHERE username = ?',
      ['admin']
    );
    if (!existingAdmin) {
      await run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', [
        'admin',
        defaultPasswordHash,
      ]);
    }
  } else {
    const db = getSqlite();
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
    // Удалить description если осталась от старой схемы
    try {
      const cols = db.prepare("PRAGMA table_info(categories)").all() as any[];
      if (cols.some((c: any) => c.name === 'description')) {
        // SQLite не поддерживает DROP COLUMN в старых версиях — пересоздаём таблицу
        db.exec(`
          CREATE TABLE IF NOT EXISTS categories_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
          INSERT OR IGNORE INTO categories_new (id, name, created_at) SELECT id, name, created_at FROM categories;
          DROP TABLE categories;
          ALTER TABLE categories_new RENAME TO categories;
        `);
      }
    } catch {}

    const existingCatCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
    if (existingCatCount.count === 0) {
      const defaultCategories = ['Комнатные', 'Деревья', 'Цветущие'];
      const stmt = db.prepare('INSERT INTO categories (name) VALUES (?)');
      for (const name of defaultCategories) {
        stmt.run(name);
      }
    }

    const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
    if (!existingAdmin) {
      const defaultPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
      db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', defaultPasswordHash);
    }
  }
}

export default useMySql ? getPool() : null;
