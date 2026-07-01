'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [customUser, setCustomUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const { favorites } = useFavorites();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read initial search from URL
  const initialSearch = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '';
  const [searchValue, setSearchValue] = useState(initialSearch);

  useEffect(() => {
    setCustomUser(null);
    fetch('/api/auth')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => {
        if (data.authenticated && data.user) {
          setCustomUser(data.user);
        }
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const scrollToSection = (id: string) => {
    if (window.location.pathname !== '/') {
      router.push('/', { scroll: false });
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Debounced search — navigates after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchValue.trim();
      const currentQ = new URLSearchParams(window.location.search).get('q') || '';
      if (trimmed !== currentQ) {
        const url = trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/';
        router.push(url, { scroll: false });
        if (trimmed) {
          setTimeout(() => {
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue, router]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="text-xl font-bold no-underline cursor-pointer"
            >
              <span className="font-['Playfair_Display'] font-bold text-[#8CA89C]">
                Зелёная
              </span>{' '}
              <span className="font-['Playfair_Display'] font-bold text-[#1A3326]">
                мастерская
              </span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('catalog')}
                className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
              >
                Каталог
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
              >
                Обо мне
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
              >
                Контакты
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    placeholder="Поиск растений..."
                    className="w-48 sm:w-64 pl-9 pr-4 py-1.5 text-sm border border-[#E5E5E0] rounded-full bg-white text-[#1A3326] placeholder-[#9CA3AF] focus:outline-none focus:border-sage"
                  />
                </div>
              </div>

              {(!customUser || customUser.role !== 'admin') && (
                <Link
                  href="/favorites"
                  className="relative p-2 text-[#8CA89C] hover:text-[#1A3326] transition no-underline"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorites.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              )}

              {customUser?.role === 'admin' ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/admin/products"
                    className="text-base bg-[#8CA89C] text-white px-4 py-2 rounded-full font-medium hover:bg-[#5B7F6B] transition no-underline"
                  >
                    Товары
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="text-base bg-[#8CA89C] text-white px-4 py-2 rounded-full font-medium hover:bg-[#5B7F6B] transition no-underline"
                  >
                    Категории
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth', { method: 'DELETE' });
                      window.location.reload();
                    }}
                    className="text-sm text-[#8CA89C] hover:text-red-500 font-medium transition cursor-pointer"
                  >
                    Выйти
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-[#1A3326] cursor-pointer"
                aria-label="Меню"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {mobileOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-20 left-0 right-0 bg-white shadow-lg rounded-b-2xl mx-4 p-6 flex flex-col gap-4">
            <div className="relative mb-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                placeholder="Поиск растений..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E5E5E0] rounded-full bg-white text-[#1A3326] placeholder-[#9CA3AF] focus:outline-none focus:border-sage"
              />
            </div>
            <button
              onClick={() => {
                scrollToSection('catalog');
                setMobileOpen(false);
              }}
              className="text-base text-[#1A3326] font-medium text-left py-2 border-b border-[#E5E5E0]"
            >
              Каталог
            </button>
            <button
              onClick={() => {
                scrollToSection('about');
                setMobileOpen(false);
              }}
              className="text-base text-[#1A3326] font-medium text-left py-2 border-b border-[#E5E5E0]"
            >
              Обо мне
            </button>
            <button
              onClick={() => {
                scrollToSection('contacts');
                setMobileOpen(false);
              }}
              className="text-base text-[#1A3326] font-medium text-left py-2 border-b border-[#E5E5E0]"
            >
              Контакты
            </button>
            {customUser?.role === 'admin' && (
              <>
                <Link
                  href="/admin/products"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-[#1A3326] font-medium py-2 border-b border-[#E5E5E0] no-underline"
                >
                  Товары
                </Link>
                <Link
                  href="/admin/categories"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-[#1A3326] font-medium py-2 border-b border-[#E5E5E0] no-underline"
                >
                  Категории
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth', { method: 'DELETE' });
                    window.location.reload();
                  }}
                  className="text-base text-[#8CA89C] font-medium text-left py-2"
                >
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
