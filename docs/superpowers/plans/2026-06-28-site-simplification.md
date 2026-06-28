# Site Simplification — Remove Users, Orders, Cart

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip the plant shop down. Remove users, orders, cart. Favorites stay but become localStorage-only (server-side auth removed). Admin panel remains.

**Architecture:** After simplification:
- Public catalog (home page + product details + favorites) — display + localStorage favorites, no cart
- Admin panel (products, categories CRUD) — protected by simple bcrypt auth
- Single auth: custom `POST /api/auth` + `session` cookie (admin only)
- Favorites: purely localStorage-based, no server sync

**Tech Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4 + SQLite (better-sqlite3). Removed deps: next-auth, nodemailer (uuid stays for admin session IDs).

## Global Constraints

- All UI text stays in Russian
- `parseImages` + `Product` type must be preserved — used by admin products page, favorites page
- Admin login remains at `/login` with same credentials (`admin` / `admin123`)
- Keep `@/*` path alias pointing to `./src/*`
- All code in TypeScript strict mode
- Use `params: Promise<{ id: string }>` pattern for route handler params (Next.js 15+)

---

## File Map

### Files to Delete
| File/Dir | Reason |
|---|---|
| `src/lib/auth.ts` | NextAuth config — no longer needed |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler — no longer needed |
| `src/app/register/page.tsx` | User registration page |
| `src/app/cart/page.tsx` | Shopping cart page |
| `src/app/checkout/page.tsx` | Checkout page |
| `src/app/order-success/page.tsx` | Order confirmation page |
| `src/app/profile/page.tsx` | User profile page |
| `src/app/api/orders/route.ts` | Orders list/create API |
| `src/app/api/orders/[id]/route.ts` | Single order API |
| `src/app/api/orders/user/route.ts` | User orders API |
| `src/app/api/user/profile/route.ts` | User profile API |
| `src/app/api/favorites/route.ts` | Favorites API — depends on users table |
| `src/app/api/favorites/[id]/route.ts` | Favorites API — depends on users table |
| `src/contexts/CartContext.tsx` | Cart context |
| `src/lib/email.ts` | Email notifications (only used by orders) |
| `src/middleware.ts` | Dead code — no `/api/admin/` routes exist |
| `src/app/admin/orders/page.tsx` | Admin orders management |
| `src/app/api/user/` | Entire user API directory |
| `src/app/api/orders/` | Entire orders API directory |
| `src/app/api/favorites/` | Entire favorites API directory |

### Files to Modify
| File | Changes |
|---|---|
| `src/contexts/FavoritesContext.tsx` | Remove `useSession`, API calls — make localStorage-only |
| `src/app/favorites/page.tsx` | Remove cart dependency, import from `@/lib/product-utils` |
| `src/lib/db.ts` | Remove `users`, `user_favorites`, `orders`, `order_items` tables |
| `src/app/api/auth/route.ts` | Remove OAuth, register, user login — keep only admin login |
| `src/app/login/page.tsx` | Remove Google OAuth, register link, user redirect — admin only |
| `src/app/layout.tsx` | Remove `SessionProvider`, `CartProvider`. Keep `FavoritesProvider`. |
| `src/components/Navbar.tsx` | Remove cart link, NextAuth, user dropdown. Keep favorites link. |
| `src/app/page.tsx` | Remove cart UI, addToCart, quantity controls. Keep favorites hearts. |
| `src/app/products/[id]/page.tsx` | Remove cart UI. Keep favorites heart button. |
| `src/app/admin/layout.tsx` | Remove "Заказы" tab |
| `package.json` | Remove `next-auth`, `nodemailer`, `@types/nodemailer` |

### Files to Create
| File | Reason |
|---|---|
| `src/lib/product-utils.ts` | Extract `Product` type + `parseImages` from CartContext — still needed |

---

## Task Dependencies

```
Task 1 (product-utils.ts) ──→ Task 6 (admin products import) + Task 8b (favorites page import)
Task 7 (db schema) ──→ Task 2 (auth route simplify)
Task 2 (auth route) ──→ Task 3 (login page)
Task 4 (layouts) ──→ Task 5 (Navbar)
Task 8a (FavoritesContext localStorage) ──→ Task 5 (Navbar favorites link) + Task 8b (favorites page)
All UI cleanup tasks after their dependencies
All deletion tasks go last
```

### Task 1: Create product-utils.ts (extract shared types from CartContext)

**Files:**
- Create: `src/lib/product-utils.ts`
- Modify: `src/contexts/CartContext.tsx`

- [ ] **Step 1: Create `src/lib/product-utils.ts`**

```typescript
export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: string;
  created_at?: string;
}

export function parseImages(product: Product): string[] {
  if (!product.image_url) return [];
  try {
    const parsed = JSON.parse(product.image_url);
    return Array.isArray(parsed) ? parsed : [product.image_url];
  } catch {
    return [product.image_url];
  }
}
```

- [ ] **Step 2: Update CartContext.tsx to re-export**

Add at top of `src/contexts/CartContext.tsx`:
```typescript
export { type Product, parseImages } from '@/lib/product-utils';
```

- [ ] **Step 3: Build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/lib/product-utils.ts src/contexts/CartContext.tsx
git commit -m "refactor: extract Product type and parseImages to shared util"
```

### Task 2: Convert FavoritesContext to localStorage-only

**Files:**
- Modify: `src/contexts/FavoritesContext.tsx` (rewrite)

- [ ] **Step 1: Rewrite FavoritesContext.tsx**

Remove: `useSession` import, `session` usage, API calls (`fetch('/api/favorites')`, `fetch('/api/favorites/${productId}')`). Keep only localStorage persistence.

```typescript
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

const STORAGE_KEY = 'favorites';

interface FavoritesContextValue {
  favorites: number[];
  toggleFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setFavorites(saved ? JSON.parse(saved) : []);
    } catch {
      setFavorites([]);
    }
    setLoading(false);
  }, []);

  const toggleFavorite = useCallback((productId: number) => {
    setFavorites(prev => {
      const alreadyFav = prev.includes(productId);
      const updated = alreadyFav
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (productId: number) => favorites.includes(productId),
    [favorites]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/FavoritesContext.tsx
git commit -m "refactor: make FavoritesContext localStorage-only, remove NextAuth dependency"
```

### Task 3: Simplify auth route — admin only

**Files:**
- Modify: `src/app/api/auth/route.ts` (rewrite)

- [ ] **Step 1: Rewrite `src/app/api/auth/route.ts`**

Remove all user-related logic (oauth, register, user login). Keep only admin login.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
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

      const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(email) as any;
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
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(sessionId);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const admin = db.prepare('SELECT id, username as email FROM admins WHERE id = ?').get(session.userId) as any;
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
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth/route.ts
git commit -m "refactor: simplify auth route to admin-only"
```

### Task 4: Simplify login page — admin only

**Files:**
- Modify: `src/app/login/page.tsx` (rewrite)

- [ ] **Step 1: Rewrite `src/app/login/page.tsx`**

Remove Google OAuth button, register link, user redirect. Only admin login.

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 fade-in">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">🌿</span>
            <h1 className="text-2xl font-bold text-gray-800">Вход для администратора</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm fade-in border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-3 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
            <p className="font-medium mb-1">Тестовые учётные данные:</p>
            <p>Админ: <code className="bg-blue-100 px-1 rounded">admin / admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "refactor: simplify login page to admin-only"
```

### Task 5: Simplify root layout — remove SessionProvider and CartProvider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Rewrite layout**

Remove `SessionProvider`, `CartProvider`. Keep `FavoritesProvider`.

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Plant Shop — Магазин растений",
  description: "Современный магазин комнатных растений с доставкой",
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌿</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">
        <FavoritesProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </FavoritesProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "refactor: remove SessionProvider, CartProvider; keep FavoritesProvider"
```

### Task 6: Simplify Navbar — remove cart, NextAuth, user dropdown; keep favorites

**Files:**
- Modify: `src/components/Navbar.tsx` (rewrite)

- [ ] **Step 1: Rewrite Navbar**

Remove: cart link, NextAuth imports, user dropdown, orders polling. Keep: logo, search, scroll-to sections, favorites link, admin login/logout.

```typescript
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [customUser, setCustomUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const { favorites } = useFavorites();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setSearchValue(q);
  }, []);

  useEffect(() => {
    setCustomUser(null);
    fetch('/api/auth')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.authenticated && data.user) {
          setCustomUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    const params = new URLSearchParams(window.location.search);
    if (value) params.set('q', value);
    else params.delete('q');
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : '/', { scroll: false });
  }, [router]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-[20px] bg-[rgba(253,246,240,0.92)] shadow-[0_4px_30px_rgba(76,175,80,0.12)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-xl font-bold flex items-center gap-2 btn-press transition no-underline"
          >
            <span className="inline-block text-2xl" style={{ animation: 'flowerRotate 6s linear infinite' }}>🌿</span>
            <span className="font-['Playfair_Display'] font-extrabold text-[#2D1B4E]">
              Plant<span className="text-[#4CAF50]">Shop</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Поиск */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4CAF50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Поиск..."
                className="w-28 sm:w-40 lg:w-56 pl-9 pr-3 py-1.5 bg-[rgba(76,175,80,0.06)] border-2 border-[rgba(76,175,80,0.12)] rounded-[50px] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition text-sm text-[#2D1B4E] placeholder:text-[#8a7a9a]"
              />
              {searchValue && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a7a9a] hover:text-[#2D1B4E] transition text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Каталог */}
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/', { scroll: false });
                  setTimeout(() => {
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }, 400);
                } else {
                  document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-[#4CAF50] py-2 hidden sm:block cursor-pointer
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#4CAF50] after:to-[#66BB6A] after:transition-all after:duration-300 hover:after:w-full"
            >
              Каталог
            </button>

            {/* Обо мне */}
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/', { scroll: false });
                  setTimeout(() => {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }, 400);
                } else {
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-[#4CAF50] py-2 hidden sm:block cursor-pointer
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#4CAF50] after:to-[#66BB6A] after:transition-all after:duration-300 hover:after:w-full"
            >
              Обо мне
            </button>

            {/* Контакты */}
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/', { scroll: false });
                  setTimeout(() => {
                    document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' });
                  }, 400);
                } else {
                  document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-[#4CAF50] py-2 hidden sm:block cursor-pointer
                after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#4CAF50] after:to-[#66BB6A] after:transition-all after:duration-300 hover:after:w-full"
            >
              Контакты
            </button>

            {/* Избранное */}
            <Link
              href="/favorites"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-[50px] text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-red-500 hover:bg-red-50 no-underline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="hidden sm:inline">Избранное</span>
              {favorites.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_2px_5px_rgba(239,68,68,0.4)]">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Admin button */}
            {customUser?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/products"
                  className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline"
                >
                  Администрирование
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth', { method: 'DELETE' });
                    window.location.reload();
                  }}
                  className="text-sm text-[#66BB6A] hover:text-red-500 font-medium transition cursor-pointer"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline"
              >
                Вход
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: Navbar no longer imports cart or next-auth

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "refactor: simplify navbar - remove cart, user dropdown; keep favorites"
```

### Task 7: Update admin products page import

**Files:**
- Modify: `src/app/admin/products/page.tsx`

- [ ] **Step 1: Update import**

Change:
```typescript
import { parseImages } from '@/contexts/CartContext';
```
To:
```typescript
import { parseImages } from '@/lib/product-utils';
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/products/page.tsx
git commit -m "refactor: update admin products import to use product-utils"
```

### Task 8: Simplify database schema — remove user/order tables

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Remove user, order, favorites tables**

Remove these blocks:
- `users` table (CREATE TABLE IF NOT EXISTS users)
- `user_favorites` table
- `orders` table
- `order_items` table

Keep: `admins`, `categories`, `products` + seed data.

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "refactor: remove users, orders, favorites tables from schema"
```

### Task 9: Clean up favorites page — remove cart dependency

**Files:**
- Modify: `src/app/favorites/page.tsx`

- [ ] **Step 1: Update imports and remove cart logic**

Changes:
- Replace `import { useCart, Product, parseImages } from '@/contexts/CartContext'` with `import { Product, parseImages } from '@/lib/product-utils'`
- Remove `items, addToCart, updateQuantity` — no more cart
- Remove cart quantity UI (+/- buttons, "В корзине" badge, "В корзину" button)
- Replace action area with a "Подробнее" link to product page

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/favorites/page.tsx
git commit -m "refactor: remove cart dependency from favorites page"
```

### Task 10: Clean up home page — remove cart, keep favorites

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update imports and remove cart logic**

Changes:
- Replace `import { useCart, Product, parseImages } from '@/contexts/CartContext'` with `import { Product, parseImages } from '@/lib/product-utils'`
- Keep `import { useFavorites } from '@/contexts/FavoritesContext'`
- Remove `items, addToCart, updateQuantity: updateCartQuantity` from destructuring
- Remove `lastAddedId` state
- Remove `handleAddToCartWithFeedback`
- Remove `handleUpdateQuantity`
- Update `ProductCard` props: remove `quantityInCart`, `onAddToCart`, `onUpdateQuantity`, `isHighlighted`
- Keep: `isFavorite`, `onToggleFavorite`
- `ProductCard`: remove cart UI (add to cart button, +/- controls, "X шт." badge). Replace with "Подробнее →" link.

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: remove cart UI from home page; keep favorites"
```

### Task 11: Clean up product detail page — remove cart, keep favorites

**Files:**
- Modify: `src/app/products/[id]/page.tsx`

- [ ] **Step 1: Update imports and remove cart logic**

Changes:
- Replace cart import with `import { Product, parseImages } from '@/lib/product-utils'`
- Keep `import { useFavorites } from '@/contexts/FavoritesContext'`
- Remove `addToCart, removeFromCart, updateQuantity, items`
- Remove cart quantity UI (+/- buttons, "В корзине" badge, "В корзину" button, "Удалить" button)
- Keep favorites heart button
- Replace cart action with a "В каталог" link button

- [ ] **Step 2: Build to verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/products/[id]/page.tsx
git commit -m "refactor: remove cart from product detail; keep favorites"
```

### Task 12: Update admin layout — remove orders tab

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Remove "Заказы" from navItems**

```typescript
const navItems = [
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/categories', label: 'Категории' },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "refactor: remove orders tab from admin layout"
```

### Task 13: Delete all removed feature files

- [ ] **Step 1: Delete files**

```bash
# NextAuth
rm -rf "src/app/api/auth/[...nextauth]"
rm -f src/lib/auth.ts

# User-facing pages
rm -f src/app/register/page.tsx
rm -f src/app/cart/page.tsx
rm -f src/app/checkout/page.tsx
rm -f src/app/order-success/page.tsx
rm -f src/app/profile/page.tsx

# API routes
rm -rf src/app/api/orders
rm -rf src/app/api/user
rm -rf src/app/api/favorites

# Cart context
rm -f src/contexts/CartContext.tsx

# Other
rm -f src/lib/email.ts
rm -f src/middleware.ts
rm -f src/app/admin/orders/page.tsx
```

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: delete removed feature files"
```

### Task 14: Clean up package.json — remove unused deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove deps**

Remove from `dependencies`:
- `"next-auth": "^5.0.0-beta.31"`
- `"nodemailer": "^7.0.13"`

Remove from `devDependencies`:
- `"@types/nodemailer": "^8.0.1"`

- [ ] **Step 2: Install to update lockfile**

Run: `npm install`

- [ ] **Step 3: Build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove next-auth, nodemailer from dependencies"
```

### Task 15: Final verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Clean build, no errors

- [ ] **Step 2: Init DB test**

Run: `npm run init-db`
Expected: Schema with only admins, categories, products

- [ ] **Step 3: Dev server test**

Run: `npm run dev` (briefly to confirm server starts without crash)
