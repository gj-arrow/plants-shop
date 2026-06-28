'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, parseImages } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';
import FallingLeaves from '@/components/FallingLeaves';

export default function FavoritesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { favorites, toggleFavorite, loading: favoritesLoading } = useFavorites();

  useEffect(() => {
    if (favoritesLoading) return;
    if (favorites.length === 0) {
      setLoadingProducts(false);
      setProducts([]);
      return;
    }
    fetch('/api/products')
      .then(res => res.json())
      .then((allProducts: Product[]) => {
        setProducts(allProducts.filter((p: Product) => favorites.includes(p.id)));
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, [favorites, favoritesLoading]);

  return (
    <>
      <FallingLeaves />
      <div className="bg-gradient-animated min-h-screen" style={{ paddingTop: '5rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-[#2D1B4E] font-['Playfair_Display'] mb-8">
            ❤️ Избранное
          </h1>

          {favoritesLoading || loadingProducts ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] mb-3"></div>
              <p className="text-[#4A3267]">Загрузка...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 fade-in">
              <span className="text-7xl block mb-4">💔</span>
              <h2 className="text-2xl font-bold text-[#2D1B4E] font-['Playfair_Display'] mb-2">
                В избранном пока пусто
              </h2>
              <p className="text-[#8a7a9a] mb-6">
                Добавляйте товары в избранное, чтобы не потерять их
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-6 py-3 rounded-xl font-medium btn-press ripple hover:shadow-lg transition"
              >
                ← В каталог
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => {
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-[20px] shadow-md overflow-hidden card-hover flex flex-col h-full border border-[rgba(76,175,80,0.1)] fade-in"
                  >
                    <div className="h-48 bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#E8F5E9] flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(76,175,80,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {(() => {
                        const imgs = parseImages(product);
                        return imgs.length > 0 ? (
                          <img
                            src={imgs[0]}
                            alt={product.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-6xl group-hover:scale-110 transition-transform duration-300">🪴</span>
                        );
                      })()}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="text-xs text-[#4CAF50] font-medium mb-1 bg-[#E8F5E9] inline-block px-2 py-1 rounded-full self-start">
                        {product.category}
                      </div>
                      <h3 className="font-['Playfair_Display'] font-bold text-lg text-[#2D1B4E] mb-1 mt-2">{product.name}</h3>
                      <p className="text-[#8a7a9a] text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold text-[#2D1B4E]">{product.price} р.</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            product.stock > 0
                              ? 'bg-[#E8F5E9] text-[#2E7D32]'
                              : 'bg-[#FFEBEE] text-[#C62828]'
                          }`}
                        >
                          {product.stock > 0 ? `✓ ${product.stock} шт.` : '✗ Нет в наличии'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={`/products/${product.id}`}
                          className="flex-1 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white px-4 py-3 rounded-xl font-medium btn-press ripple hover:shadow-[0_8px_25px_rgba(76,175,80,0.4)] transition flex items-center justify-center gap-2"
                        >
                          Подробнее
                        </a>
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className="w-12 h-12 rounded-xl border-2 btn-press transition flex items-center justify-center shrink-0 border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                          aria-label="Убрать из избранного"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
