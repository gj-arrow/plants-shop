'use client';

import { useCart, parseImages } from '@/contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState<number | null>(null);
  const [quickError, setQuickError] = useState('');

  const resetQuickOrder = () => {
    setShowQuickOrder(false);
    setQuickSuccess(null);
    setQuickName('');
    setQuickPhone('');
    setQuickError('');
  };

  const handleQuickOrder = async () => {
    if (!quickName.trim() || !quickPhone.trim()) {
      setQuickError('Заполните имя и телефон');
      return;
    }
    setQuickSubmitting(true);
    setQuickError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: quickName.trim(),
          phone: quickPhone.trim(),
          items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      if (!res.ok) throw new Error('Ошибка при создании заказа');
      const order = await res.json();
      setQuickSuccess(order.id);
      clearCart();
    } catch {
      setQuickError('Не удалось оформить заказ. Попробуйте позже.');
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Модалка быстрого заказа (всегда в рендере, вне условных return)
  const quickOrderModal = showQuickOrder && (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => { if (!quickSubmitting) resetQuickOrder(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 slide-in"
        onClick={e => e.stopPropagation()}
      >
        {quickSuccess ? (
          <div className="text-center py-4">
            <span className="text-5xl block mb-3">✅</span>
            <h3 className="text-xl font-bold text-[#2D1B4E] mb-2">Заказ оформлен!</h3>
            <p className="text-[#4CAF50] font-semibold text-lg mb-1">№{quickSuccess}</p>
            <p className="text-[#8a7a9a] text-sm mb-6">Спасибо за заказ! В ближайшее время свяжусь с Вами.</p>
            <button
              onClick={resetQuickOrder}
              className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-8 py-3 rounded-xl font-medium btn-press ripple shadow-[0_4px_15px_rgba(76,175,80,0.3)] transition"
            >
              Отлично
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold font-['Playfair_Display'] text-[#2D1B4E] mb-2">Быстрый заказ</h3>
            <p className="text-[#8a7a9a] text-sm mb-5">Оставьте имя и телефон — свяжусь с Вами для подтверждения</p>

            {quickError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm mb-4">
                {quickError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#4A3267] mb-1">Имя</label>
                <input
                  type="text"
                  value={quickName}
                  onChange={e => setQuickName(e.target.value)}
                  placeholder="Ваше имя"
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-[rgba(76,175,80,0.2)] rounded-xl focus:outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[rgba(76,175,80,0.15)] transition text-[#2D1B4E] placeholder:text-[#8a7a9a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#4A3267] mb-1">Телефон</label>
                <input
                  type="tel"
                  value={quickPhone}
                  onChange={e => setQuickPhone(e.target.value)}
                  placeholder="+375 (29) 123-45-67"
                  className="w-full px-4 py-3 border-2 border-[rgba(76,175,80,0.2)] rounded-xl focus:outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[rgba(76,175,80,0.15)] transition text-[#2D1B4E] placeholder:text-[#8a7a9a]"
                />
              </div>
              <button
                onClick={handleQuickOrder}
                disabled={quickSubmitting}
                className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white py-3.5 rounded-xl font-medium btn-press ripple shadow-[0_4px_15px_rgba(76,175,80,0.3)] hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)] transition disabled:opacity-60"
              >
                {quickSubmitting ? 'Оформляем...' : 'Подтвердить заказ'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (items.length === 0 && !showQuickOrder) {
    return (
      <>
        <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <div className="text-center fade-in">
              <span className="text-7xl mb-4 block animate-bounce">🛒</span>
              <h2 className="text-3xl font-bold font-['Playfair_Display'] text-[#2D1B4E] mb-2">Корзина пуста</h2>
              <p className="text-[#8a7a9a] mb-8 text-lg">Добавьте товары из каталога</p>
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-8 py-3.5 rounded-[50px] font-medium btn-press ripple shadow-[0_4px_20px_rgba(76,175,80,0.3)] hover:shadow-[0_6px_25px_rgba(76,175,80,0.5)] transition"
              >
                Перейти в каталог
              </Link>
            </div>
          </div>
        </div>
        {quickOrderModal}
      </>
    );
  }

  return (
    <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <h1 className="text-3xl font-bold font-['Playfair_Display'] text-[#2D1B4E] mb-6 fade-in">🛒 Корзина</h1>

        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(76,175,80,0.15)] border border-[rgba(76,175,80,0.1)] overflow-hidden fade-in">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border-b border-[rgba(76,175,80,0.1)] last:border-b-0 hover:bg-[#FDF6F0] transition"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Link
                href={`/products/${item.id}`}
                className="w-20 h-20 bg-gradient-to-br from-[#E8F5E9] via-[#FDF6F0] to-[#F1F8E9] rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(76,175,80,0.1)] hover:shadow-[0_4px_12px_rgba(76,175,80,0.2)] transition overflow-hidden"
              >
                  {(() => {
                    const imgs = parseImages(item);
                    return imgs.length > 0 ? (
                      <img
                        src={imgs[0]}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-3xl">🪴</span>
                    );
                  })()}
                </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.id}`} className="block hover:text-[#4CAF50] transition">
                  <h3 className="font-semibold text-[#2D1B4E] truncate">{item.name}</h3>
                </Link>
                <span className="inline-block text-xs font-medium bg-[#E8F5E9] text-[#4CAF50] rounded-full px-3 py-0.5 mt-1">{item.category}</span>
                <p className="text-lg font-bold text-[#4CAF50] mt-1.5">{item.price} р.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-9 h-9 rounded-full border-2 border-[rgba(76,175,80,0.2)] flex items-center justify-center btn-press hover:border-[#4CAF50] hover:bg-[#E8F5E9] transition text-[#4A3267] font-bold text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-lg text-[#2D1B4E]">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-9 h-9 rounded-full border-2 border-[rgba(76,175,80,0.2)] flex items-center justify-center btn-press hover:border-[#4CAF50] hover:bg-[#E8F5E9] transition text-[#4A3267] font-bold text-lg"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="font-bold text-[#2D1B4E] text-lg">{item.price * item.quantity} р.</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-sm text-[#66BB6A] hover:text-[#388E3C] btn-press mt-1 font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}

          <div className="p-6 bg-gradient-to-r from-[#FDF6F0] to-[#F1F8E9]">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl text-[#4A3267] font-medium">Итого:</span>
              <span className="text-3xl font-bold text-[#2D1B4E]">{total} р.</span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="px-6 py-3.5 border-2 border-[rgba(76,175,80,0.2)] rounded-xl font-medium text-[#4A3267] btn-press hover:border-[#4CAF50] hover:bg-[#E8F5E9] transition"
              >
                Очистить корзину
              </button>
              {status === 'unauthenticated' && (
                <button
                  onClick={() => setShowQuickOrder(true)}
                  className="px-6 py-3.5 rounded-xl font-medium text-[#4CAF50] border-2 border-[#4CAF50] btn-press hover:bg-[#4CAF50] hover:text-white transition"
                >
                  Быстрый заказ
                </button>
              )}
              <button
                onClick={() => router.push('/checkout')}
                className="flex-1 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-6 py-3.5 rounded-xl font-medium btn-press ripple shadow-[0_4px_15px_rgba(76,175,80,0.3)] hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)] hover:from-[#388E3C] hover:to-[#4CAF50] transition"
              >
                Оформить заказ →
              </button>
            </div>
          </div>
        </div>
      </div>

      {quickOrderModal}
    </div>
  );
}
