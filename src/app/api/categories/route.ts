import { NextResponse } from 'next/server';
import { queryAll, queryOne, run } from '@/lib/db';

export async function GET() {
  try {
    const categories = await queryAll<any>('SELECT * FROM categories ORDER BY name ASC');
    // Add product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM products WHERE category = ?',
          [cat.name]
        );
        return { ...cat, productCount: count?.count || 0 };
      })
    );
    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Ошибка загрузки категорий' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название категории обязательно' }, { status: 400 });
    }

    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    );
    if (existing) {
      return NextResponse.json({ error: 'Категория с таким названием уже существует' }, { status: 409 });
    }

    const result = await run('INSERT INTO categories (name) VALUES (?)', [
      name.trim(),
    ]);

    return NextResponse.json(
      { id: result.insertId, name: name.trim() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Ошибка при создании категории' }, { status: 500 });
  }
}
