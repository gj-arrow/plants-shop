import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

function createPool() {
  const url = process.env.DATABASE_URL || 'mysql://root@localhost:3306/plant_shop';
  // На локальном localhost используем Unix socket (обход проблем с auth_socket)
  const isLocal = url.includes('@localhost') && !url.includes(':password');
  const socketPath = isLocal ? '/tmp/mysql.sock' : undefined;
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
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default categories from existing product categories
  const existingCatCount = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (existingCatCount && existingCatCount.count === 0) {
    const defaultCategories = [
      { name: 'Комнатные', description: 'Комнатные растения для дома' },
      { name: 'Деревья', description: 'Декоративные деревья' },
      { name: 'Суккуленты', description: 'Суккуленты и кактусы' },
      { name: 'Папоротники', description: 'Папоротники' },
      { name: 'Цветущие', description: 'Цветущие растения' },
    ];
    for (const cat of defaultCategories) {
      await run('INSERT INTO categories (name, description) VALUES (?, ?)', [
        cat.name,
        cat.description,
      ]);
    }
  }

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Создаём админа по умолчанию (admin/admin123)
  const defaultPasswordHash = bcrypt.hashSync('admin123', 10);
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

  // Добавляем тестовые товары (используем реальные изображения из uploads/)
  const testProducts = [
    {
      name: 'Монстера деликатесная',
      description: 'Крупное тропическое растение с эффектными резными листьями. Любит яркий рассеянный свет и регулярное опрыскивание.',
      price: 3500,
      stock: 15,
      category: 'Комнатные',
      image_url: '/uploads/products/plant-17.jpg',
    },
    {
      name: 'Фикус лирата',
      description: 'Эффектное вечнозелёное дерево с крупными волнистыми листьями. Предпочитает хорошее освещение и умеренный полив.',
      price: 5200,
      stock: 8,
      category: 'Деревья',
      image_url: '/uploads/products/plant-28.jpg',
    },
    {
      name: 'Сансевиерия цилиндрическая',
      description: 'Неприхотливый суккулент с необычными трубчатыми листьями. Прощает пропуски полива, растёт при любом освещении.',
      price: 1800,
      stock: 25,
      category: 'Суккуленты',
      image_url: '/uploads/products/1782836700125-pp051k.jpg',
    },
    {
      name: 'Папоротник Нефролепис',
      description: 'Пышный ампельный папоротник с ажурными вайями. Любит повышенную влажность и полутень.',
      price: 2200,
      stock: 12,
      category: 'Папоротники',
      image_url: '/uploads/products/1782836815587-uipyl4.jpg',
    },
    {
      name: 'Орхидея Фаленопсис',
      description: 'Элегантная орхидея с крупными цветами. Цветёт до 3–4 месяцев дважды в год. Любит рассеянный свет.',
      price: 3800,
      stock: 10,
      category: 'Цветущие',
      image_url: '/uploads/products/1782836856906-jn32rh.jpg',
    },
    {
      name: 'Эхинокактус Грусона',
      description: 'Крупный шаровидный кактус, известный как «тещин стул». Очень неприхотлив — любит яркое солнце и редкий полив.',
      price: 2000,
      stock: 20,
      category: 'Суккуленты',
      image_url: '/uploads/products/1782836889573-e3rdnf.jpg',
    },
    {
      name: 'Спатифиллум Шопен',
      description: '«Женское счастье» с изящными белыми цветами. Цветёт несколько раз в год, теневынослив.',
      price: 2100,
      stock: 18,
      category: 'Цветущие',
      image_url: '/uploads/products/plant-17.jpg',
    },
    {
      name: 'Драцена Маргината',
      description: 'Эффектное древовидное растение с узкими изогнутыми листьями и красной каймой. Растёт медленно, до 2 м.',
      price: 3400,
      stock: 14,
      category: 'Деревья',
      image_url: '/uploads/products/plant-28.jpg',
    },
  ];

  for (const product of testProducts) {
    const exists = await queryOne<{ id: number }>(
      'SELECT id FROM products WHERE name = ?',
      [product.name]
    );
    if (!exists) {
      await run(
        'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [
          product.name,
          product.description,
          product.price,
          product.stock,
          product.category,
          product.image_url,
        ]
      );
    }
  }
}

export default pool;
