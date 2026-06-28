'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart, Product, parseImages } from '@/contexts/CartContext';
import { useFavorites } from '@/hooks/useFavorites';

interface ProductDetail extends Product {}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { addToCart, removeFromCart, updateQuantity, items } = useCart();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
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
            className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-6 py-3 rounded-xl font-medium btn-press ripple"
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
          className="flex items-center gap-2 text-gray-600 hover:text-[#4CAF50] mb-6 fade-in btn-press"
        >
          <span>←</span>
          <span>Назад</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Галерея изображений */}
            <div className="p-6 bg-gray-50">
              {(() => {
                const images = parseImages(product);
                const hasImages = images.length > 0;
                const currentImage = hasImages ? images[selectedImageIndex] : null;

                return (
                  <>
                    {/* Основное изображение */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#E8F5E9]">
                      {hasImages ? (
                        <img
                          src={currentImage!}
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
                              ? 'bg-[#4CAF50] text-white'
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {product.stock > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
                        </span>
                      </div>

                      {/* Бэдж корзины */}
                      {isInCart && (
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg pulse-soft">
                          В корзине: {quantityInCart} шт.
                        </div>
                      )}
                    </div>

                    {/* Миниатюры */}
                    {images.length > 1 && (
                      <div className="flex gap-2">
                        {images.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                              selectedImageIndex === index
                                ? 'border-[#4CAF50] ring-2 ring-[rgba(76,175,80,0.2)]'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={url}
                              alt={`${product.name} — ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Информация о товаре */}
            <div className="p-8 flex flex-col">
              {/* Категория */}
              <div className="mb-3">
                <span className="inline-block bg-[#E8F5E9] text-[#4CAF50] px-4 py-1.5 rounded-full text-sm font-medium">
                  {product.category || 'Без категории'}
                </span>
              </div>

              {/* Название */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Цена */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#4CAF50]">{product.price} р.</span>
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
                          <span className="text-2xl font-bold text-[#4CAF50]">{quantityInCart} шт.</span>
                        </div>
                        <button
                          onClick={() => handleUpdateQuantity(quantityInCart + 1)}
                          className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white font-bold text-xl btn-press hover:shadow-[0_4px_12px_rgba(76,175,80,0.4)] transition flex items-center justify-center"
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
                          className="flex-1 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-3 rounded-xl font-medium btn-press ripple shadow-md hover:shadow-lg transition"
                        >
                          В корзину
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddToCart}
                        className={`flex-1 px-6 py-4 rounded-xl font-medium btn-press ripple shadow-lg transition flex items-center justify-center gap-2 ${
                          lastAdded
                            ? 'bg-green-500 text-white pulse-soft'
                            : 'bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white hover:shadow-xl'
                        }`}
                      >
                        <span>🛒</span>
                        <span>{lastAdded ? 'Добавлено!' : 'Добавить в корзину'}</span>
                      </button>
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`w-14 h-14 rounded-xl border-2 btn-press transition flex items-center justify-center shrink-0 shadow-lg ${
                          isFavorite(product.id)
                            ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                            : 'border-[rgba(76,175,80,0.2)] text-[#8a7a9a] hover:border-red-200 hover:text-red-400 hover:bg-red-50'
                        }`}
                        aria-label={isFavorite(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="flex gap-3">
                    <button
                      disabled
                      className="flex-1 bg-gray-200 text-gray-500 px-6 py-4 rounded-xl font-medium cursor-not-allowed"
                    >
                      Нет в наличии
                    </button>
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`w-14 h-14 rounded-xl border-2 btn-press transition flex items-center justify-center shrink-0 shadow-lg ${
                        isFavorite(product.id)
                          ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                          : 'border-gray-200 text-[#8a7a9a] hover:border-red-200 hover:text-red-400 hover:bg-red-50'
                      }`}
                      aria-label={isFavorite(product.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">🌱</div>
            <h3 className="font-semibold text-gray-800 mb-2">Гарантия качества</h3>
            <p className="text-gray-600 text-sm">Только здоровые растения</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold text-gray-800 mb-2">Поддержка</h3>
            <p className="text-gray-600 text-sm">Помогу с выбором и уходом</p>
          </div>
        </div>
      </div>
    </div>
  );
}
