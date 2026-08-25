'use client';

import { Fragment, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, parseImages, formatPrice, showPriceFrom } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="bg-gradient-animated min-h-screen" style={{ paddingTop: '5rem' }} />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Гортензии');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  // Индекс показанного фото в карточке по каждому товару
  const [cardImageIdx, setCardImageIdx] = useState<Record<number, number>>({});

  // Админ ли пользователь (для кнопки "Изменить главное фото")
  const [isAdmin, setIsAdmin] = useState(false);
  // Версия hero-фото для сброса кеша после загрузки
  const [heroVersion, setHeroVersion] = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.authenticated && data.user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      const response = await fetch('/api/upload/hero', { method: 'POST', body: formDataObj });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка загрузки');
      setHeroVersion(Date.now()); // сброс кеша картинки
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка при загрузке изображения');
    } finally {
      setHeroUploading(false);
      e.target.value = '';
    }
  };

  // Восстановление категории/страницы при возврате из карточки товара
  useEffect(() => {
    const savedCategory = sessionStorage.getItem('catalogCategory');
    const savedSubcategory = sessionStorage.getItem('catalogSubcategory');
    const savedPage = sessionStorage.getItem('catalogPage');
    const hasSaved = savedCategory || savedSubcategory || savedPage;
    if (hasSaved) {
      if (savedCategory) {
        sessionStorage.setItem('_restoredCategory', savedCategory);
        setSelectedCategory(savedCategory);
      }
      if (savedSubcategory) setSelectedSubcategory(savedSubcategory);
      if (savedPage) setPage(parseInt(savedPage, 10));
    }
    sessionStorage.removeItem('catalogCategory');
    sessionStorage.removeItem('catalogSubcategory');
    sessionStorage.removeItem('catalogPage');
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const PAGE_SIZE = isDesktop ? 12 : 14;
  const clickCount = useRef(0);
  const router = useRouter();

  const handleSecretClick = useCallback(() => {
    clickCount.current += 1;
    if (clickCount.current >= 15) {
      router.push('/login');
    }
  }, [router]);

  // Mobile search — writes to URL, debounced
  const [mobileSearchValue, setMobileSearchValue] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = mobileSearchValue.trim();
      const currentQ = new URLSearchParams(window.location.search).get('q') || '';
      if (trimmed !== currentQ) {
        const url = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/';
        router.push(url, { scroll: false });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [mobileSearchValue, router]);
  // Sync mobile search when URL changes externally (e.g. desktop search)
  useEffect(() => {
    setMobileSearchValue(searchQuery);
  }, [searchQuery]);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch('/api/categories').then(r => r.ok ? r.json() : []),
    ])
      .then(([productsData, categoriesData]) => {
        setProducts(Array.isArray(productsData) ? productsData : []);
        const names = (Array.isArray(categoriesData) ? categoriesData : []).map((c: any) => c.name);
        setCategories(['all', ...names]);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
        setLoading(false);
      });
  }, []);

  // Восстановление скролла при возврате из карточки товара
  useEffect(() => {
    if (!loading) {
      const savedY = sessionStorage.getItem('catalogScrollY');
      if (savedY) {
        sessionStorage.removeItem('catalogScrollY');
        requestAnimationFrame(() => window.scrollTo(0, parseInt(savedY, 10)));
      }
    }
  }, [loading]);

  const saveScroll = () => {
    sessionStorage.setItem('catalogScrollY', String(window.scrollY));
    sessionStorage.setItem('catalogPage', String(page));
    sessionStorage.setItem('catalogCategory', selectedCategory);
    sessionStorage.setItem('catalogSubcategory', selectedSubcategory);
  };

  const filteredProducts = products.filter(p => {
    // При активном поиске категория и подкатегория игнорируются — ищем по всем категориям
    const isSearching = searchQuery.trim().length > 0;
    const matchesCategory = isSearching || selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSubcategory = isSearching || !selectedSubcategory || p.subcategory === selectedSubcategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  // Подкатегории для выбранной категории
  const subcategories = selectedCategory !== 'all'
    ? [...new Set(products.filter(p => p.category === selectedCategory && p.subcategory).map(p => p.subcategory!))]
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.out_of_stock && !b.out_of_stock) return 1;
    if (!a.out_of_stock && b.out_of_stock) return -1;
    return 0;
  });
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const prevCategory = useRef(selectedCategory);
  const prevQuery = useRef(searchQuery);
  // Сброс подкатегории и страницы при смене категории или поиска
  // Пропускаем если это восстановление после возврата из карточки товара
  useEffect(() => {
    if (prevCategory.current === selectedCategory && prevQuery.current === searchQuery) return;
    const restoredCategory = sessionStorage.getItem('_restoredCategory');
    if (restoredCategory) {
      sessionStorage.removeItem('_restoredCategory');
      prevCategory.current = selectedCategory;
      prevQuery.current = searchQuery;
      return;
    }
    prevCategory.current = selectedCategory;
    prevQuery.current = searchQuery;
    setSelectedSubcategory('');
    setPage(1);
  }, [selectedCategory, searchQuery]);

  // Скролл к каталогу при переключении страницы (не при первичной загрузке)
  const catalogScrolledOnce = useRef(false);
  useEffect(() => {
    if (!loading) {
      if (!catalogScrolledOnce.current) {
        catalogScrolledOnce.current = true;
        return;
      }
      const el = document.getElementById('catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [page, loading]);

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

  return (
    <>
      {/* Hero */}
      <section className="relative bg-white pt-16">

        {/* Full-width background image */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={`/uploads/products/hero.jpg?v=${heroVersion}`}
            alt=""
            className="w-full h-full object-cover hero-parallax"
          />
          {/* Кнопка смены главного фото — только для админа */}
          {isAdmin && (
            <div className="absolute top-20 right-4 z-20">
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeroUpload}
                disabled={heroUploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={heroUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium backdrop-blur-sm hover:bg-black/70 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {heroUploading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Загрузка...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Изменить главное фото
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch min-h-[60vh] lg:min-h-[60vh]" onClick={handleSecretClick}>

            {/* Left: Text */}
            <div className="reveal visible pt-8 pb-6 lg:pb-12 lg:py-20 flex flex-col">

              <h1 className="text-white font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.1] mt-6">
                <span className="block text-2xl sm:text-3xl lg:text-4xl tracking-[0.2em] uppercase mb-3 drop-shadow-md">
                  Цветы Людмилы
                </span>
                Хвойные, ниваки, гортензии и другое
              </h1>

              {/* Social — mobile */}
              <div className="flex lg:hidden gap-4 mt-auto pt-8 flex-wrap">
                <a href="tel:+375298425952" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Позвонить">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/></svg>
                  <span className="text-sm font-medium whitespace-nowrap">+375 (29) 842-59-52</span>
                </a>
                <a href="https://viber.click/375298425952" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Viber">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297z"/></svg>
                </a>
                <a href="https://www.instagram.com/tereshko3584/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              </div>

              {/* Social */}
              <div className="hidden lg:flex gap-4 mt-auto pt-12 flex-wrap">
                <a href="tel:+375298425952" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Позвонить">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/></svg>
                  <span className="text-sm font-medium whitespace-nowrap">+375 (29) 842-59-52</span>
                </a>
                <a href="https://viber.click/375298425952" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Viber">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.326 6.812-.416 7.15-.525.776-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546-.596-.55-3.006-2.3-8.375-2.323 0 0-.395-.025-1.037-.017zm.058 1.693c.545-.004.88.017.88.017 4.542.02 6.717 1.388 7.222 1.846 1.675 1.435 2.53 4.868 1.906 9.897v.002c-.604 4.878-4.174 5.184-4.832 5.395-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.12.12-.26.167-.352.144-.13-.033-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.292-4.43-8.895.054-2.604.543-4.738 1.996-6.173 1.96-1.773 5.474-2.018 7.11-2.03zm.38 2.602c-.167 0-.303.135-.304.302 0 .167.133.303.3.305 1.624.01 2.946.537 4.028 1.592 1.073 1.046 1.62 2.468 1.633 4.334.002.167.14.3.307.3.166-.002.3-.138.3-.304-.014-1.984-.618-3.596-1.816-4.764-1.19-1.16-2.692-1.753-4.447-1.765zm-3.96.695c-.19-.032-.4.005-.616.117l-.01.002c-.43.247-.816.562-1.146.932-.002.004-.006.004-.008.008-.267.323-.42.638-.46.948-.008.046-.01.093-.007.14 0 .136.022.27.065.4l.013.01c.135.48.473 1.276 1.205 2.604.42.768.903 1.5 1.446 2.186.27.344.56.673.87.984l.132.132c.31.308.64.6.984.87.686.543 1.418 1.027 2.186 1.447 1.328.733 2.126 1.07 2.604 1.206l.01.014c.13.042.265.064.402.063.046.002.092 0 .138-.008.31-.036.627-.19.948-.46.004 0 .003-.002.008-.005.37-.33.683-.72.93-1.148l.003-.01c.225-.432.15-.842-.18-1.12-.004 0-.698-.58-1.037-.83-.36-.255-.73-.492-1.113-.71-.51-.285-1.032-.106-1.248.174l-.447.564c-.23.283-.657.246-.657.246-3.12-.796-3.955-3.955-3.955-3.955s-.037-.426.248-.656l.563-.448c.277-.215.456-.737.17-1.248-.217-.383-.454-.756-.71-1.115-.25-.34-.826-1.033-.83-1.035-.137-.165-.31-.265-.502-.297z"/></svg>
                </a>
                <a href="https://www.instagram.com/tereshko3584/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-sage text-white flex items-center justify-center hover:bg-sage-dark hover:scale-105 transition-all shadow-md" aria-label="Instagram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                </a>
              </div>
            </div>

            {/* Right: empty — image is full-width background */}
            <div className="hidden lg:block" />

          </div>
        </div>

      </section>

      {/* Search — над категориями */}
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-2" style={{ position: 'relative', zIndex: 2 }}>
        <div className="relative md:max-w-lg md:mx-auto">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={mobileSearchValue}
            onChange={e => setMobileSearchValue(e.target.value)}
            placeholder="Поиск по названию"
            className="w-full pl-9 pr-8 py-2.5 text-[16px] border border-[#E5E5E0] rounded-full bg-white text-[#1A3326] placeholder-[#9CA3AF] focus:outline-none focus:border-sage"
          />
          {mobileSearchValue && (
            <button
              onClick={() => {
                setMobileSearchValue('');
                router.push('/', { scroll: false });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition cursor-pointer"
              aria-label="Очистить поиск"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-center pt-3 lg:pt-8" id="catalog">
              {categories.filter(c => c === 'Гортензии').map((cat, i) => (
                <Fragment key={i}>
                  <div className="flex flex-wrap gap-2 justify-center items-center w-full">
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-sage text-white'
                          : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                      }`}
                    >
                      {cat}
                    </button>
                    {selectedCategory === cat && subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button
                          onClick={() => setSelectedSubcategory('')}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            !selectedSubcategory
                              ? 'bg-sage/10 text-sage font-medium'
                              : 'text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                          }`}
                        >
                          Все
                        </button>
                        {subcategories.map(sub => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubcategory(sub)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              selectedSubcategory === sub
                                ? 'bg-sage/10 text-sage font-medium'
                                : 'text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Fragment>
              ))}
              <div className="flex flex-wrap gap-2 justify-center items-center w-full">
                {categories.filter(c => c !== 'all' && c !== 'Гортензии').map((cat, i) => (
                  <Fragment key={i}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-sm transition-all ${
                        selectedCategory === cat
                          ? 'bg-sage text-white'
                          : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                      }`}
                    >
                      {cat}
                    </button>
                    {selectedCategory === cat && subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <button
                          onClick={() => setSelectedSubcategory('')}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                            !selectedSubcategory
                              ? 'bg-sage/10 text-sage font-medium'
                              : 'text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                          }`}
                        >
                          Все
                        </button>
                        {subcategories.map(sub => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubcategory(sub)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                              selectedSubcategory === sub
                                ? 'bg-sage/10 text-sage font-medium'
                                : 'text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-3"></div>
                <p className="text-[#6B7280]">Загрузка товаров...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#6B7280]">Нет товаров в этой категории</p>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
                {paginatedProducts.map((product, i) => {
                  const images = parseImages(product);
                  const imgIdx = Math.min(cardImageIdx[product.id] ?? 0, Math.max(images.length - 1, 0));
                  const nextImage = () => setCardImageIdx(prev => ({ ...prev, [product.id]: (imgIdx + 1) % images.length }));
                  const prevImage = () => setCardImageIdx(prev => ({ ...prev, [product.id]: (imgIdx - 1 + images.length) % images.length }));

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group card-enter h-full"
                      style={{ animationDelay: `${Math.min(i, 5) * 0.1}s` }}
                      onClick={saveScroll}
                    >
                      <div className="bg-white rounded-sm shadow-[0_2px_20px_rgba(28,55,40,0.06)] flex flex-col h-full">
                        {/* Image */}
                        <div className="aspect-[9/16] bg-[#F5F5F0] overflow-hidden rounded-sm img-zoom relative">
                          {images.length > 0 ? (
                            <img
                              src={images[imgIdx]}
                              alt={product.name}
                              className={`w-full h-full object-cover ${product.out_of_stock ? 'opacity-60' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🪴</div>
                          )}

                          {/* Gallery arrows */}
                          {images.length > 1 && (
                            <>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
                                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1A3326] flex items-center justify-center shadow-sm transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 z-10"
                                aria-label="Предыдущее фото"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#1A3326] flex items-center justify-center shadow-sm transition-all opacity-80 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 z-10"
                                aria-label="Следующее фото"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}

                          {/* Dots */}
                          {images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                              {images.map((_, di) => (
                                <button
                                  key={di}
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardImageIdx(prev => ({ ...prev, [product.id]: di })); }}
                                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                                    di === imgIdx ? 'bg-sage scale-125' : 'bg-white/70 hover:bg-white'
                                  }`}
                                  aria-label={`Фото ${di + 1}`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />

                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                              isFavorite(product.id)
                                ? 'bg-white/90 opacity-70 md:opacity-100'
                                : 'bg-white/80 opacity-70 md:opacity-100'
                            }`}
                          >
                            <svg className={`w-4 h-4 ${isFavorite(product.id) ? 'text-red-500 fill-red-500' : 'text-[#8CA89C]'}`} viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                        </div>

                        {/* Info */}
                        <div className="pt-4 pb-2 px-4 flex-1 flex flex-col justify-between">
                          {product.category && (
                            <span className="text-sage text-xs tracking-wide uppercase">{product.category}</span>
                          )}
                          <h3 className="text-[#1A1A1A] font-display text-base font-medium mt-1 leading-snug">
                            {product.name}
                          </h3>
                            <div className="flex items-center justify-between mt-2">
                              {product.out_of_stock ? (
                                <span className="text-red-400 text-sm font-medium">Нет в наличии</span>
                              ) : (
                                <span className="text-sage font-medium">{showPriceFrom(product) ? 'от ' : ''}{formatPrice(product.price)} BYN</span>
                              )}
                            </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm border border-[#E5E5E0] disabled:opacity-30 disabled:cursor-not-allowed hover:border-sage transition-colors text-[#6B7280]"
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        p === currentPage
                          ? 'bg-sage text-white'
                          : 'text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm border border-[#E5E5E0] disabled:opacity-30 disabled:cursor-not-allowed hover:border-sage transition-colors text-[#6B7280]"
                  >
                    →
                  </button>
                  </div>
                )}
                <div className="text-center text-sm text-[#8a7a9a] mt-3">
                  Показано {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} из {filteredProducts.length}
                </div>
              </>
            )}
          </div>
        </div>

      {/* About */}


      {/* Contacts */}
      <section id="contacts" className="pt-8 pb-12 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-3 leading-tight">
              Свяжитесь со мной
            </h2>
            <p className="text-[#6B7280] mt-4 max-w-xl mx-auto">
              Обращайтесь любым удобным для Вас способом. Помогу с выбором, подробно расскажу о каждом интересующем Вас растении.
            </p>
            <p className="text-[#6B7280] mt-2 max-w-xl mx-auto">
              Доставка Европочтой и Белпочтой. Крупномеры — самовывоз (г. Горки)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {/* Телефон */}
            <a
              href="tel:+375298425952"
              className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group no-underline"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #2E7D32, #4CAF50)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/>
                </svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Телефон</span>
              <span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/+375298425952"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #0088cc, #00a8e6)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Telegram</span>
              <span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>

            {/* Viber */}
            <a
              href="https://viber.click/375298425952"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #7360f2, #8b7cf7)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M12.072 0C5.378 0 .029 4.317.029 10.639c0 3.139 1.382 5.954 3.571 7.873V24l6.97-3.243c.678.133 1.377.205 2.093.205 6.694 0 12.043-4.317 12.043-10.64C24.214 4.317 18.766 0 12.072 0zm6.047 14.572c-.273.773-1.396 1.418-1.956 1.512-.535.09-1.008.382-3.34-.703-2.82-1.254-4.617-4.5-4.757-4.71-.14-.21-1.134-1.512-1.134-2.883 0-1.371.723-2.04.98-2.32.258-.28.562-.35.749-.35.187 0 .374 0 .535.007.187.007.437-.07.686.522.257.604.875 2.098.952 2.25.077.154.128.332.025.536-.102.205-.154.332-.307.51-.153.176-.322.37-.46.497-.153.14-.312.293-.203.574.108.28.507 1.365 1.09 2.21.748 1.072 1.38 1.44 1.585 1.594.204.153.332.128.454-.077.12-.205.535-.624.678-.84.145-.215.29-.18.485-.107.196.074 1.254.59 1.47.698.215.107.358.16.41.25.05.09.05.52-.223 1.293z"/>
                </svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Viber</span>
              <span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/tereshko3584/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Instagram</span>
              <span className="text-xs text-[#6B7280]">@tereshko3584</span>
            </a>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="bg-sage text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">
            <div>
              <h3 className="font-display text-lg tracking-wide">Зелёная мастерская</h3>
              <p className="text-white/70 text-sm mt-3 leading-relaxed whitespace-nowrap">Доставка: Европочта, Белпочта.</p>
              <p className="text-white/70 text-sm mt-1 leading-relaxed">Самовывоз: г. Горки, Могилёвская область.</p>
            </div>
            <div>
              <h4 className="text-xs tracking-[0.15em] uppercase mb-4 font-medium">Контакты</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="whitespace-nowrap">Людмила Леонидовна</li>
                <li className="whitespace-nowrap">+375 (29) 842-59-52</li>
              </ul>
            </div>
            <div className="text-sm text-white/70 pt-4 border-t border-white/20 md:pt-0 md:border-t-0 md:ml-auto">
              <p className="md:whitespace-nowrap">Терешко Людмила Леонидовна. УНП МА1500564</p>
              <p className="mt-1 md:whitespace-nowrap">Самозанятая (плательщик налога на профессиональный доход)</p>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
