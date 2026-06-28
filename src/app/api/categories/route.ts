import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    // Add product count for each category
    const categoriesWithCount = (categories as any[]).map(cat => {
      const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE category = ?').get(cat.name) as { count: number };
      return { ...cat, productCount: count.count };
    });
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка загрузки категорий' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название категории обязательно' }, { status: 400 });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
    if (existing) {
      return NextResponse.json({ error: 'Категория с таким названием уже существует' }, { status: 409 });
    }

    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(
      name.trim(),
      description?.trim() || ''
    );

    return NextResponse.json({ id: result.lastInsertRowid, name: name.trim(), description: description?.trim() || '' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка при создании категории' }, { status: 500 });
  }
}
