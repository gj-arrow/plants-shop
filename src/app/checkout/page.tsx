'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setFormData({
            customer_name: data.user.name || '',
            phone: data.user.phone || '',
            email: data.user.email || '',
            address: '',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: user?.id || null,
          items: items.map(item => ({ product_id: item.id, quantity: item.quantity })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при создании заказа');
      }

      setSuccess(true);
      clearCart();
      setTimeout(() => {
        router.push(`/order-success?id=${data.id}`);
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center fade-in">
            <span className="text-7xl mb-4 block">🛒</span>
            <h2 className="text-3xl font-bold text-[#2D1B4E] mb-2 font-['Playfair_Display']">Корзина пуста</h2>
            <p className="text-[#4A3267] mb-8 text-lg">Добавьте товары для оформления заказа</p>
            <button
              onClick={() => router.push('/')}
              className="inline-block bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-8 py-3.5 rounded-xl font-medium btn-press ripple shadow-lg hover:shadow-xl hover:shadow-[rgba(76,175,80,0.3)] transition"
            >
              Перейти в каталог
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <h1 className="text-3xl font-bold text-[#2D1B4E] mb-6 fade-in font-['Playfair_Display']">📦 Оформление заказа</h1>

        {success && (
          <div className="mb-6 p-4 bg-[#E8F5E9] text-[#2E7D32] rounded-xl fade-in text-center font-medium">
            ✓ Заказ успешно оформлен! Перенаправляем...
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Форма заказа */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 fade-in border border-[rgba(76,175,80,0.1)]">
              <h2 className="text-xl font-semibold mb-4 text-[#2D1B4E] font-['Playfair_Display']">Контактные данные</h2>

              {error && (
                <div className="mb-4 p-3 bg-[#FFEBEE] text-[#C62828] rounded-xl text-sm fade-in border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A3267] mb-1">ФИО</label>
                  <input
                    type="text"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A3267] mb-1">Телефон</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A3267] mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                    placeholder="example@mail.ru"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A3267] mb-1">Адрес доставки</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2.5 border-2 border-[rgba(76,175,80,0.15)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition resize-none"
                    placeholder="Город, улица, дом, квартира"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full mt-6 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white py-3.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg hover:shadow-[rgba(76,175,80,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Оформление...' : success ? 'Заказ оформлен!' : `Заказать на ${total} р.`}
              </button>
            </form>
          </div>

          {/* Сводка заказа */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 fade-in border border-[rgba(76,175,80,0.1)]" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-xl font-semibold mb-4 text-[#2D1B4E] font-['Playfair_Display']">Ваш заказ</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <span className="text-[#4A3267]">
                      {item.name} × <span className="font-medium">{item.quantity}</span>
                    </span>
                    <span className="font-semibold text-[#2D1B4E]">{item.price * item.quantity} р.</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[rgba(76,175,80,0.08)] mt-4 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-[#4A3267]">Итого:</span>
                  <span className="text-[#4CAF50]">{total} р.</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#E8F5E9] rounded-xl text-sm text-[#4CAF50]">
                <span className="font-medium">✓</span> Менеджер свяжется с вами для подтверждения
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
