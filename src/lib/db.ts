import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'plant-shop.db');

const db = new Database(dbPath);

// Инициализация схемы БД
export function initDatabase() {
  // Таблица пользователей
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      auth_provider TEXT DEFAULT 'email',
      auth_provider_id TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица администраторов
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица категорий
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default categories from existing product categories
  const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (existingCategories.count === 0) {
    const defaultCategories = [
      { name: 'Комнатные', description: 'Комнатные растения для дома' },
      { name: 'Деревья', description: 'Декоративные деревья' },
      { name: 'Суккуленты', description: 'Суккуленты и кактусы' },
      { name: 'Папоротники', description: 'Папоротники' },
      { name: 'Цветущие', description: 'Цветущие растения' },
    ];
    const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    for (const cat of defaultCategories) {
      insertCategory.run(cat.name, cat.description);
    }
  }

  // Таблица товаров
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Таблица избранного
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Таблица заказов (обновлена с user_id)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      delivery_method TEXT DEFAULT 'Самовывоз',
      total REAL NOT NULL,
      status TEXT DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Таблица элементов заказа
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Создаём админа по умолчанию (admin/admin123)
  const bcrypt = require('bcryptjs');
  const defaultPasswordHash = bcrypt.hashSync('admin123', 10);

  const existingAdmin = db.prepare('SELECT id FROM admins WHERE username = ?').get('admin');
  if (!existingAdmin) {
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', defaultPasswordHash);
  }

  // Добавляем тестовые товары
  const testProducts = [
    { name: 'Монстера деликатесная', description: 'Крупное тропическое растение с резными листьями. Любит яркий рассеянный свет.', price: 2500, stock: 15, category: 'Комнатные', image_url: '/images/monstera.svg' },
    { name: 'Фикус лирата', description: 'Эффектное дерево с крупными листьями в форме скрипки. Требует хорошего освещения.', price: 4500, stock: 8, category: 'Деревья', image_url: '/images/ficus.svg' },
    { name: 'Сансевиерия', description: 'Неприхотливое растение с мечевидными листьями. Очищает воздух.', price: 1200, stock: 25, category: 'Суккуленты', image_url: '/images/sansevieria.svg' },
    { name: 'Папоротник Нефролепис', description: 'Ампельное растение с ажурными листьями. Любит влажность.', price: 1800, stock: 12, category: 'Папоротники', image_url: '/images/fern.svg' },
    { name: 'Орхидея Фаленопсис', description: 'Элегантная орхидея с долгим цветением. Требует специального ухода.', price: 3200, stock: 10, category: 'Цветущие', image_url: '/images/orchid.svg' },
    { name: 'Кактус Эхинокактус', description: 'Крупный шаровидный кактус. Очень неприхотлив, любит солнце.', price: 1500, stock: 20, category: 'Суккуленты', image_url: '/images/cactus.svg' },
    { name: 'Спатифиллум', description: '«Женское счастье» с белыми цветами. Теневыносливое растение.', price: 1600, stock: 18, category: 'Цветущие', image_url: '/images/spathiphyllum.svg' },
    { name: 'Драцена Маргината', description: 'Дерево с узкими листьями и красной каймой. Растёт медленно.', price: 2800, stock: 14, category: 'Деревья', image_url: '/images/dracaena.svg' },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, stock, category, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const product of testProducts) {
    const exists = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name);
    if (!exists) {
      insertProduct.run(product.name, product.description, product.price, product.stock, product.category, product.image_url);
    }
  }
}

export default db;
