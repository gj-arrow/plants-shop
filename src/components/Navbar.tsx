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
  const [isVisible, setIsVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

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
    const control = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current || currentY < 60) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', control, { passive: true });
    return () => window.removeEventListener('scroll', control);
  }, []);

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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-transparent ${
          isVisible ? 'nav-visible' : 'nav-hidden'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-xl font-bold no-underline">
              <span className="font-['Playfair_Display'] font-bold text-[#1A3326]">
                Plant
              </span>
              <span className="font-['Playfair_Display'] font-bold text-[#8CA89C]">
                Shop
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('catalog')}
                className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
              >
                Каталог
              </button>
              {(!customUser || customUser.role !== 'admin') && (
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
                >
                  О нас
                </button>
              )}
              {(!customUser || customUser.role !== 'admin') && (
                <button
                  onClick={() => scrollToSection('contacts')}
                  className="text-sm text-[#6B7280] tracking-wide hover:text-[#1A3326] transition cursor-pointer"
                >
                  Контакты
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-[#8CA89C] hover:text-[#1A3326] transition cursor-pointer"
                aria-label="Поиск"
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
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>

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
                    className="text-xs bg-[#8CA89C] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#5B7F6B] transition no-underline"
                  >
                    Товары
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="text-xs bg-[#8CA89C] text-white px-3 py-1.5 rounded-full font-medium hover:bg-[#5B7F6B] transition no-underline"
                  >
                    Категории
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth', { method: 'DELETE' });
                      window.location.reload();
                    }}
                    className="text-xs text-[#8CA89C] hover:text-red-500 font-medium transition cursor-pointer"
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
            <button
              onClick={() => {
                scrollToSection('catalog');
                setMobileOpen(false);
              }}
              className="text-base text-[#1A3326] font-medium text-left py-2 border-b border-[#E5E5E0]"
            >
              Каталог
            </button>
            {(!customUser || customUser.role !== 'admin') && (
              <>
                <button
                  onClick={() => {
                    scrollToSection('about');
                    setMobileOpen(false);
                  }}
                  className="text-base text-[#1A3326] font-medium text-left py-2 border-b border-[#E5E5E0]"
                >
                  О нас
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
                <Link
                  href="/favorites"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-[#1A3326] font-medium py-2 border-b border-[#E5E5E0] no-underline flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  Избранное
                  {favorites.length > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              </>
            )}
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
