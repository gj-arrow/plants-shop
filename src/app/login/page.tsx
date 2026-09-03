'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try{
      const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',email:formData.email,password:formData.password})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error||'Ошибка входа'); router.push('/admin/products');
    }catch(err:any){ setError(err.message); setLoading(false);}
  };
  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#122620] relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0"><div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#C9A86A]/10 rounded-full blur-3xl" /><div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-[#C9A86A]/5 rounded-full blur-3xl" /></div>
      <div className="w-full max-w-md relative">
        <div className="text-center mb-6"><div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center mx-auto text-[#C9A86A]">✦</div><h1 className="font-display text-2xl text-white mt-3 tracking-[-0.02em]">Зелёная мастерская</h1><p className="text-white/60 text-xs tracking-[0.2em] uppercase mt-1">Boutique Nursery • Admin</p></div>
        <div className="bg-[#FDFBF7] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-[#E8D5B7]/30 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C9A86A] via-[#E8D5B7] to-[#C9A86A]" />
          <div className="text-center mb-6"><h2 className="font-display text-xl text-[#122620]">Вход для администратора</h2><p className="text-[#8A8178] text-xs mt-1">Доступ к панели управления каталогом</p></div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-xs font-semibold tracking-wide uppercase text-[#122620] mb-1.5">Логин</label><input type="text" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 border border-[#E8D5B7]/50 rounded-xl bg-white focus:outline-none focus:border-[#C9A86A] focus:ring-2 focus:ring-[#C9A86A]/20 transition text-sm" placeholder="admin" required /></div>
            <div><label className="block text-xs font-semibold tracking-wide uppercase text-[#122620] mb-1.5">Пароль</label><input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 border border-[#E8D5B7]/50 rounded-xl bg-white focus:outline-none focus:border-[#C9A86A] focus:ring-2 focus:ring-[#C9A86A]/20 transition text-sm" placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-[#122620] hover:bg-black text-white py-3.5 rounded-full font-medium shadow-[0_8px_20px_rgba(18,38,32,0.2)] disabled:opacity-50 transition flex items-center justify-center gap-2">{loading ? <><span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"/> Вход...</> : <>Войти <span>→</span></>}</button>
          </form>
          <p className="text-center text-xs text-[#8A8178] mt-4">Защищено • Только для персонала</p>
        </div>
      </div>
    </div>
  );
}
