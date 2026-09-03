import { NextRequest, NextResponse } from 'next/server';
import { queryAll, queryOne, run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-guard';

// GET /api/products - получить все товары
export async function GET() {
  try {
    const products = await queryAll('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - создать товар (admin only)
export async function POST(request: NextRequest) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { name, description, price, category, subcategory, image_url, out_of_stock } = body;

    if (!name) {
      return NextResponse.json({ error: 'Название товара обязательно' }, { status: 400 });
    }
    if (!out_of_stock && !price) {
      return NextResponse.json({ error: 'Цена обязательна' }, { status: 400 });
    }

    const result = await run(
      `INSERT INTO products (name, description, price, category, subcategory, image_url, out_of_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, price || 0, category || null, subcategory || null, image_url || null, out_of_stock ? 1 : 0]
    );

    const newProduct = await queryOne('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
