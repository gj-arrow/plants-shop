'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  };

  const navItems = [
    { href: '/admin/products', label: 'Товары' },
    { href: '/admin/categories', label: 'Категории' },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#E8F5E9]">
      <div className="bg-white border-b border-[rgba(76,175,80,0.1)] backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-['Playfair_Display'] font-bold text-[#4CAF50]">
                Admin Panel
              </Link>
              <nav className="flex gap-4">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition ${
                      pathname === item.href
                        ? 'text-[#4CAF50]'
                        : 'text-[#4A3267] hover:text-[#4CAF50]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-[#66BB6A] hover:text-[#d4709a] font-medium"
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
