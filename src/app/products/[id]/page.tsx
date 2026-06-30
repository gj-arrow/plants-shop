import { queryOne } from '@/lib/db';
import { parseImages } from '@/lib/product-utils';
import type { Product } from '@/lib/product-utils';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await queryOne<Product>('SELECT * FROM products WHERE id = ?', [Number(id)]);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
