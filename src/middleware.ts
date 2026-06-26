import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Простое хранилище сессий (должно быть общим с auth/route.ts)
const sessions = new Map<string, { adminId: number; username: string; expiresAt: number }>();

export function middleware(request: NextRequest) {
  // Проверяем, что это API запрос к админским роутам
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');
  
  if (isAdminApi) {
    const sessionId = request.cookies.get('admin_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Добавляем информацию об админе в заголовки
    const response = NextResponse.next();
    response.headers.set('X-Admin-Id', session.adminId.toString());
    response.headers.set('X-Admin-Username', session.username);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*',
};
