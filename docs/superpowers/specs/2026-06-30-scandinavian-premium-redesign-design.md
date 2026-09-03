# Scandinavian Premium Redesign — Plant Shop

**Date**: 2026-06-30
**Status**: Approved

## Overview

Complete visual redesign of the plant shop e-commerce site. Concept: **"White Cube"** — gallery-like premium boutique where plants are the main stars. Light Scandinavian aesthetic with sage/mint accents. Minimal, clean, luxurious.

## Design Approach

**Approach A: Minimalist Premium Boutique (selected)**

Background: `#FFFFFF` (pure white). No noise, no decorative clutter. Plants are the focal point. Inspired by Apple Store / Cos / Aesop flagship aesthetics — clean geometry, generous whitespace, subtle shadows.

## Color Palette

| Role | Color | Usage |
|------|-------|-------|
| Background | `#FFFFFF` | Page backgrounds |
| Body text | `#1A1A1A` | Paragraphs, descriptions |
| Headings | `#1A3326` | Forest green for H1-H3 |
| Sage accent | `#8CA89C` | Buttons, links, icons, borders |
| Dark accent | `#5B7F6B` | Button hover states |
| Soft sage | `#E8F0EA` | Badges, light fills, backdrops |
| Light grey | `#F5F5F0` | Alternative section backgrounds |
| Border | `#E5E5E0` | Dividers, borders |
| Shadow | `rgba(28, 55, 40, 0.06)` | Card shadows |

## Typography

- **Headings**: Playfair Display (SemiBold 600 only — no Bold/ExtraBold for refinement)
- **Body/UI**: Instrument Sans (replaces Inter — cleaner geometry, premium feel)
- **Scale**: Larger hierarchy — bigger headings, smaller body, more contrast

## Components

### 1. Hero Section

Full-screen, 2-column split layout:
- **Left (50%)**: Pure white background
  - Small badge "PLANT SHOP" — sage color, uppercase, wide tracking
  - H1: "Преврати свой дом в оазис" — Playfair Display, `#1A3326`, `text-6xl`/`text-7xl`
  - Subtitle: Instrument Sans, `#6B7280`
  - CTA: Sage button "Смотреть каталог" with arrow icon
  - Social: Minimal Telegram, WhatsApp icons, no labels
- **Right (50%)**: Full-height product photo, bleeds off edges, no frame
- **Bottom strip**: "Доставка 1-3 дня" / "Бесплатно от 5000₽" / "100% свежесть" — 3 columns, small text
- **Animation**: Text slides right+fade in, photo slides left+fade in; parallax on scroll

### 2. Navigation

- **Transparent**, absolute positioned, no background
- Logo: "Plant Shop" — Playfair Display, `#1A3326`, "Shop" in sage
- Center links: Каталог, О нас, Контакты — thin text
- Right: Heart (favorites), Search icon — icon-only, no labels
- **Scroll behavior**: Disappears on scroll down (slide-out), reappears on scroll up
- Mobile: Minimal — logo + burger only

### 3. Category Filters

- Horizontal row of pill "chips" below hero
- Each chip: white bg, thin sage border, emoji + name, `rounded-full`
- Active: sage fill (`#8CA89C`), white text
- Cascade scroll-reveal animation

### 4. Product Grid

**Asymmetric gallery layout** — breaks symmetry for premium feel:
- Every 3rd product card spans 2 columns (`col-span-2`)
- Creates a dynamic, editorial grid pattern

**Product Card — Gallery Style**:
- White bg, no border, subtle shadow: `shadow-[0_2px_20px_rgba(28,55,40,0.06)]`
- Image: `aspect-[4/5]` portrait ratio, `rounded-sm` (nearly no rounding)
- Content below image (always visible on desktop): name, price, stock indicator
- Name: Instrument Sans medium `#1A1A1A`
- Price: sage `#8CA89C` medium
- Stock badge: green text only, no background fill
- **Hover on image**: slight zoom (scale 1.02) + soft overlay with heart icon appearing
- Favorite button: semi-transparent white overlay on image hover

### 5. Product Detail Page

- **Layout**: 60/40 split — image gallery left, info right
- **Gallery**:
  - Main image: large, portrait aspect
  - Thumbnail row: 2-3 small previews underneath
- **Info panel** (pure white, no card):
  - Category: sage text, no badge pill
  - Title: Playfair Display `text-4xl`
  - Price: large `#1A3326` `text-3xl`
  - Description: thin Instrument Sans `#6B7280`
  - Full-width sage CTA: "Добавить в избранное ♡"
- **Care specs**: 3 inline icons — 🌱 Care / 💧 Water / ☀️ Light — no card frames

### 6. "About" Section

- 2-column: text + decorative photo
- White/light grey background, no colored plates

### 7. Footer

- Sage background (`#8CA89C`), white text
- 3 columns: Contacts, Info (delivery/returns), Social
- Minimal, elegant

## Animations Philosophy

- **Scroll-reveal**: Elements fade+slide in as user scrolls (intersection observer)
- **Purposeful**: Every animation has a reason — guiding eye, creating focus
- **Subtle**: No bouncy or flashy effects. Smooth, duration ~600ms
- **Parallax**: Subtle movement on hero image
- **Hover**: Card zoom (1.02), button darken, icon transitions

## Pages to Update

1. `src/app/globals.css` — Color palette, new animations, scrollbar
2. `src/app/layout.tsx` — Fonts (add Instrument Sans), metadata
3. `src/app/page.tsx` — Main catalog: hero, categories, grid, about, footer
4. `src/app/products/[id]/page.tsx` — Product detail layout
5. `src/app/favorites/page.tsx` — Align with new card style
6. `src/components/Navbar.tsx` — Transparent nav with scroll hide
7. `src/components/FallingLeaves.tsx` — Remove or replace with subtle ambient effect
8. `src/app/login/page.tsx` — Align styling
9. `src/app/admin/*` — Align styling (minimal changes, functional)

## Constraints

- All UI text in Russian (unchanged)
- Tailwind CSS v4 (`@import "tailwindcss"` syntax)
- Next.js 16 + React 19 + TypeScript 5
- No external animation libraries — custom CSS transitions
- No state management changes — keep FavoritesContext
