import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/products - получить все товары
export async function GET() {
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - создать товар (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, stock, category, image_url } = body;

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, price, stock, category, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, description || null, price, stock || 0, category || null, image_url || null);

    const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
