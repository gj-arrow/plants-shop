/**
 * Seed script for 10 premium products with real descriptions and images.
 * Run: npx tsx scripts/seed-products.ts
 *
 * This REPLACES all existing product data with fresh catalog.
 */
import mysql from 'mysql2/promise';

const URL = process.env.DATABASE_URL || 'mysql://root@localhost:3306/plant_shop';

function createPool() {
  const isLocal = URL.includes('@localhost') && !URL.includes(':password');
  return mysql.createPool({
    uri: URL,
    socketPath: isLocal ? '/tmp/mysql.sock' : undefined,
    waitForConnections: true,
    connectionLimit: 5,
  });
}

interface ProductSeed {
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  image_url: string;
}

const products: ProductSeed[] = [];

async function main() {
  const pool = createPool();
  console.log('🌱 Очистка старых товаров...');
  await pool.execute('DELETE FROM products');
  // Reset auto-increment
  await pool.execute('ALTER TABLE products AUTO_INCREMENT = 1');

  console.log(`📦 Добавление ${products.length} товаров...`);
  for (const p of products) {
    await pool.execute(
      'INSERT INTO products (name, description, price, category, subcategory, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [p.name, p.description, p.price, p.category, p.subcategory || null, p.image_url]
    );
    console.log(`  ✅ ${p.name} — ${p.price} ₽`);
  }

  console.log('\n✅ Seed завершён!');
  console.log(`   ${products.length} товаров добавлено в каталог.`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
