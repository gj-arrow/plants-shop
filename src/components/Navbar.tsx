'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';

export default function Navbar() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gradient-to-r from-green-800 via-emerald-700 to-teal-700 text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-2xl font-bold flex items-center gap-2 btn-press hover:text-green-100 transition"
          >
            <span className="btn-press">🌿</span>
            <span>Plant Shop</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="btn-press hover:text-green-100 transition font-medium hidden sm:block"
            >
              Каталог
            </Link>
            <Link
              href="/cart"
              className="relative btn-press hover:text-green-100 transition"
            >
              <span className="text-xl">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-2.5 -right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-md pulse-soft">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse"></div>
            ) : session?.user ? (
              <Link
                href={(session.user as any).role === 'admin' ? '/admin/products' : '/profile'}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full btn-press hover:bg-white/20 transition backdrop-blur-sm"
              >
                {(session.user as any).avatar_url ? (
                  <img src={(session.user as any).avatar_url} alt={(session.user as any).name || 'User'} className="w-6 h-6 rounded-full" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold">
                    {((session.user as any).name || session.user?.email || '').charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm font-medium hidden sm:inline">{((session.user as any).name || session.user?.email || '').split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm bg-white/10 px-4 py-1.5 rounded-full font-medium btn-press hover:bg-white/20 transition backdrop-blur-sm"
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
