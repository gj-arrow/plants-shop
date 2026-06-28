import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '@/lib/auth';
import { sessions } from '../../auth/route';

async function getUserId(request: NextRequest): Promise<number | null> {
  // 1. Пробуем NextAuth (Google OAuth)
  const nextAuthSession = await auth();
  if (nextAuthSession?.user?.email) {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(nextAuthSession.user.email) as any;
    if (user) return user.id;
  }

  // 2. Пробуем кастомную сессию (email/password)
  const sessionId = request.cookies.get('session')?.value;
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session && session.expiresAt > Date.now() && session.role === 'user') {
      return session.userId;
    }
  }

  return null;
}

// POST /api/favorites/[id] — добавить товар в избранное
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Неверный ID товара' }, { status: 400 });
    }

    // Проверяем, что товар существует
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Добавляем в избранное (игнорируем дубликат)
    db.prepare(
      'INSERT OR IGNORE INTO user_favorites (user_id, product_id) VALUES (?, ?)'
    ).run(userId, productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/favorites/[id] — удалить товар из избранного
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Неверный ID товара' }, { status: 400 });
    }

    db.prepare(
      'DELETE FROM user_favorites WHERE user_id = ? AND product_id = ?'
    ).run(userId, productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
