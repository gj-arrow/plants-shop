# Plant Shop - NESSY Context

## Project Overview

**Plant Shop** is a modern e-commerce web application for selling indoor plants, built with **Next.js 16**, **React 19**, and **TypeScript**. It features a customer-facing storefront with shopping cart functionality and an admin panel for managing products and orders.

### Key Features

**Customer Features:**
- Product catalog with category filtering
- Shopping cart with localStorage persistence
- Checkout with form validation
- Order confirmation and history
- User authentication (email/password + Google OAuth)
- User profile with order history

**Admin Features:**
- Admin authentication (separate from user auth)
- Product CRUD operations
- Order management with status updates
- Dashboard for viewing all orders

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.2.9 (App Router) |
| UI Library | React 19.2.4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | SQLite (better-sqlite3) |
| Auth (Users) | NextAuth 5 (Google OAuth) + custom session |
| Auth (Admin) | Custom bcrypt + cookie sessions |
| Build Tool | Turbopack |

## Project Structure

```
plant-shop/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # NextAuth endpoints ([...nextauth])
│   │   │   ├── orders/       # Order CRUD endpoints
│   │   │   ├── products/     # Product CRUD endpoints
│   │   │   └── user/         # User profile endpoints
│   │   ├── admin/            # Admin panel pages
│   │   │   ├── login/        # Admin login page
│   │   │   ├── products/     # Product management
│   │   │   └── orders/       # Order management
│   │   ├── cart/             # Shopping cart page
│   │   ├── checkout/         # Checkout page
│   │   ├── login/            # User login page
│   │   ├── register/         # User registration page
│   │   ├── profile/          # User profile page
│   │   ├── products/[id]/    # Product detail page
│   │   ├── order-success/    # Order confirmation
│   │   ├── layout.tsx        # Root layout (SessionProvider, CartProvider)
│   │   └── page.tsx          # Home page (product catalog)
│   ├── components/
│   │   ├── Navbar.tsx        # Navigation bar
│   │   └── AdminAuth.tsx     # Admin auth wrapper
│   ├── contexts/
│   │   └── CartContext.tsx   # Shopping cart state management
│   ├── lib/
│   │   ├── auth.ts           # NextAuth configuration
│   │   └── db.ts             # SQLite database connection & schema
│   └── middleware.ts         # Route protection middleware
├── scripts/
│   └── init-db.ts            # Database initialization script
├── public/                   # Static assets
├── plant-shop.db             # SQLite database file
├── .env.local                # Environment variables (DO NOT COMMIT)
├── .env.local.example        # Environment variables template
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## Building and Running

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
```

### Database Initialization

```bash
npm run init-db
```

This creates the SQLite database with:
- Default admin user (`admin` / `admin123`)
- 8 sample products

### Development Server

```bash
npm run dev
```

Server runs on **http://localhost:3000**

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Environment Variables

Required variables in `.env.local`:

```bash
# Google OAuth (for user authentication)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key-here

# Base URL
NEXTAUTH_URL=http://localhost:3000
```

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

## Authentication

### User Authentication
- **NextAuth 5** with JWT strategy
- Google OAuth provider
- Custom email/password registration
- Session stored in JWT cookie

### Admin Authentication
- Custom implementation with bcrypt
- Session stored in memory + cookie
- Protected via middleware on `/api/admin/*` routes

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

## Database Schema

### Tables

**users** - Customer accounts
- `id`, `email`, `password_hash`, `name`, `phone`
- `auth_provider`, `auth_provider_id`, `avatar_url`
- `created_at`

**admins** - Admin accounts
- `id`, `username`, `password_hash`, `created_at`

**products** - Product catalog
- `id`, `name`, `description`, `price`, `stock`
- `image_url`, `category`, `created_at`

**orders** - Customer orders
- `id`, `user_id`, `customer_name`, `phone`, `email`, `address`
- `total`, `status`, `created_at`

**order_items** - Order line items
- `id`, `order_id`, `product_id`, `quantity`, `price`

## API Endpoints

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | - | Get all products |
| POST | `/api/products` | Admin | Create product |
| GET | `/api/products/[id]` | - | Get product by ID |
| PUT | `/api/products/[id]` | Admin | Update product |
| DELETE | `/api/products/[id]` | Admin | Delete product |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | Admin | Get all orders |
| POST | `/api/orders` | - | Create order |
| GET | `/api/orders/user` | User | Get user's orders |
| PUT | `/api/orders/[id]` | Admin | Update order status |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth endpoints |
| POST | `/api/auth` | Login/register (legacy) |
| GET | `/api/auth` | Check session |
| DELETE | `/api/auth` | Logout |

## Development Conventions

### Code Style
- **TypeScript:** Strict mode enabled
- **Formatting:** Standard Next.js/React conventions
- **Imports:** Path aliases (`@/*` → `./src/*`)
- **Components:** Functional components with hooks
- **Naming:** PascalCase for components, camelCase for functions/variables

### Architecture Patterns
- **App Router:** All pages use Next.js 16 App Router
- **Server/Client Components:** `'use client'` directive for interactive components
- **State Management:** React Context for cart, NextAuth for sessions
- **Database:** Direct SQL queries via better-sqlite3 (no ORM)

### Testing
- No test framework configured yet
- Manual testing via browser recommended

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Home page with product catalog |
| `/products/[id]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout form |
| `/order-success` | Order confirmation |
| `/login` | User login |
| `/register` | User registration |
| `/profile` | User profile & order history |
| `/admin/login` | Admin login |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |

## Notes

- **Next.js 16:** This project uses Next.js 16 with breaking changes from v14/v15. Check `node_modules/next/dist/docs/` for updated APIs.
- **Middleware:** Current middleware uses deprecated syntax - should migrate to proxy-based approach.
- **Database:** SQLite file (`plant-shop.db`) is gitignored but contains all persistent data.
- **Cart:** Shopping cart persists via localStorage (client-side only).
