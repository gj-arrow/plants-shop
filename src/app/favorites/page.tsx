'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, parseImages } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';

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
    <div className="bg-white pt-28 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <h1 className="font-display text-3xl sm:text-4xl text-[#1A3326] mb-10">
          Избранное
        </h1>

        {favoritesLoading || loadingProducts ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-3"></div>
            <p className="text-[#6B7280]">Загрузка...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">💔</span>
            <h2 className="font-display text-2xl text-[#1A3326] mb-2">
              В избранном пока пусто
            </h2>
            <p className="text-[#6B7280] mb-6">
              Добавляйте товары в избранное, чтобы не потерять их
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors"
            >
              ← В каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => {
              const isWide = (i + 1) % 3 === 0;
              const images = parseImages(product);
              
              return (
                <div
                  key={product.id}
                  className={`group ${isWide ? 'lg:col-span-2' : ''}`}
                >
                  <div className="bg-white rounded-sm shadow-[0_2px_20px_rgba(28,55,40,0.06)]">
                    {/* Image */}
                    <div className={`${isWide ? 'aspect-[3/2]' : 'aspect-[4/5]'} bg-[#F5F5F0] overflow-hidden rounded-sm img-zoom relative`}>
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🪴</div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />
                      
                      {/* Favorite button */}
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      >
                        <svg className="w-4 h-4 text-red-500 fill-red-500" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="pt-4 pb-2 px-4">
                      {product.category && (
                        <span className="text-sage text-xs tracking-wide uppercase">{product.category}</span>
                      )}
                      <h3 className="text-[#1A1A1A] font-display text-base font-medium mt-1 leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sage font-medium">{product.price} ₽</span>
                        {product.stock > 0 ? (
                          <span className="text-[11px] text-[#8CA89C]">в наличии</span>
                        ) : (
                          <span className="text-[11px] text-[#B0B0A8]">нет в наличии</span>
                        )}
                      </div>

                      <Link
                        href={`/products/${product.id}`}
                        className="mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
