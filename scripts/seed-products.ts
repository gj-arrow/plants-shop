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
  stock: number;
  category: string;
  image_url: string;
}

const products: ProductSeed[] = [
  {
    name: 'Монстера деликатесная',
    description:
      'Крупное тропическое растение с эффектными резными листьями. В природе достигает 10 м, в комнатных условиях — 2–3 м. Любит яркий рассеянный свет и регулярное опрыскивание. Отлично очищает воздух и создаёт атмосферу настоящих джунглей.',
    price: 3500,
    stock: 12,
    category: 'Комнатные',
    image_url: '/uploads/products/plant-17.jpg',
  },
  {
    name: 'Фикус лирата',
    description:
      'Эффектное вечнозелёное дерево с крупными волнистыми листьями, напоминающими скрипку. Вырастает до 2–3 м в помещении. Предпочитает хорошее освещение без прямых солнечных лучей. Полив умеренный, после просыхания верхнего слоя почвы.',
    price: 5200,
    stock: 7,
    category: 'Деревья',
    image_url: '/uploads/products/plant-28.jpg',
  },
  {
    name: 'Сансевиерия цилиндрическая',
    description:
      'Неприхотливый суккулент с необычными трубчатыми листьями, собранными в веер. Одно из самых выносливых растений — прощает пропуски полива и растёт при любом освещении. Отлично очищает воздух от токсинов. Идеально для начинающих.',
    price: 1800,
    stock: 25,
    category: 'Суккуленты',
    image_url: '/uploads/products/1782836700125-pp051k.jpg',
  },
  {
    name: 'Папоротник Нефролепис',
    description:
      'Пышный ампельный папоротник с ажурными вайями длиной до 60 см. Создаёт эффект зелёного облака. Любит повышенную влажность и полутень. Прекрасно смотрится в подвесных кашпо и на высоких подставках.',
    price: 2200,
    stock: 10,
    category: 'Папоротники',
    image_url: '/uploads/products/1782836815587-uipyl4.jpg',
  },
  {
    name: 'Орхидея Фаленопсис',
    description:
      'Элегантная орхидея с крупными цветами, напоминающими тропических бабочек. Цветёт до 3–4 месяцев дважды в год. Не требует специального ухода — достаточно полива раз в 7–10 дней и рассеянного света. Прекрасный живой букет.',
    price: 3800,
    stock: 8,
    category: 'Цветущие',
    image_url: '/uploads/products/1782836856906-jn32rh.jpg',
  },
  {
    name: 'Эхинокактус Грусона',
    description:
      'Крупный шаровидный кактус, известный как «тещин стул». В природе достигает 1 м в диаметре. Очень неприхотлив — любит яркое солнце и редкий полив. Золотистые колючки придают ему декоративный вид круглый год.',
    price: 2000,
    stock: 18,
    category: 'Суккуленты',
    image_url: '/uploads/products/1782836889573-e3rdnf.jpg',
  },
  {
    name: 'Спатифиллум Шопен',
    description:
      '«Женское счастье» — популярное комнатное растение с изящными белыми цветами-покрывалами. Цветёт несколько раз в год даже при искусственном освещении. Теневыносливо, предпочитает умеренный полив и опрыскивание. Очищает воздух.',
    price: 2100,
    stock: 15,
    category: 'Цветущие',
    image_url: '/uploads/products/plant-17.jpg',
  },
  {
    name: 'Драцена Маргината',
    description:
      'Эффектное древовидное растение с узкими изогнутыми листьями и красной каймой. Вырастает до 2 м в высоту. Растёт медленно, что удобно для небольших помещений. Предпочитает умеренное освещение и редкий полив.',
    price: 3400,
    stock: 11,
    category: 'Деревья',
    image_url: '/uploads/products/plant-28.jpg',
  },
  {
    name: 'Замиокулькас',
    description:
      'Модное неприхотливое растение с глянцевыми тёмно-зелёными листьями на толстых черешках. Выдерживает редкий полив и низкую освещённость. Растёт медленно, но может достигать 1–1,5 м. Отлично подходит для офисов и квартир.',
    price: 2800,
    stock: 14,
    category: 'Комнатные',
    image_url: '/uploads/products/1782836700125-pp051k.jpg',
  },
  {
    name: 'Пеперомия туполистная',
    description:
      'Компактное растение с мясистыми округлыми листьями. Идеально для небольших пространств и террариумов. Предпочитает яркий рассеянный свет и умеренный полив. Существует множество сортов с разнообразной окраской листьев.',
    price: 1500,
    stock: 20,
    category: 'Комнатные',
    image_url: '/uploads/products/1782836815587-uipyl4.jpg',
  },
];

async function main() {
  const pool = createPool();
  console.log('🌱 Очистка старых товаров...');
  await pool.execute('DELETE FROM products');
  // Reset auto-increment
  await pool.execute('ALTER TABLE products AUTO_INCREMENT = 1');

  console.log(`📦 Добавление ${products.length} товаров...`);
  for (const p of products) {
    await pool.execute(
      'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [p.name, p.description, p.price, p.stock, p.category, p.image_url]
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
