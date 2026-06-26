'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart, Product } from '@/contexts/CartContext';

interface ProductDetail extends Product {
  images?: string[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart, removeFromCart, updateQuantity, items } = useCart();
  const [lastAdded, setLastAdded] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/products/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Product not found');
          return res.json();
        })
        .then(data => {
          setProduct(data);
          // Generate gallery images (main + placeholders for demo)
          if (data.image_url) {
            data.images = [data.image_url, data.image_url, data.image_url];
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch product:', err);
          setLoading(false);
        });
    }
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
      setLastAdded(true);
      setTimeout(() => setLastAdded(false), 600);
    }
  };

  const handleUpdateQuantity = (newQuantity: number) => {
    if (!product) return;
    if (newQuantity <= 0) {
      removeFromCart(product.id);
    } else if (newQuantity <= product.stock) {
      updateQuantity(product.id, newQuantity);
    }
  };

  const handleRemoveFromCart = () => {
    if (product) {
      removeFromCart(product.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🥀</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Товар не найден</h1>
          <p className="text-gray-600 mb-4">К сожалению, этот товар не существует</p>
          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium btn-press ripple"
          >
            ← Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  const cartItem = items.find(item => item.id === product.id);
  const quantityInCart = cartItem?.quantity || 0;
  const isInCart = quantityInCart > 0;

  return (
    <div className="min-h-screen bg-gradient-animated">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Кнопка назад */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6 fade-in btn-press"
        >
          <span>←</span>
          <span>Назад</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Галерея изображений */}
            <div className="p-6 bg-gray-50">
              {/* Основное изображение */}
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">🪴</span>
                  </div>
                )}
                
                {/* Бэдж наличия */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                      product.stock > 0
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {product.stock > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
                  </span>
                </div>

                {/* Бэдж корзины */}
                {isInCart && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg pulse-soft">
                    В корзине: {quantityInCart} шт.
                  </div>
                )}
              </div>

              {/* Миниатюры */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-green-500 ring-2 ring-green-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Информация о товаре */}
            <div className="p-8 flex flex-col">
              {/* Категория */}
              <div className="mb-3">
                <span className="inline-block bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  {product.category || 'Без категории'}
                </span>
              </div>

              {/* Название */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Цена */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-green-600">{product.price} ₽</span>
              </div>

              {/* Описание */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Описание</h2>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || 'Описание отсутствует'}
                </p>
              </div>

              {/* Детали */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-xl">📦</span>
                  <span>В наличии: <strong className="text-gray-900">{product.stock} шт.</strong></span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <span className="text-xl">🌿</span>
                  <span>Категория: <strong className="text-gray-900">{product.category}</strong></span>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="mt-auto">
                {product.stock > 0 ? (
                  isInCart ? (
                    <div className="space-y-3">
                      {/* Контролы количества */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(quantityInCart - 1)}
                          className="w-12 h-12 rounded-xl bg-red-50 text-red-600 font-bold text-xl btn-press hover:bg-red-100 transition flex items-center justify-center"
                          aria-label="Уменьшить количество"
                        >
                          −
                        </button>
                        <div className="flex-1 text-center">
                          <span className="text-sm text-gray-500 block">В корзине</span>
                          <span className="text-2xl font-bold text-green-600">{quantityInCart} шт.</span>
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(quantityInCart + 1)}
                          className="w-12 h-12 rounded-xl bg-green-600 text-white font-bold text-xl btn-press hover:bg-green-700 transition flex items-center justify-center"
                          aria-label="Увеличить количество"
                          disabled={quantityInCart >= product.stock}
                        >
                          +
                        </button>
                      </div>
                      {/* Кнопки действий */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleRemoveFromCart}
                          className="flex-1 bg-red-100 text-red-600 px-4 py-3 rounded-xl font-medium btn-press ripple hover:bg-red-200 transition flex items-center justify-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>Удалить</span>
                        </button>
                        <button
                          onClick={() => router.push('/cart')}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-3 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
                        >
                          В корзину
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className={`w-full px-6 py-4 rounded-xl font-medium btn-press ripple shadow-lg transition flex items-center justify-center gap-2 ${
                        lastAdded
                          ? 'bg-green-500 text-white pulse-soft'
                          : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:shadow-xl'
                      }`}
                    >
                      <span>🛒</span>
                      <span>{lastAdded ? 'Добавлено!' : 'Добавить в корзину'}</span>
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-500 px-6 py-4 rounded-xl font-medium cursor-not-allowed"
                  >
                    Нет в наличии
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">🚚</div>
            <h3 className="font-semibold text-gray-800 mb-2">Быстрая доставка</h3>
            <p className="text-gray-600 text-sm">Доставим в удобное для вас время</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="font-semibold text-gray-800 mb-2">Гарантия качества</h3>
            <p className="text-gray-600 text-sm">Только здоровые растения</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-800 mb-2">Поддержка 24/7</h3>
            <p className="text-gray-600 text-sm">Поможем с выбором и уходом</p>
          </div>
        </div>
      </div>
    </div>
  );
}
