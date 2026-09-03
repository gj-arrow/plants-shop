// Простейший in-memory rate limit (скользящее окно по ключу).
// Используется для ограничения попыток входа по IP.

const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();

  // Ленивая очистка устаревших записей, чтобы Map не рос бесконечно
  if (attempts.size > 500) {
    for (const [k, entry] of attempts) {
      if (entry.resetAt < now) attempts.delete(k);
    }
  }

  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}