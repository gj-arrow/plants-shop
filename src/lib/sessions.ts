// Общее хранилище сессий администратора (in-memory).
// Вынесено из auth/route.ts, чтобы проверять сессии в любом API-маршруте.
export interface AdminSession {
  userId: number;
  email: string;
  role: 'admin';
  expiresAt: number;
}

export const sessions = new Map<string, AdminSession>();