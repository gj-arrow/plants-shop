'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'POST' });
    router.push('/admin/login');
  };

  const navItems = [
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/orders', label: 'Заказы' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-bold text-green-700">
                🌿 Admin Panel
              </Link>
              <nav className="flex gap-4">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition ${
                      pathname === item.href
                        ? 'text-green-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
