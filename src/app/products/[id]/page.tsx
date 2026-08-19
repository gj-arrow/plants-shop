import type { Metadata } from 'next';
import { queryOne } from '@/lib/db';
import { buildSeoDescription, type Product } from '@/lib/product-utils';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await queryOne<Product>('SELECT * FROM products WHERE id = ?', [Number(id)]);

  if (!product) {
    return { title: 'Товар не найден | Зелёная мастерская' };
  }

  return {
    title: `${product.name} — купить в Беларуси | Зелёная мастерская`,
    description: buildSeoDescription(product),
  };
}

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