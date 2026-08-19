export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  subcategory?: string;
  out_of_stock?: boolean | number;
  created_at?: string;
}

// Punycode-форма домена цветы-людмилы.бел
export const SITE_URL = 'https://xn----ctbhcrqcg4cxb8cg8a.xn--90ais';

// Собирает SEO description для страницы товара:
// «Категория / Подкатегория. Описание без блоков «Цена: …», переносы строк → «, ». Доставка по Беларуси…»
export function buildSeoDescription(
  product: Pick<Product, 'category' | 'subcategory' | 'description'>
): string {
  const categoryPart = [product.category, product.subcategory].filter(Boolean).join(' / ');
  const rawDescription = (product.description || '')
    // Убрать блоки «| Цена: N р.» вместе с пробелом перед пайпом
    .replace(/\s*\|\s*Цена:[^|\n]*/gi, '')
    // Переносы строк → «, »
    .replace(/\n+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();

  const pieces = [categoryPart, rawDescription, 'Доставка по Беларуси: Европочта, Белпочта.'].filter(Boolean);
  let description = pieces.join('. ').replace(/\.\s*\./g, '.').trim();

  // Обрезать до ~160 символов, не разрывая слово
  if (description.length > 160) {
    const cut = description.slice(0, 157);
    const lastSpace = cut.lastIndexOf(' ');
    description = (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
  }
  return description;
}

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return String(price);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '');
}

export function parseImages(product: Product): string[] {
  if (!product.image_url) return [];
  try {
    const parsed = JSON.parse(product.image_url);
    return Array.isArray(parsed) ? parsed : [product.image_url];
  } catch {
    return [product.image_url];
  }
}

// Категории, где перед ценой не выводится «от» (цена фиксированная)
const NO_PRICE_PREFIX_CATEGORIES: string[] = ['Гортензии'];

export function showPriceFrom(product: Pick<Product, 'category'>): boolean {
  return !product.category || !NO_PRICE_PREFIX_CATEGORIES.includes(product.category);
}
