import { NextRequest, NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

// GET /api/products/[id] - получить товар по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await queryOne('SELECT * FROM products WHERE id = ?', [id]);

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

    const existing = await queryOne<Record<string, any>>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await run(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ?
       WHERE id = ?`,
      [
        name || existing.name,
        description !== undefined ? description : existing.description,
        price !== undefined ? price : existing.price,
        stock !== undefined ? stock : existing.stock,
        category !== undefined ? category : existing.category,
        image_url !== undefined ? image_url : existing.image_url,
        id,
      ]
    );

    const updated = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
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

    const existing = await queryOne('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await run('DELETE FROM products WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
