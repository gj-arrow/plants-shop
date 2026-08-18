# Plant Shop — Agent Instructions

## Project Overview

E-commerce for indoor plants. Simple catalog + admin panel. Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS 4. MySQL (mysql2/promise). **No test framework, no CI.**

## Build & Run

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (Turbopack) on :3000 |
| `npm run build` | Production build (standalone output) |
| `npm run deploy` | **Preferred:** build + create deploy package in `deploy/` |
| `npm run lint` | ESLint (flat config) |
| `npm run init-db` | Create tables + seed DB with admin + sample products + categories |
| `npm run seed-products` | Replace all products with 10 real catalog entries |
| `npm start` | Run production build |

**Fresh setup order:** create MySQL database → `npm install` → set `DATABASE_URL` in `.env.local` → `npm run init-db` → `npm run dev`

## Deployment (ISPmanager hosting)

- `next.config.ts` has `output: "standalone"` — the build goes to `.next/standalone/`
- Run `npm run deploy` (calls `scripts/build-deploy.sh`) which produces `deploy/` folder with all fixes
- **Standalone is incomplete after build:** `.next/static` is missing, and `node_modules` lacks `mysql2`, `bcryptjs`, `uuid` + transitive deps. The deploy script copies them
- **Standalone server does NOT read `.env.local`** — `DATABASE_URL` must be set in ISPmanager Node.js app environment variables. The `.env.local` in deploy/ is just for reference
- In ISPmanager: WWW → Node.js-приложения → создать → стартовый файл: `server.js`, рабочая директория: путь к папке, переменные окружения: `DATABASE_URL=...` (с реальными данными хостинга)
- **`public/uploads` is EXCLUDED from the deploy package** (since Aug 2026) — photos uploaded via the admin UI directly on the hosting live ONLY in `public/uploads/products` on the server. If the package contained that folder, an FTP upload would overwrite it and delete server-only photos → broken images (DB keeps the references). `build-deploy.sh` removes it after copying `public/` and zips the local uploads into `deploy/uploads.zip` (**first-install only**). On FTP upload: overwrite mode, NEVER delete server files that aren't in the package
- **`sharp` native binaries in the package are macOS-only** (`@img/sharp-darwin-arm64`, since builds happen on a Mac). `build-deploy.sh` best-effort installs `@img/sharp-linux-{x64,arm64}` + libvips into `deploy/node_modules`; if that fails, HEIC photos will 500 on the hosting. Note: `sharp` is NOT in `package.json` (installed with `--no-save`)

## Auth

- **Single auth system**: admin-only bcrypt + in-memory `Map<string, session>` in `src/app/api/auth/route.ts`
- **Sessions lost on server restart** — in-memory Map, not production-grade
- **No API auth guards** — product/category/upload routes have no server-side session check. Auth is entirely client-side via `<AdminAuth>` component
- **Admin credentials** (seeded by `init-db`): `admin` / `admin123`
- **Login flow**: `POST /api/auth` with `{action:"login", email, password}` → `bcrypt.compareSync` → sets `session` cookie. `GET /api/auth` checks cookie. `DELETE /api/auth` clears it
- **Login page**: `src/app/login/page.tsx` — sends `action:"login"` with `email` field (maps to DB `username` column)

## Architecture

- `@/*` path alias = `./src/*`
- **Layout chain**: `<FavoritesProvider>` → `<Navbar>` → `<main>` (no SessionProvider, no CartProvider)
- **DB**: Async API — `queryAll(sql, params)`, `queryOne(sql, params)`, `run(sql, params)` via mysql2/promise pool in `src/lib/db.ts`
- **All UI text**: Russian
- **TypeScript**: Strict mode
- **Tailwind CSS 4**: `@import "tailwindcss"` in CSS, PostCSS config imports `@tailwindcss/postcss`. No `tailwind.config.*` file
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
│   ├── db.ts                    # mysql2/promise pool + schema (admins, categories, products) + seed
│   └── product-utils.ts         # Product type, parseImages()
└── scripts/
    ├── build-deploy.sh          # Creates deploy/ package for ISPmanager
    ├── init-db.ts               # Tables + seed (called by npm run init-db)
    └── seed-products.ts         # Replaces all products with real catalog entries
```

## Gotchas

### Auth
- **AdminAuth checks role**: `data.user?.role === 'admin'` at `src/components/AdminAuth.tsx:21`. It does NOT just check `authenticated` boolean

### Database
- **Category delete cascades**: sets `products.category = NULL` on affected products (`src/app/api/categories/[id]/route.ts:61`)
- **Category rename cascades**: updates `products.category` to new name (`src/app/api/categories/[id]/route.ts:37`)
- **db.ts socketPath detection is fragile** (`src/lib/db.ts:8-9`): it checks `url.includes(':password')` (literal string) rather than checking if a password is present. Any URL containing `@localhost` without the literal substring `:password` will attempt Unix socket at `/tmp/mysql.sock`, which fails on hosting where MySQL uses TCP. Workaround: set `MYSQL_SOCKET_PATH` env var to empty string, or ensure URL contains `:password` literally

### Images
- **Images stored as JSON array** in `products.image_url` column — parsed by `parseImages()` in `product-utils.ts`. Can be a plain path string or `["url1","url2","url3"]` array string
- **Max 3 images per product**, enforced client-side only
- **Uploaded files** go to `public/uploads/products/`. The upload API returns `/api/uploads/<filename>` (route `src/app/api/uploads/[filename]/route.ts` reads from `public/uploads/products/` — added to bypass hosting static caching). The direct `/uploads/products/<filename>` static path also works
- **Images exist as files but may not be linked in DB** — the `image_url` column can be empty even when image files are present in `public/uploads/products/`. Check both when troubleshooting missing product images
- **Hosting-only photos are fragile**: a photo uploaded through the admin UI on the hosting exists ONLY in the server's `public/uploads/products/` and is NOT in the local repo. Never delete that folder during FTP deploys (see Deployment). A DB `image_url` referencing a missing file returns 404 — check the file first, then the DB

### Deployment
- **`.env.local.example` is stale** — references removed NextAuth/Google OAuth/SMTP. Only real env var needed is `DATABASE_URL`
- **No GitHub Pages / Vercel deploy** — ISPmanager Node.js app, `npm run build` + `npm start`
- **Server must be configured via ISPmanager** UI (not just file upload) to set `DATABASE_URL` env var and point to `server.js`
- **Standalone build is used** (`output: "standalone"` in `next.config.ts`), but Next.js misses copying `.next/static` and some `node_modules`. The `npm run deploy` script (`scripts/build-deploy.sh`) handles this — use it instead of manual steps
