import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const sessions = new Map<string, {
  userId: number;
  email: string;
  role: 'admin';
  expiresAt: number
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
      }

      const admin = await queryOne<{ id: number; username: string; password_hash: string }>(
        'SELECT * FROM admins WHERE username = ?',
        [email]
      );
      if (!admin) {
        return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
      }

      const isValid = bcrypt.compareSync(password, admin.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
      }

      const sessionId = uuidv4();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      sessions.set(sessionId, {
        userId: admin.id,
        email: admin.username,
        role: 'admin',
        expiresAt,
      });

      const response = NextResponse.json({
        message: 'Вход успешен',
        user: { id: admin.id, email: admin.username, role: 'admin' }
      });

      response.cookies.set('session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 60 * 60 * 24,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const admin = await queryOne<{ id: number; email: string }>(
      'SELECT id, username as email FROM admins WHERE id = ?',
      [session.userId]
    );
    return NextResponse.json({
      authenticated: true,
      user: admin ? { id: admin.id, email: admin.email, role: 'admin' as const } : null
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (sessionId) {
      sessions.delete(sessionId);
    }
    const response = NextResponse.json({ message: 'Выход успешен' });
    response.cookies.delete('session');
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Ошибка выхода' }, { status: 500 });
  }
}
