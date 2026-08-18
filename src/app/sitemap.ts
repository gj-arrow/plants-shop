import type { MetadataRoute } from 'next';
import { queryAll } from '@/lib/db';

// Punycode-форма домена цветы-людмилы.бел
const SITE_URL = 'https://xn----ctbhcrqcg4cxb8cg8a.xn--90ais';

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