import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название категории обязательно' }, { status: 400 });
    }

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    // Check name uniqueness (exclude current)
    const existing = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name.trim(), id);
    if (existing) {
      return NextResponse.json({ error: 'Категория с таким названием уже существует' }, { status: 409 });
    }

    const oldName = (category as any).name;

    db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(
      name.trim(),
      description?.trim() || '',
      id
    );

    // Update product references if name changed
    if (oldName !== name.trim()) {
      db.prepare('UPDATE products SET category = ? WHERE category = ?').run(name.trim(), oldName);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при обновлении категории' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return NextResponse.json({ error: 'Категория не найдена' }, { status: 404 });
    }

    const catName = (category as any).name;

    // Unset category on products that use this category
    db.prepare('UPDATE products SET category = NULL WHERE category = ?').run(catName);

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при удалении категории' }, { status: 500 });
  }
}
