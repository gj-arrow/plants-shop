'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => { await fetch('/api/auth', { method: 'DELETE' }); router.push('/login'); };
  const navItems = [{ href: '/admin/products', label: 'Товары' }, { href: '/admin/categories', label: 'Категории' }];
  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#FDFBF7]">
      <div className="bg-white border-b border-[#E8D5B7]/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[64px]">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-[#122620] flex items-center justify-center text-[#C9A86A] text-xs">✦</span><span className="font-display font-semibold text-[#122620] tracking-[-0.02em]">Admin</span><span className="hidden sm:inline text-[10px] tracking-[0.15em] uppercase bg-[#F5F1E8] border border-[#E8D5B7]/40 px-2 py-1 rounded-full text-[#8A8178]">Панель</span></Link>
              <nav className="flex gap-2">{navItems.map(item=>(
                <Link key={item.href} href={item.href} className={`px-5 py-2 text-[13px] font-medium rounded-full transition border ${pathname===item.href?'bg-[#122620] text-white border-[#122620] shadow-sm':'bg-white text-[#122620] border-[#E8D5B7]/40 hover:border-[#C9A86A]'}`}>{item.label}</Link>
              ))}</nav>
            </div>
            <button onClick={handleLogout} className="text-xs tracking-wide font-medium px-4 py-2 rounded-full bg-[#FDFBF7] border border-[#E8D5B7]/40 text-[#8A8178] hover:text-[#122620] hover:border-[#C9A86A] transition">Выйти</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
    </div>
  );
}
