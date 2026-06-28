import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/products/[id] - получить товар по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id] - обновить товар (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, category, image_url } = body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?
      WHERE id = ?
    `).run(
      name || (existing as any).name,
      description !== undefined ? description : (existing as any).description,
      price !== undefined ? price : (existing as any).price,
      stock !== undefined ? stock : (existing as any).stock,
      category !== undefined ? category : (existing as any).category,
      image_url !== undefined ? image_url : (existing as any).image_url,
      id
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - удалить товар (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Удаляем сначала связи в order_items, потом сам товар
    db.prepare('DELETE FROM order_items WHERE product_id = ?').run(id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
