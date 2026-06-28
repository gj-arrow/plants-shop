export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: string;
  created_at?: string;
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
