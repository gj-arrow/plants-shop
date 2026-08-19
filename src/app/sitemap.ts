import type { MetadataRoute } from 'next';
import { queryAll } from '@/lib/db';
import { SITE_URL } from '@/lib/product-utils';

// Не генерировать статически при сборке — запрашивать БД хостинга в рантайме
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await queryAll<{ id: number; created_at: Date | null }>(
    'SELECT id, created_at FROM products'
  );

  const urls: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
    },
  ];

  for (const product of products) {
    urls.push({
      url: `${SITE_URL}/products/${product.id}`,
      ...(product.created_at ? { lastModified: product.created_at } : {}),
    });
  }

  return urls;
}