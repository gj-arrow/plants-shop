import { NextRequest, NextResponse } from 'next/server';
import { sessions } from './sessions';

// Серверная проверка авторизации администратора для изменяющих API-маршрутов.
// Возвращает null, если сессия валидна; иначе — ответ 401.
export function requireAdmin(request: NextRequest): NextResponse | null {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  const session = sessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });
  }
  return null;
}