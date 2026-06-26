'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка входа');
      }

      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gradient-animated">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-[0_15px_50px_rgba(76,175,80,0.15)] p-8 border border-[rgba(76,175,80,0.1)]">
          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">🔐</span>
            <h1 className="text-3xl font-['Playfair_Display'] font-bold text-[#2D1B4E]">Админ-панель</h1>
            <p className="text-[#4A3267] text-sm mt-1">Войдите для управления магазином</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#FFEBEE] text-[#C62828] rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A3267] mb-1">
                Логин
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4A3267] mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-[#4CAF50] focus:border-[#4CAF50]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white py-2 rounded-xl font-medium hover:shadow-lg hover:shadow-[rgba(76,175,80,0.3)] transition disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-[#E8F5E9] border border-[rgba(76,175,80,0.15)] rounded-xl text-xs text-[#4A3267]">
            <p className="font-medium mb-1">Тестовые учётные данные:</p>
            <p>Логин: <code className="bg-[rgba(76,175,80,0.1)] text-[#4CAF50] px-1 rounded">admin</code></p>
            <p>Пароль: <code className="bg-[rgba(76,175,80,0.1)] text-[#4CAF50] px-1 rounded">admin123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
