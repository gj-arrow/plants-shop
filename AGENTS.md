# Plant Shop — Agent Instructions

## Project Overview

E-commerce for indoor plants. Simple catalog + admin panel. Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4. MySQL (mysql2/promise). **No test framework, no CI.**

## Build & Run

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config) |
| `npm run init-db` | Create tables + seed DB with admin + 8 sample products + categories (requires MySQL running + DATABASE_URL in .env.local) |
| `npm start` | Run production build |

**Fresh setup order:** create MySQL database → `npm install` → set `DATABASE_URL` in `.env.local` → `npm run init-db` → `npm run dev`

## Auth

- **Single auth system**: admin-only bcrypt + in-memory `Map<string, session>` in `src/app/api/auth/route.ts`
- **Sessions lost on server restart** — in-memory Map, not production-grade
- **No API auth guards** — product/category/upload routes have no server-side session check. Auth is entirely client-side via `<AdminAuth>` component
- **Admin credentials** (seeded by `init-db`): `admin` / `admin123`
- **Login flow**: `POST /api/auth` with `{action:"login", email, password}` → `bcrypt.compareSync` → sets `session` cookie. `GET /api/auth` checks cookie. `DELETE /api/auth` clears it
- **No env vars required** — `.env.local.example` is stale (references removed NextAuth/Google OAuth/SMTP). Ignore it
- **Login page**: `src/app/login/page.tsx` — sends `action:"login"` with `email` field (maps to DB `username` column)

## Architecture

- `@/*` path alias = `./src/*`
- **Layout chain**: `<FavoritesProvider>` → `<Navbar>` → `<main>` (no SessionProvider, no CartProvider)
- **DB**: Async API — `queryAll(sql, params)`, `queryOne(sql, params)`, `run(sql, params)` via mysql2/promise pool in `src/lib/db.ts`
- **All UI text**: Russian
- **TypeScript**: Strict mode
- **Tailwind CSS 4**: `@import "tailwindcss"` syntax, PostCSS config imports `@tailwindcss/postcss`
- **Interactive components**: Mark with `'use client'`
- **Route handler params**: `params: Promise<{ id: string }>` (Next.js 15+ async params requirement)

## Key Files & Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.ts        # POST (login), GET (check), DELETE (logout)
│   │   ├── products/route.ts    # GET (list), POST (create)
│   │   ├── products/[id]/       # GET, PUT, DELETE
│   │   ├── categories/route.ts  # GET (list), POST (create)
│   │   ├── categories/[id]/     # PUT, DELETE
│   │   └── upload/route.ts      # POST (images, max 5MB, JPEG/PNG/WebP/GIF/HEIC)
│   ├── admin/
│   │   ├── products/page.tsx    # CRUD table + modal form + image upload
│   │   ├── categories/page.tsx  # CRUD table + modal form
│   │   └── layout.tsx           # Admin nav, logout button
│   ├── favorites/page.tsx       # Client-side, reads localStorage FavoritesContext
│   ├── products/[id]/           # Public product detail page
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Catalog with category filter + search
├── components/
│   ├── AdminAuth.tsx            # Auth guard wrapper (calls GET /api/auth, checks role === 'admin')
│   ├── Navbar.tsx               # Nav with search, favorites badge, admin links
│   └── FallingLeaves.tsx        # Decorative animated leaves
├── contexts/FavoritesContext.tsx # localStorage-based favorites (no server)
├── hooks/useFavorites.ts        # Re-export from context
├── lib/
│   ├── db.ts                    # mysql2/promise pool + schema (admins, categories, products) + seed; exports queryAll, queryOne, run
│   └── product-utils.ts         # Product type, parseImages()
└── middleware.ts                # DELETED (was dead code)
```

## Gotchas

- **AdminAuth checks role**: `data.user?.role === 'admin'` at `src/components/AdminAuth.tsx:21`. It does NOT just check `authenticated` boolean
- **Category delete cascades**: sets `products.category = NULL` on affected products (`src/app/api/categories/[id]/route.ts:61`)
- **Category rename cascades**: updates `products.category` to new name (`src/app/api/categories/[id]/route.ts:37`)
- **Images stored as JSON array** in `products.image_url` column — parsed by `parseImages()` in `product-utils.ts`. Can be a plain path string or `["url1","url2","url3"]` array string
- **Max 3 images per product**, enforced client-side only
- **Uploaded files** go to `public/uploads/products/`, served at `/uploads/products/filename`
- **No `public/images/` dir** — seed data references `/images/*.svg` (doesn't exist), products fall back to `🪴` emoji
- **No GitHub Pages / Vercel deploy** — `npm run build` + `npm start` for production
- **DB**: MySQL via `DATABASE_URL` env var in `.env.local`. Create the database first (e.g. `CREATE DATABASE plant_shop`), then `npm run init-db` creates tables and seeds data

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know. This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
