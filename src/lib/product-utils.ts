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
