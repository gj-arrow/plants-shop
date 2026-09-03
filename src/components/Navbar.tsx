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
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#FDFBF7]/90 backdrop-blur-xl shadow-[0_1px_30px_rgba(18,38,32,0.06)]'
            : 'bg-[#FDFBF7]/70 backdrop-blur-md'
        }`}
      >
        {/* тонкая золотая линия сверху */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#C9A86A]/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[68px]">
            <button
              onClick={() => {
                if (window.location.pathname !== '/') {
                  router.push('/');
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="group flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-[#122620] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                <span className="text-[#C9A86A] text-[14px]">✦</span>
              </div>
              <div className="text-left leading-none">
                <div className="font-display font-semibold text-[17px] tracking-[-0.02em] flex gap-1">
                  <span className="text-[#122620]">Зелёная</span>
                  <span className="text-[#C9A86A]">мастерская</span>
                </div>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-1 bg-white/60 backdrop-blur rounded-full p-1 border border-[#E8D5B7]/30 shadow-sm">
              <button
                onClick={() => scrollToSection('catalog')}
                className="px-5 py-2 rounded-full text-[13px] tracking-wide font-medium text-[#122620] hover:bg-[#122620] hover:text-white transition-all cursor-pointer"
              >
                Каталог
              </button>
              <button
                onClick={() => scrollToSection('contacts')}
                className="px-5 py-2 rounded-full text-[13px] tracking-wide font-medium text-[#6B6B6B] hover:bg-[#122620] hover:text-white transition-all cursor-pointer"
              >
                Контакты
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(!customUser || customUser.role !== 'admin') && (
                <Link
                  href="/favorites"
                  className="relative w-10 h-10 rounded-full bg-white border border-[#E8D5B7]/40 flex items-center justify-center text-[#122620] hover:border-[#C9A86A]/50 hover:bg-[#FDFBF7] transition-all shadow-sm group"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:scale-110 transition-transform"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#C9A86A] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(201,168,106,0.5)] border-2 border-[#FDFBF7]">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              )}

              {customUser?.role === 'admin' ? (
                <div className="hidden md:flex items-center gap-2 ml-1">
                  <Link
                    href="/admin/products"
                    className="text-[13px] bg-[#122620] text-white px-5 py-2.5 rounded-full font-medium hover:bg-black transition shadow-sm"
                  >
                    Товары
                  </Link>
                  <Link
                    href="/admin/categories"
                    className="text-[13px] bg-white border border-[#E8D5B7] text-[#122620] px-5 py-2.5 rounded-full font-medium hover:border-[#C9A86A] transition"
                  >
                    Категории
                  </Link>
                  <button
                    onClick={async () => {
                      await fetch('/api/auth', { method: 'DELETE' });
                      window.location.reload();
                    }}
                    className="text-xs tracking-wide text-[#8A8178] hover:text-[#122620] font-medium px-3 transition cursor-pointer"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <a href="tel:+375298425952" className="hidden lg:inline-flex items-center gap-2 ml-1 pl-3 pr-4 py-2 rounded-full bg-[#122620] text-white text-[13px] font-medium hover:bg-black transition shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/></svg>
                  </span>
                  +375 29 842-59-52
                </a>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 rounded-full bg-white border border-[#E8D5B7]/40 flex items-center justify-center text-[#122620] cursor-pointer shadow-sm"
                aria-label="Меню"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
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
        {/* нижняя тонкая линия */}
        <div className={`h-[1px] bg-[#E8D5B7]/30 transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[#122620]/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-[72px] left-3 right-3 bg-[#FDFBF7] shadow-[0_16px_40px_rgba(18,38,32,0.12)] rounded-[20px] p-5 flex flex-col gap-1 border border-[#E8D5B7]/30 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A86A]/30 to-transparent" />
            <button
              onClick={() => {
                scrollToSection('catalog');
                setMobileOpen(false);
              }}
              className="text-[15px] text-[#122620] font-medium text-left py-3 px-3 rounded-xl hover:bg-white transition flex justify-between items-center"
            >
              Каталог <span className="text-[#C9A86A]">→</span>
            </button>
            <button
              onClick={() => {
                scrollToSection('contacts');
                setMobileOpen(false);
              }}
              className="text-[15px] text-[#122620] font-medium text-left py-3 px-3 rounded-xl hover:bg-white transition flex justify-between items-center"
            >
              Контакты <span className="text-[#C9A86A]">→</span>
            </button>
            <div className="h-[1px] bg-[#E8D5B7]/30 my-2" />
            <a href="tel:+375298425952" className="flex items-center justify-center gap-2 bg-[#122620] text-white rounded-full py-3 text-sm font-medium">Позвонить — +375 29 842-59-52</a>
            {customUser?.role === 'admin' && (
              <>
                <Link
                  href="/admin/products"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[#122620] font-medium py-2 px-3 rounded-xl bg-white border border-[#E8D5B7]/30 text-center mt-2"
                >
                  Товары
                </Link>
                <Link
                  href="/admin/categories"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-[#122620] font-medium py-2 px-3 rounded-xl bg-white border border-[#E8D5B7]/30 text-center"
                >
                  Категории
                </Link>
                <button
                  onClick={async () => {
                    await fetch('/api/auth', { method: 'DELETE' });
                    window.location.reload();
                  }}
                  className="text-sm text-[#8A8178] font-medium text-center py-2"
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
