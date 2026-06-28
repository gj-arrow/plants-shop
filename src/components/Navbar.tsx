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

            {/* Обо мне (скрыто для админа) */}
            {(!customUser || customUser.role !== 'admin') && (
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
            )}

            {/* Контакты (скрыто для админа) */}
            {(!customUser || customUser.role !== 'admin') && (
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
            )}

            {/* Избранное (скрыто для админа) */}
            {(!customUser || customUser.role !== 'admin') && (
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
            )}

            {/* Admin links */}
            {customUser?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/products"
                  className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline"
                >
                  Товары
                </Link>
                <Link
                  href="/admin/categories"
                  className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline"
                >
                  Категории
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
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
