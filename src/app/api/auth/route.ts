import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Хранилище сессий (и пользователей, и администраторов)
const sessions = new Map<string, { 
  userId: number; 
  email: string; 
  role: 'user' | 'admin';
  expiresAt: number 
}>();

// POST /api/auth - регистрация, вход или OAuth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name, provider, providerId, avatarUrl } = body;

    // OAuth регистрация/вход через соцсети (только для обычных пользователей)
    if (action === 'oauth') {
      if (!provider || !providerId || !email) {
        return NextResponse.json({ error: 'Неверные данные OAuth' }, { status: 400 });
      }

      let user = db.prepare('SELECT * FROM users WHERE email = ? OR (auth_provider = ? AND auth_provider_id = ?)').get(email, provider, providerId) as any;

      if (user) {
        if (user.auth_provider !== provider) {
          db.prepare('UPDATE users SET auth_provider = ?, auth_provider_id = ?, avatar_url = ? WHERE id = ?')
            .run(provider, providerId, avatarUrl || null, user.id);
        }
      } else {
        const result = db.prepare(`
          INSERT INTO users (email, name, auth_provider, auth_provider_id, avatar_url)
          VALUES (?, ?, ?, ?, ?)
        `).run(email, name || email.split('@')[0], provider, providerId, avatarUrl || null);

        user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      const sessionId = uuidv4();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      sessions.set(sessionId, {
        userId: user.id,
        email: user.email,
        role: 'user',
        expiresAt,
      });

      const response = NextResponse.json({
        message: `Вход через ${getProviderName(provider)} успешен`,
        user: { id: user.id, email: user.email, name: user.name, role: 'user' }
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

    // Регистрация обычного пользователя
    if (action === 'register') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 400 });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (email, password_hash, name)
        VALUES (?, ?, ?)
      `).run(email, passwordHash, name);

      const newUser = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

      const sessionId = uuidv4();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      sessions.set(sessionId, {
        userId: (newUser as any).id,
        email: (newUser as any).email,
        role: 'user',
        expiresAt,
      });

      const response = NextResponse.json({
        message: 'Регистрация успешна',
        user: { id: (newUser as any).id, email: (newUser as any).email, name: (newUser as any).name, role: 'user' }
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

    // Вход (для администраторов и обычных пользователей)
    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
      }

      // Сначала проверяем администратора
      let admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(email) as any;
      if (admin) {
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

      // Затем проверяем обычного пользователя
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (user) {
        if (user.auth_provider !== 'email') {
          return NextResponse.json({ 
            error: `Вы зарегистрированы через ${getProviderName(user.auth_provider)}. Используйте этот способ для входа.` 
          }, { status: 401 });
        }

        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) {
          return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
        }

        const sessionId = uuidv4();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        sessions.set(sessionId, {
          userId: user.id,
          email: user.email,
          role: 'user',
          expiresAt,
        });

        const response = NextResponse.json({
          message: 'Вход успешен',
          user: { id: user.id, email: user.email, name: user.name, role: 'user' }
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

      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Неверное действие' }, { status: 400 });
  } catch (error) {
    console.error('Error in auth:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// GET /api/auth - проверка сессии
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    if (session.role === 'admin') {
      const admin = db.prepare('SELECT id, username as email FROM admins WHERE id = ?').get(session.userId) as any;
      return NextResponse.json({
        authenticated: true,
        user: admin ? { id: admin.id, email: admin.email, role: 'admin' as const } : null
      });
    } else {
      const user = db.prepare('SELECT id, email, name, auth_provider, avatar_url, phone, created_at FROM users WHERE id = ?').get(session.userId) as any;
      return NextResponse.json({
        authenticated: true,
        user: user ? { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url, phone: user.phone, created_at: user.created_at, role: 'user' as const } : null
      });
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// DELETE /api/auth - выход
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

function getProviderName(provider: string): string {
  const names: Record<string, string> = {
    google: 'Google',
    yandex: 'Яндекс',
    vk: 'VK',
    github: 'GitHub',
    email: 'Email',
  };
  return names[provider] || provider;
}

export { sessions };
