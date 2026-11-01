'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [customUser, setCustomUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const { favorites } = useFavorites();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-md border-b border-line/70 shadow-[0_1px_24px_rgba(23,48,31,0.05)]"
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
              className="text-xl no-underline cursor-pointer group"
            >
              <span className="font-display font-semibold text-forest tracking-wide transition-colors duration-300 group-hover:text-forest-2">
                Зелёная
              </span>{' '}
              <span className="font-display italic font-medium text-brass tracking-wide transition-colors duration-300 group-hover:text-brass">
                мастерская
              </span>
            </button>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('catalog')}
                className="nav-link text-sm text-muted tracking-[0.08em] hover:text-forest transition-colors cursor-pointer"
              >
                Каталог
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="nav-link text-sm text-muted tracking-[0.08em] hover:text-forest transition-colors cursor-pointer"
              >
                Контакты
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(!customUser || customUser.role !== 'admin') && (
                <Link
                  href="/favorites"
                  className="relative p-2 text-muted hover:text-forest hover:scale-110 transition-all duration-300 no-underline"
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
                    <span className="absolute -top-0.5 -right-0.5 bg-brass text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              )}

              {customUser?.role === 'admin' ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/admin/products"
                    className="text-base bg-forest text-white px-4 py-2 rounded-full font-medium hover:bg-forest-2 hover:shadow-lg hover:shadow-forest/20 hover:-translate-y-px transition-all no-underline"
                  >
                    Товары
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="text-base bg-forest text-white px-4 py-2 rounded-full font-medium hover:bg-forest-2 hover:shadow-lg hover:shadow-forest/20 hover:-translate-y-px transition-all no-underline"
                  >
                    Категории
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth', { method: 'DELETE' });
                      window.location.reload();
                    }}
                    className="text-sm text-muted hover:text-red-500 font-medium transition cursor-pointer"
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
          <div className="absolute inset-0 bg-forest/25 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-20 left-0 right-0 bg-paper shadow-[0_24px_60px_-12px_rgba(23,48,31,0.25)] rounded-b-2xl mx-4 p-6 flex flex-col gap-4 border border-line/70">
            <button
              onClick={() => {
                scrollToSection('catalog');
                setMobileOpen(false);
              }}
              className="text-base text-ink font-medium text-left py-2 border-b border-line/70"
            >
              Каталог
            </button>
            <button
              onClick={() => {
                scrollToSection('contacts');
                setMobileOpen(false);
              }}
              className="text-base text-ink font-medium text-left py-2 border-b border-line/70"
            >
              Контакты
            </button>
            {customUser?.role === 'admin' && (
              <>
                <Link
                  href="/admin/products"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-ink font-medium py-2 border-b border-line/70 no-underline"
                >
                  Товары
                </Link>
                <Link
                  href="/admin/categories"
                  onClick={() => setMobileOpen(false)}
                  className="text-base text-ink font-medium py-2 border-b border-line/70 no-underline"
                >
                  Категории
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth', { method: 'DELETE' });
                    window.location.reload();
                  }}
                  className="text-base text-brass font-medium text-left py-2"
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
