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

  // Добавляем тестовые товары
  const testProducts = [
    {
      name: 'Монстера деликатесная',
      description: 'Крупное тропическое растение с резными листьями. Любит яркий рассеянный свет.',
      price: 2500,
      stock: 15,
      category: 'Комнатные',
      image_url: '/images/monstera.svg',
    },
    {
      name: 'Фикус лирата',
      description: 'Эффектное дерево с крупными листьями в форме скрипки. Требует хорошего освещения.',
      price: 4500,
      stock: 8,
      category: 'Деревья',
      image_url: '/images/ficus.svg',
    },
    {
      name: 'Сансевиерия',
      description: 'Неприхотливое растение с мечевидными листьями. Очищает воздух.',
      price: 1200,
      stock: 25,
      category: 'Суккуленты',
      image_url: '/images/sansevieria.svg',
    },
    {
      name: 'Папоротник Нефролепис',
      description: 'Ампельное растение с ажурными листьями. Любит влажность.',
      price: 1800,
      stock: 12,
      category: 'Папоротники',
      image_url: '/images/fern.svg',
    },
    {
      name: 'Орхидея Фаленопсис',
      description: 'Элегантная орхидея с долгим цветением. Требует специального ухода.',
      price: 3200,
      stock: 10,
      category: 'Цветущие',
      image_url: '/images/orchid.svg',
    },
    {
      name: 'Кактус Эхинокактус',
      description: 'Крупный шаровидный кактус. Очень неприхотлив, любит солнце.',
      price: 1500,
      stock: 20,
      category: 'Суккуленты',
      image_url: '/images/cactus.svg',
    },
    {
      name: 'Спатифиллум',
      description: '«Женское счастье» с белыми цветами. Теневыносливое растение.',
      price: 1600,
      stock: 18,
      category: 'Цветущие',
      image_url: '/images/spathiphyllum.svg',
    },
    {
      name: 'Драцена Маргината',
      description: 'Дерево с узкими листьями и красной каймой. Растёт медленно.',
      price: 2800,
      stock: 14,
      category: 'Деревья',
      image_url: '/images/dracaena.svg',
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
