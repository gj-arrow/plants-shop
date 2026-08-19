import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

function createPool() {
  const url = process.env.DATABASE_URL || 'mysql://root@localhost:3306/plant_shop';
  // Unix socket (только для локальной разработки, если MySQL без пароля)
  // На сервере задайте MYSQL_SOCKET_PATH, если нужно принудительно указать сокет
  const socketPath = process.env.MYSQL_SOCKET_PATH
    || (url.includes('@localhost') && !url.includes(':password') ? '/tmp/mysql.sock' : undefined);
  return mysql.createPool({
    uri: url,
    socketPath,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

const pool = createPool();

export async function queryAll<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const [rows] = await pool.execute(sql, params);
  return (rows as T[])[0] || null;
}

export async function run(
  sql: string,
  params?: any[]
): Promise<{ insertId: number; affectedRows: number }> {
  const [result] = await pool.execute(sql, params);
  return result as unknown as { insertId: number; affectedRows: number };
}

// Инициализация схемы БД
export async function initDatabase() {
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

  // Миграция: удаляем колонку description, если она ещё существует
  try {
    await pool.execute('ALTER TABLE categories DROP COLUMN description');
  } catch {
    // колонки уже нет — ок
  }

  // Seed default categories from existing product categories
  const existingCatCount = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (existingCatCount && existingCatCount.count === 0) {
    const defaultCategories = ['Комнатные', 'Деревья', 'Цветущие'];
    for (const name of defaultCategories) {
      await run('INSERT INTO categories (name) VALUES (?)', [name]);
    }
  }

  // Таблица товаров
  await pool.execute(`
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

  // Миграция: добавляем колонку subcategory, если её нет
  try {
    await pool.execute('ALTER TABLE products ADD COLUMN subcategory VARCHAR(255) AFTER category');
  } catch {
    // колонка уже существует — ок
  }

  // Миграция: добавляем колонку out_of_stock, если её нет
  try {
    await pool.execute('ALTER TABLE products ADD COLUMN out_of_stock TINYINT(1) NOT NULL DEFAULT 0 AFTER subcategory');
  } catch {
    // колонка уже существует — ок
  }

  // Создаём админа по умолчанию.
  // Пароль берётся из ADMIN_PASSWORD; для локальной разработки — fallback 'admin123'.
  // Админ создаётся только если его ещё нет (существующий пароль не перезаписывается).
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
}

export default pool;
