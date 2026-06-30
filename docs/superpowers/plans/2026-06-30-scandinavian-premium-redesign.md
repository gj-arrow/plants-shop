# Scandinavian Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual redesign of Plant Shop to a Scandinavian premium aesthetic — white cube gallery concept with sage/mint accents.

**Architecture:** Pure CSS + Tailwind redesign of existing components. No new features, no new routes, no backend changes. All changes are in `src/` frontend files. Each task produces visually verifiable output in the browser.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Google Fonts (Playfair Display + Instrument Sans)

## Global Constraints

- All UI text remains in Russian — do not translate or modify copy
- Tailwind CSS v4 syntax (`@import "tailwindcss"`) — no `tailwind.config.*` file
- No external animation libraries — use CSS transitions/keyframes + Intersection Observer
- No test framework exists — skip all test steps
- No state management changes — keep existing FavoritesContext
- Color palette: white `#FFFFFF`, body `#1A1A1A`, headings `#1A3326`, sage `#8CA89C`, dark accent `#5B7F6B`, soft sage `#E8F0EA`, light grey `#F5F5F0`, border `#E5E5E0`
- Shadow: `rgba(28, 55, 40, 0.06)`
- Google Fonts: keep existing `Playfair Display` (600 weight only), add `Instrument Sans` (300,400,500,600)

---

### Task 1: CSS Foundations & Fonts

**Files:**
- Modify: `src/app/globals.css` — full rewrite
- Modify: `src/app/layout.tsx` — font import + HTML class

**Interfaces:**
- Consumes: existing component structure in page.tsx, Navbar.tsx, etc.
- Produces: CSS custom properties, animation keyframes, font setup that all subsequent tasks depend on

- [ ] **Step 1: Rewrite globals.css with new color palette and animations**

Replace the entire content of `src/app/globals.css`:

```css
@import "tailwindcss";

/* ============================================
   Scandinavian Premium — Plant Shop
   White Cube aesthetic, sage accents
   ============================================ */

@theme {
  --color-sage: #8CA89C;
  --color-sage-dark: #5B7F6B;
  --color-sage-soft: #E8F0EA;
  --color-heading: #1A3326;
  --color-body: #1A1A1A;
  --color-light-grey: #F5F5F0;
  --color-border: #E5E5E0;
  --color-white: #FFFFFF;
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #D4D4D0;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #B0B0A8;
}

/* Selection */
::selection {
  background: #8CA89C;
  color: white;
}

/* Scroll-reveal base */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-delay-1 { transition-delay: 0.1s; }
.reveal-delay-2 { transition-delay: 0.2s; }
.reveal-delay-3 { transition-delay: 0.3s; }
.reveal-delay-4 { transition-delay: 0.4s; }
.reveal-delay-5 { transition-delay: 0.5s; }

/* Navbar scroll hide animation */
.nav-hidden {
  transform: translateY(-100%);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.nav-visible {
  transform: translateY(0);
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Card hover */
.card-hover {
  transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(28, 55, 40, 0.08);
}

/* Image zoom on hover */
.img-zoom {
  overflow: hidden;
}
.img-zoom img {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.img-zoom:hover img {
  transform: scale(1.03);
}

/* Button press */
.btn-press {
  transition: transform 0.15s ease;
}
.btn-press:active {
  transform: scale(0.97);
}

/* Hero parallax */
.hero-parallax {
  will-change: transform;
}

/* Focus ring */
*:focus-visible {
  outline: 2px solid #8CA89C;
  outline-offset: 2px;
}
```

- [ ] **Step 2: Update layout.tsx with Instrument Sans font**

Add Instrument Sans to the Google Fonts import in `src/app/layout.tsx`:

```tsx
// Change the Google Fonts import from:
import { Playfair_Display, Inter } from 'next/font/google'
// To:
import { Playfair_Display, Instrument_Sans } from 'next/font/google'

// Change Inter configuration:
const instrumentSans = Instrument_Sans({
  subsets: ['cyrillic', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-instrument',
})

// Update body className:
// From: `${inter.variable} font-sans antialiased`
// To: `${instrumentSans.variable} font-sans antialiased`
```

Also remove the `h-full flex flex-col` from body and set `bg-white`.

- [ ] **Step 3: Remove or minimize FallingLeaves component**

Either delete `FallingLeaves.tsx` and remove its usage from `page.tsx`, or tone it down to just 3-4 very subtle leaves (opacity 0.03). The clean Scandinavian aesthetic doesn't use decorative falling elements.

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: Build succeeds without errors.

---

### Task 2: Navigation Bar

**Files:**
- Modify: `src/components/Navbar.tsx` — full rewrite

**Interfaces:**
- Consumes: CSS classes from globals.css (nav-hidden, nav-visible)
- Produces: transparent navbar used by layout.tsx and all pages

- [ ] **Step 1: Rewrite Navbar.tsx**

Replace the full component. Key changes:
- Remove fixed background color — make it transparent (`bg-transparent absolute top-0 left-0 right-0 z-50`)
- No backdrop-blur when transparent
- Track scroll: hide on scroll down, show on scroll up using `nav-hidden`/`nav-visible` classes
- Logo: "Plant" `#1A3326` + "Shop" `#8CA89C` Playfair Display
- Links: Каталог, О нас, Контакты — centered, `text-sm` `text-[#6B7280]` `tracking-wide`
- Right: heart icon, search icon — icon-only, `text-[#8CA89C]`
- On mobile: minimal — logo + burger menu (simple mobile drawer)
- Admin links: keep but match new style (sage pills)

Key code pattern for scroll detection:
```tsx
const [isVisible, setIsVisible] = useState(true)
const lastScrollY = useRef(0)

useEffect(() => {
  const control = () => {
    const currentY = window.scrollY
    if (currentY < lastScrollY.current || currentY < 60) {
      setIsVisible(true) // show on scroll up or at top
    } else {
      setIsVisible(false) // hide on scroll down
    }
    lastScrollY.current = currentY
  }
  window.addEventListener('scroll', control, { passive: true })
  return () => window.removeEventListener('scroll', control)
}, [])
```

- [ ] **Step 2: Verify in browser**

```bash
npm run dev
```
Navigate to homepage. Navbar should be transparent, disappear on scroll down, reappear on scroll up.

---

### Task 3: Hero Section

**Files:**
- Modify: `src/app/page.tsx` — hero section + hero animations

**Interfaces:**
- Consumes: CSS scroll-reveal classes from globals.css, Navbar component
- Produces: Hero section with 2-column split layout

- [ ] **Step 1: Replace hero section in page.tsx**

Current hero has gradient backgrounds, overlay images, decorative blurs — remove all of it. Replace with:

```tsx
{/* Hero */}
<section className="relative min-h-screen flex items-center bg-white">
  <div className="max-w-7xl mx-auto px-6 w-full">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
      
      {/* Left: Text */}
      <div className="reveal visible">
        <span className="text-sage text-xs tracking-[0.2em] uppercase font-medium">
          ♡ PLANT SHOP
        </span>
        <h1 className="text-[#1A3326] font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mt-6">
          Преврати свой дом в оазис
        </h1>
        <p className="text-[#6B7280] text-lg mt-6 max-w-md leading-relaxed">
          Редкие комнатные растения с доставкой по Москве
        </p>
        
        {/* CTA */}
        <a
          href="#catalog"
          className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors btn-press"
        >
          Смотреть каталог
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>

        {/* Social */}
        <div className="flex gap-4 mt-12">
          <a href="#" className="w-10 h-10 rounded-full border border-[#E5E5E0] flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all" aria-label="Telegram">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full border border-[#E5E5E0] flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all" aria-label="WhatsApp">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </div>
      </div>

      {/* Right: Image */}
      <div className="reveal visible reveal-delay-2 h-full flex items-center justify-center">
        <div className="relative w-full max-w-lg">
          <div className="aspect-[4/5] rounded-sm bg-[#F5F5F0] overflow-hidden">
            <img
              src="/uploads/products/plant-17.jpg"
              alt="Monstera"
              className="w-full h-full object-cover hero-parallax"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Bottom info strip */}
  <div className="absolute bottom-0 left-0 right-0 border-t border-[#E5E5E0] bg-white">
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="text-xs text-[#6B7280] tracking-wide">
          <span className="text-sage font-medium">Доставка</span> 1-3 дня
        </div>
        <div className="text-xs text-[#6B7280] tracking-wide">
          <span className="text-sage font-medium">Бесплатно</span> от 5000₽
        </div>
        <div className="text-xs text-[#6B7280] tracking-wide">
          <span className="text-sage font-medium">100%</span> свежесть
        </div>
      </div>
    </div>
  </div>
</section>
```

Add `id="catalog"` to the catalog section below.

- [ ] **Step 2: Add scroll-reveal JS**

In page.tsx, add a `useEffect` at the top level (if not client component, add `'use client'`) setting up Intersection Observer:

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    },
    { threshold: 0.1 }
  )
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}, [])
```

- [ ] **Step 3: Verify in browser**

Navigate to homepage. Hero should be clean, 2-column, white background, with social icons and bottom info strip.

---

### Task 4: Category Filters & Product Grid

**Files:**
- Modify: `src/app/page.tsx` — category chips section, product grid, product cards

**Interfaces:**
- Consumes: CSS classes, `categories` and `products` data already fetched in page.tsx
- Produces: Refactored catalog section with asymmetric grid

- [ ] **Step 1: Replace category filter buttons with sage pill chips**

Replace current category button code:

```tsx
{/* Categories */}
<div className="flex flex-wrap gap-2 justify-center reveal" id="catalog">
  <button
    onClick={() => setSelectedCategory(null)}
    className={`px-6 py-2 rounded-full text-sm transition-all ${
      selectedCategory === null
        ? 'bg-sage text-white'
        : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
    }`}
  >
    🌿 Все
  </button>
  {categories.map((cat, i) => (
    <button
      key={i}
      onClick={() => setSelectedCategory(cat.name)}
      className={`px-6 py-2 rounded-full text-sm transition-all reveal reveal-delay-${Math.min(i + 1, 5)} ${
        selectedCategory === cat.name
          ? 'bg-sage text-white'
          : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
      }`}
    >
      {cat.name}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Replace product grid with asymmetric layout**

Replace the grid container:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
  {filteredProducts.map((product, i) => {
    // Every 3rd card is wider
    const isWide = (i + 1) % 3 === 0
    const images = parseImages(product.image_url)
    
    return (
      <Link
        key={product.id}
        href={`/products/${product.id}`}
        className={`group ${isWide ? 'lg:col-span-2' : ''} reveal reveal-delay-${Math.min((i % 6) + 1, 5)}`}
      >
        <div className="bg-white">
          {/* Image */}
          <div className={`${isWide ? 'aspect-[3/2]' : 'aspect-[4/5]'} bg-[#F5F5F0] rounded-sm overflow-hidden img-zoom relative`}>
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">🪴</div>
            )}
            
            {/* Hover overlay with favorite */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />
            
            {/* Favorite button on hover */}
            <button
              onClick={(e) => {
                e.preventDefault()
                toggleFavorite(product.id)
              }}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
            >
              <svg className={`w-4 h-4 ${isFavorite(product.id) ? 'text-red-500 fill-red-500' : 'text-[#8CA89C]'}`} viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="pt-4 pb-2">
            {product.category && (
              <span className="text-sage text-xs tracking-wide uppercase">{product.category}</span>
            )}
            <h3 className="text-[#1A1A1A] text-base font-medium mt-1 leading-snug">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sage font-medium">{product.price} ₽</span>
              {product.stock > 0 ? (
                <span className="text-[11px] text-[#8CA89C]">в наличии</span>
              ) : (
                <span className="text-[11px] text-[#B0B0A8]">нет в наличии</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    )
  })}
</div>
```

- [ ] **Step 3: Add empty state for no results**

Above the grid, if `filteredProducts.length === 0`:

```tsx
{filteredProducts.length === 0 && (
  <div className="col-span-full text-center py-20">
    <p className="text-[#6B7280]">Нет товаров в этой категории</p>
  </div>
)}
```

- [ ] **Step 4: Verify in browser**

Check that the grid is asymmetric (every 3rd card wider), hover reveals heart button, categories filter correctly.

---

### Task 5: Product Detail Page

**Files:**
- Modify: `src/app/products/[id]/page.tsx` — full rewrite

**Interfaces:**
- Consumes: `Product` type from `product-utils.ts`, scroll-reveal CSS
- Produces: Premium product detail page with 60/40 gallery layout

- [ ] **Step 1: Rewrite product detail layout**

Replace the entire page content. Key changes:
- Remove gradient-animated background — pure white
- Remove the main content card wrapper (white rounded-3xl shadow-xl)
- 60/40 split: image left, info right
- No button card backgrounds for care specs — just inline text with emoji

Layout structure:

```tsx
<section className="min-h-screen bg-white pt-24 pb-16">
  <div className="max-w-7xl mx-auto px-6">
    {/* Back link */}
    <Link href="/#catalog" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-sage transition-colors mb-8">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
      </svg>
      Назад в каталог
    </Link>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      {/* Left: Gallery — 7 cols */}
      <div className="lg:col-span-7 reveal visible">
        {/* Main image */}
        <div className="aspect-[4/5] bg-[#F5F5F0] rounded-sm overflow-hidden">
          {images.length > 0 ? (
            <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🪴</div>
          )}
        </div>
        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-16 h-16 rounded-sm overflow-hidden border transition-colors ${
                  selectedImage === i ? 'border-sage' : 'border-[#E5E5E0] hover:border-sage'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Info — 5 cols */}
      <div className="lg:col-span-5 reveal visible reveal-delay-1">
        {product.category && (
          <span className="text-sage text-xs tracking-[0.15em] uppercase">{product.category}</span>
        )}
        
        <h1 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-2 leading-tight">
          {product.name}
        </h1>
        
        <div className="text-3xl text-[#1A3326] font-medium mt-4">
          {product.price} ₽
        </div>

        {product.description && (
          <div className="mt-6">
            <p className="text-[#6B7280] leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Stock status */}
        <div className="mt-6 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-sage' : 'bg-[#D4D4D0]'}`} />
          <span className="text-sm text-[#6B7280]">
            {product.stock > 0 ? 'В наличии' : 'Нет в наличии'}
          </span>
        </div>

        {/* CTA */}
        <button
          disabled={product.stock === 0}
          className="w-full mt-8 px-8 py-4 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-press"
        >
          Добавить в избранное ♡
        </button>

        {/* Care specs */}
        <div className="mt-10 pt-8 border-t border-[#E5E5E0]">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-xl mb-1">🌱</div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wide">Уход</div>
              <div className="text-sm text-[#1A1A1A] mt-0.5">Умеренный</div>
            </div>
            <div className="text-center">
              <div className="text-xl mb-1">💧</div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wide">Полив</div>
              <div className="text-sm text-[#1A1A1A] mt-0.5">1 раз в неделю</div>
            </div>
            <div className="text-center">
              <div className="text-xl mb-1">☀️</div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wide">Свет</div>
              <div className="text-sm text-[#1A1A1A] mt-0.5">Рассеянный</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Verify in browser**

Navigate to a product page. Should show clean 60/40 split, no gradient backgrounds, no card wrappers.

---

### Task 6: Favorites, About Section, Footer

**Files:**
- Modify: `src/app/favorites/page.tsx` — update cards
- Modify: `src/app/page.tsx` — add About section + Footer

**Interfaces:**
- Consumes: same product card pattern from Task 4
- Produces: Consistent across all pages

- [ ] **Step 1: Update favorites page**

Replace favorites page with the same asymmetric grid and product cards from Task 4. Remove the gradient-animated background. Use `bg-white pt-28` instead.

- [ ] **Step 2: Add About section to homepage**

Before the footer:

```tsx
{/* About */}
<section className="py-24 bg-[#F5F5F0]">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="reveal">
        <span className="text-sage text-xs tracking-[0.2em] uppercase font-medium">О НАС</span>
        <h2 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-3 leading-tight">
          Больше чем просто магазин растений
        </h2>
        <p className="text-[#6B7280] mt-5 leading-relaxed">
          Мы отбираем редкие и здоровые растения, чтобы ваш дом наполнился жизнью и уютом. Каждое растение проходит проверку перед отправкой.
        </p>
        <div className="mt-8 flex gap-10">
          <div>
            <div className="text-2xl font-display text-[#1A3326]">50+</div>
            <div className="text-xs text-[#6B7280] mt-1">видов растений</div>
          </div>
          <div>
            <div className="text-2xl font-display text-[#1A3326]">1000+</div>
            <div className="text-xs text-[#6B7280] mt-1">счастливых клиентов</div>
          </div>
          <div>
            <div className="text-2xl font-display text-[#1A3326]">5★</div>
            <div className="text-xs text-[#6B7280] mt-1">средний рейтинг</div>
          </div>
        </div>
      </div>
      <div className="reveal reveal-delay-2">
        <div className="aspect-[4/3] bg-[#E8F0EA] rounded-sm overflow-hidden">
          <img src="/uploads/products/plant-28.jpg" alt="About us" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  </div>
</section>
```

```tsx
{/* Footer */}
<footer className="bg-sage text-white">
  <div className="max-w-7xl mx-auto px-6 py-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      <div>
        <h3 className="font-display text-lg tracking-wide">Plant Shop</h3>
        <p className="text-white/70 text-sm mt-3 leading-relaxed">Редкие комнатные растения с доставкой по Москве</p>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase mb-4 font-medium">Информация</h4>
        <ul className="space-y-2 text-sm text-white/70">
          <li><a href="#" className="hover:text-white transition-colors">Доставка и оплата</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Возврат</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Уход за растениями</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-xs tracking-[0.15em] uppercase mb-4 font-medium">Контакты</h4>
        <ul className="space-y-2 text-sm text-white/70">
          <li>Telegram: @plantshop</li>
          <li>WhatsApp: +7 (999) 123-45-67</li>
          <li>Email: hello@plantshop.ru</li>
        </ul>
      </div>
    </div>
    <div className="mt-12 pt-8 border-t border-white/20 text-center text-xs text-white/50">
      © 2026 Plant Shop. Все права защищены.
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Replace old "Обо мне" and "Контакты" sections with new About + Footer**

Remove the old sections and their data files.

- [ ] **Step 4: Verify in browser**

Check favorites page, about section, and footer look consistent.

---

### Task 7: Login & Admin Pages

**Files:**
- Modify: `src/app/login/page.tsx` — update styling
- Modify: `src/app/admin/layout.tsx` — minor updates
- Modify: `src/app/admin/products/page.tsx` — minor updates
- Modify: `src/app/admin/categories/page.tsx` — minor updates

- [ ] **Step 1: Update login page styling**

Replace gradient-animated background with clean white. Keep centered card but use new color palette (sage instead of green gradient for the button).

- [ ] **Step 2: Update admin layout**

Replace green background with white/light grey. Update navigation styling to match new palette.

- [ ] **Step 3: Update admin table styling**

Replace green gradient table headers with sage. Keep functional — admin doesn't need to be as visually polished.

- [ ] **Step 4: Verify build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

---

### Self-Review Checklist

- **Spec coverage**: All spec sections covered — palette (Task 1), typography (Task 1), hero (Task 3), nav (Task 2), categories (Task 4), grid (Task 4), product detail (Task 5), about (Task 6), footer (Task 6), login/admin (Task 7)
- **Placeholder scan**: No TODOs, no TBDs, no vague steps
- **Type consistency**: All references use same color names, class names, and patterns

