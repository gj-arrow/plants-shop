'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useFavorites } from '@/hooks/useFavorites';

export default function Navbar() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');
  const [customUser, setCustomUser] = useState<{ id: number; email: string; role: string } | null>(null);
  const [customCheckDone, setCustomCheckDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const { favorites } = useFavorites();
  const favoritesCount = favorites.length;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setSearchValue(q);
  }, []);

  useEffect(() => {
    setCustomCheckDone(false);
    setCustomUser(null);
    fetch('/api/auth')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data.authenticated && data.user) {
          setCustomUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setCustomCheckDone(true));
  }, [pathname]);

  // Новые заказы для админа — опрос каждые 30 секунд
  useEffect(() => {
    if (customUser?.role !== 'admin') {
      setNewOrdersCount(0);
      return;
    }
    const fetchNewOrders = () => {
      fetch('/api/orders')
        .then(res => res.ok ? res.json() : [])
        .then(orders => {
          const count = Array.isArray(orders) ? orders.filter((o: any) => o.status === 'new').length : 0;
          setNewOrdersCount(count);
        })
        .catch(() => {});
    };
    fetchNewOrders();
    const interval = setInterval(fetchNewOrders, 10_000);
    return () => clearInterval(interval);
  }, [customUser]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

            {/* Обо мне */}
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

            {/* Заказы (только для админа) */}
            {customUser?.role === 'admin' && (
              <Link
                href="/admin/orders"
                className="relative text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-[#4CAF50] py-2 no-underline
                  after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-[#4CAF50] after:to-[#66BB6A] after:transition-all after:duration-300 hover:after:w-full"
              >
                📦 Заказы
                {newOrdersCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    +{newOrdersCount}
                  </span>
                )}
              </Link>
            )}

            {/* Избранное (скрываем для админа) */}
            {customUser?.role !== 'admin' && (
              <Link
                href="/favorites"
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-[50px] text-[#2D1B4E] font-medium text-sm transition-colors duration-300 hover:text-red-500 hover:bg-red-50 no-underline"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="hidden sm:inline">Избранное</span>
                {favoritesCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_2px_5px_rgba(239,68,68,0.4)]">
                    {favoritesCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart (скрываем для админа) */}
            {customUser?.role !== 'admin' && (
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
            )}

            {/* User */}
            {status === 'loading' || !customCheckDone ? (
              <div className="w-8 h-8 rounded-full bg-[#81C784] animate-pulse"></div>
            ) : customUser || session?.user ? (
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                  setDropdownOpen(true);
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(() => setDropdownOpen(false), 200);
                }}
              >
                <Link
                  href={customUser?.role === 'admin' ? '/admin/products' : '/profile'}
                  className="text-sm bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-1.5 rounded-full font-medium btn-press hover:shadow-[0_4px_15px_rgba(76,175,80,0.4)] transition no-underline inline-block"
                >
                  {customUser?.role === 'admin' ? 'Администрирование' : 'Профиль'}
                </Link>
                {dropdownOpen && (
                  <div
                    onMouseEnter={() => {
                      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                      setDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      closeTimeoutRef.current = setTimeout(() => setDropdownOpen(false), 200);
                    }}
                    className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[rgba(76,175,80,0.15)] overflow-hidden fade-in z-50"
                  >
                    {customUser?.role === 'admin' ? (
                      <>
                        <div className="px-4 py-2 text-xs text-[#8a7a9a] uppercase tracking-wider font-semibold bg-[#FDF6F0]">
                          Администрирование
                        </div>
                        <Link
                          href="/admin/categories"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-[#E8F5E9] hover:text-[#4CAF50] transition no-underline"
                        >
                          📂 Управление категориями
                        </Link>
                        <Link
                          href="/admin/products"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-[#E8F5E9] hover:text-[#4CAF50] transition no-underline"
                        >
                          🪴 Управление товарами
                        </Link>
                        <Link
                          href="/admin/orders"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-[#E8F5E9] hover:text-[#4CAF50] transition no-underline"
                        >
                          📦 Заказы
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-[#E8F5E9] hover:text-[#4CAF50] transition no-underline"
                        >
                          👤 Профиль
                        </Link>
                        <Link
                          href="/profile?tab=orders"
                          onClick={() => setDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-[#E8F5E9] hover:text-[#4CAF50] transition no-underline"
                        >
                          📋 Мои заказы
                        </Link>
                      </>
                    )}
                    <div className="border-t border-[rgba(76,175,80,0.1)]"></div>
                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        if (customUser) {
                          await fetch('/api/auth', { method: 'DELETE' });
                          window.location.reload();
                        } else {
                          await signOut({ callbackUrl: '/' });
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#2D1B4E] hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Выход
                    </button>
                  </div>
                )}
              </div>
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
