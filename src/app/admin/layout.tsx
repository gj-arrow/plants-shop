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
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F5F0]">
      <div className="bg-white border-b border-[#E5E5E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-['Playfair_Display'] font-bold text-[#8CA89C]">
                Admin Panel
              </Link>
              <nav className="flex gap-4">
                {navItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition ${
                      pathname === item.href
                        ? 'text-[#8CA89C]'
                        : 'text-[#1A3326] hover:text-[#8CA89C]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-[#8CA89C] hover:text-[#5B7F6B] font-medium"
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
