import { NextResponse } from 'next/server';
import { queryOne, run } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название категории обязательно' }, { status: 400 });
    }

    const category = await queryOne<Record<string, any>>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    // Check name uniqueness (exclude current)
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name.trim(), id]
    );
    if (existing) {
      return NextResponse.json({ error: 'Категория с таким названием уже существует' }, { status: 409 });
    }

    const oldName = category.name;

    await run('UPDATE categories SET name = ? WHERE id = ?', [
      name.trim(),
      id,
    ]);

    // Update product references if name changed
    if (oldName !== name.trim()) {
      await run('UPDATE products SET category = ? WHERE category = ?', [name.trim(), oldName]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Ошибка при обновлении категории' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await queryOne<Record<string, any>>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    const catName = category.name;

    // Unset category on products that use this category
    await run('UPDATE products SET category = NULL WHERE category = ?', [catName]);

    await run('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Ошибка при удалении категории' }, { status: 500 });
  }
}
