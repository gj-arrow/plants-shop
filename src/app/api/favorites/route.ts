import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '@/lib/auth';
import { sessions } from '../auth/route';

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

// GET /api/favorites — список избранных товаров пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const favorites = db.prepare(
      'SELECT product_id FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as { product_id: number }[];

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
