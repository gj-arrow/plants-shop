import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { auth } from '@/lib/auth';
import { sessions } from '../../auth/route';

function getCurrentUser(request: NextRequest): { id: number; email: string; name: string; phone: string | null } | null {
  // 1. Пробуем NextAuth (Google OAuth) — для API-роутов используем auth()
  // В GET/PUT контексте auth() доступен, но проще проверить cookie

  // 2. Пробуем кастомную сессию (email/password)
  const sessionId = request.cookies.get('session')?.value;
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session && session.expiresAt > Date.now() && session.role === 'user') {
      const user = db.prepare('SELECT id, email, name, phone FROM users WHERE id = ?').get(session.userId) as any;
      if (user) return user;
    }
  }

  return null;
}

// GET /api/user/profile — получение данных текущего пользователя
export async function GET(request: NextRequest) {
  try {
    // 1. Пробуем NextAuth
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.email) {
      const user = db.prepare('SELECT id, email, name, phone FROM users WHERE email = ?').get(
        nextAuthSession.user.email
      ) as any;
      if (user) {
        return NextResponse.json({ user });
      }
    }

    // 2. Пробуем кастомную сессию
    const user = getCurrentUser(request);
    if (user) {
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT /api/user/profile — обновление личных данных пользователя
export async function PUT(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Имя обязательно' }, { status: 400 });
    }

    // 1. Пробуем NextAuth (Google OAuth)
    const nextAuthSession = await auth();
    if (nextAuthSession?.user?.email) {
      db.prepare('UPDATE users SET name = ?, phone = ? WHERE email = ?').run(
        name.trim(),
        phone?.trim() || null,
        nextAuthSession.user.email
      );

      const user = db.prepare('SELECT id, email, name, phone, created_at, avatar_url FROM users WHERE email = ?').get(
        nextAuthSession.user.email
      ) as any;

      return NextResponse.json({ user });
    }

    // 2. Пробуем кастомную сессию (email/password)
    const sessionId = request.cookies.get('session')?.value;
    if (sessionId) {
      const session = sessions.get(sessionId);
      if (session && session.expiresAt > Date.now()) {
        if (session.role !== 'user') {
          return NextResponse.json({ error: 'Неверная роль' }, { status: 403 });
        }

        db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(
          name.trim(),
          phone?.trim() || null,
          session.userId
        );

        const user = db.prepare('SELECT id, email, name, phone, created_at FROM users WHERE id = ?').get(
          session.userId
        ) as any;

        return NextResponse.json({ user });
      }
    }

    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
