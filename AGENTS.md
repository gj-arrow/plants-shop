# Plant Shop — Agent Instructions

## Project Overview

E-commerce app for indoor plants. Next.js 16 App Router + React 19 + TypeScript 5 + Tailwind CSS 4. SQLite (better-sqlite3), NextAuth 5 (Google OAuth), custom bcrypt admin auth.

## Build & Run

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config) |
| `npm run init-db` | Seed DB with admin + 8 sample products |
| `npm start` | Run production build |

Order: `npm install && npm run init-db && npm run dev` for fresh setup.

## Auth & Security

- **Two auth systems**: NextAuth 5 (Google OAuth, JWT strategy) for customers; custom bcrypt + in-memory `Map` for admin
- **Admin sessions**: Stored in-memory `Map` in `src/app/api/auth/route.ts` — **lost on server restart**, not production-grade
- **No API auth guards**: Product CRUD, order CRUD, and upload routes have **no session checks**. Auth is entirely client-side via `<AdminAuth>` component
- **Admin credentials**: `admin` / `admin123` (seeded by `init-db`)
- **AdminAuth component** (`src/components/AdminAuth.tsx`): calls `GET /api/auth` on mount, redirects to `/admin/login` if not authenticated. Only checks `authenticated` boolean — does not verify admin role
- **Env vars required** (`.env.local`): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`

## Known Bugs & Gotchas

- **Admin logout broken**: `src/app/admin/layout.tsx:11` calls `fetch('/api/auth', { method: 'POST' })` with no body. The POST handler requires an `action` field and returns 400. Should be `DELETE /api/auth`.
- **Empty route stubs**: `src/app/api/user/` directory exists with subdirectories (`auth/`, `orders/`, `profile/`) but no implemented route files.
- **Order items denormalized**: Stored as `GROUP_CONCAT` text string (`product_id:quantity:price`) in SQL query, parsed server-side with split/parseInt. Not proper JSON or normalized query.
- **Route handler params**: Use `params: Promise<{ id: string }>` pattern (Next.js 15+ async params requirement).

## Architecture & Patterns

- **`@/*` path alias** = `./src/*` (configured in tsconfig.json)
- **Layout chain**: Root layout (`src/app/layout.tsx`) wraps `<SessionProvider>` → `<CartProvider>` → `<Navbar>` → `<main>`
- **Interactive components**: Mark with `'use client'` directive
- **Cart persistence**: localStorage via `CartContext` (`src/contexts/CartContext.tsx`)
- **DB**: Synchronous API — `db.prepare('SQL').all()/.get()/.run()` (better-sqlite3)
- **CSS animations**: Custom utility classes in `globals.css` — `btn-press`, `card-hover`, `fade-in`, `pulse-soft`, `ripple`, `slide-in`, `bg-gradient-animated`
- **All UI text**: Russian
- **TypeScript**: Strict mode enabled
- **Tailwind CSS 4**: Uses `@import "tailwindcss"` syntax (new Tailwind v4), PostCSS config imports `@tailwindcss/postcss`

## Project Structure

```
src/
├── app/
│   ├── api/            # Route handlers (auth, products, orders, upload, user/)
│   ├── admin/          # Admin panel pages (login, products, orders)
│   ├── cart/           # Shopping cart page
│   ├── checkout/       # Checkout form
│   ├── layout.tsx      # Root layout (SessionProvider + CartProvider)
│   └── page.tsx        # Home page (product catalog)
├── components/         # Navbar.tsx, AdminAuth.tsx
├── contexts/           # CartContext.tsx
├── lib/                # db.ts, auth.ts (NextAuth config)
└── middleware.ts       # Admin API protection (checks /api/admin/* paths)
```

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
