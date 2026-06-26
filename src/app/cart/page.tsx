'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center fade-in">
            <span className="text-7xl mb-4 block animate-bounce">🛒</span>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Корзина пуста</h2>
            <p className="text-gray-600 mb-8 text-lg">Добавьте товары из каталога</p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium btn-press ripple shadow-lg hover:shadow-xl transition"
            >
              Перейти в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-animated min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 fade-in">🛒 Корзина</h1>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden fade-in">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Link
                href={`/products/${item.id}`}
                className="w-20 h-20 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-3xl">🪴</span>
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.id}`} className="block hover:text-green-600 transition">
                  <h3 className="font-semibold text-gray-800 truncate">{item.name}</h3>
                </Link>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="text-lg font-bold text-green-600 mt-1">{item.price} ₽</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center btn-press hover:border-green-400 hover:bg-green-50 transition text-gray-600 font-bold text-lg"
                >
                  −
                </button>
                <span className="w-10 text-center font-semibold text-lg">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center btn-press hover:border-green-400 hover:bg-green-50 transition text-gray-600 font-bold text-lg"
                >
                  +
                </button>
              </div>

              <div className="text-right min-w-[100px]">
                <p className="font-bold text-gray-900 text-lg">{item.price * item.quantity} ₽</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-sm text-red-500 hover:text-red-700 btn-press mt-1 font-medium"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}

          <div className="p-6 bg-gradient-to-r from-gray-50 to-green-50">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl text-gray-600 font-medium">Итого:</span>
              <span className="text-3xl font-bold text-gray-900">{total} ₽</span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={clearCart}
                className="px-6 py-3.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 btn-press hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Очистить корзину
              </button>
              <button
                onClick={() => router.push('/checkout')}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3.5 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-600 transition"
              >
                Оформить заказ →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
