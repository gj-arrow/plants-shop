'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

export default function Navbar() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setSearchValue(q);
  }, []);

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

            {/* Контакты */}
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

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-4 py-2 rounded-[50px] border-2 border-[#66BB6A] bg-[rgba(102,187,106,0.12)] text-[#2D1B4E] font-semibold text-sm cursor-pointer transition-all duration-300 no-underline
                hover:bg-gradient-to-r hover:from-[#4CAF50] hover:to-[#66BB6A] hover:text-white hover:scale-105 hover:shadow-[0_4px_15px_rgba(102,187,106,0.5)] hover:border-transparent"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="hidden sm:inline">Корзина</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-1 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_2px_5px_rgba(76,175,80,0.4)]">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-[#81C784] animate-pulse"></div>
            ) : session?.user ? (
              <Link
                href={(session.user as any).role === 'admin' ? '/admin/products' : '/profile'}
                className="flex items-center gap-2 bg-[rgba(76,175,80,0.1)] px-3 py-1.5 rounded-full btn-press hover:bg-[rgba(76,175,80,0.2)] transition no-underline"
              >
                {(session.user as any).avatar_url ? (
                  <img src={(session.user as any).avatar_url} alt={(session.user as any).name || 'User'} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] flex items-center justify-center text-xs font-bold text-white">
                    {((session.user as any).name || session.user?.email || '').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium text-[#2D1B4E] hidden sm:inline">{((session.user as any).name || session.user?.email || '').split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline"
              >
                Вход
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
