'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, parseImages, formatPrice, showPriceFrom } from '@/lib/product-utils';
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
    <div className="pt-28 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="brass-rule mb-6" />
        <h1 className="font-display text-3xl sm:text-4xl text-forest mb-10">
          Избранное
        </h1>

        {favoritesLoading || loadingProducts ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brass mb-3"></div>
            <p className="text-muted">Загрузка...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-7xl block mb-4">💔</span>
            <h2 className="font-display text-2xl text-forest mb-2">
              В избранном пока пусто
            </h2>
            <p className="text-muted mb-6">
              Добавляйте товары в избранное, чтобы не потерять их
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 btn-primary text-ivory rounded-full text-sm tracking-wide btn-press"
            >
              ← В каталог
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...products].sort((a, b) => {
              if (a.out_of_stock && !b.out_of_stock) return 1;
              if (!a.out_of_stock && b.out_of_stock) return -1;
              return 0;
            }).map((product, i) => {
              const images = parseImages(product);
              
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group card-enter h-full"
                >
                  <div className="bg-paper border border-line/70 rounded-md shadow-[0_1px_2px_rgba(23,48,31,0.04),0_10px_28px_-14px_rgba(23,48,31,0.12)] flex flex-col h-full card-hover">
                    {/* Image */}
                    <div className="aspect-[4/5] bg-[#EFEBE0] overflow-hidden rounded-t-md img-zoom relative">
                      {images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={product.name}
                          className={`w-full h-full object-cover ${product.out_of_stock ? 'opacity-60' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🪴</div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors" />
                      
                      {/* Favorite button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(product.id);
                        }}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-paper/90 border border-line/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300 shadow-sm hover:scale-110"
                      >
                        <svg className="w-4 h-4 text-red-500 fill-red-500" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Info */}
                    <div className="pt-4 pb-3 px-4 flex-1 flex flex-col">
                      {product.category && (
                        <span className="text-brass text-[11px] tracking-[0.18em] uppercase font-medium">{product.category}</span>
                      )}
                      <h3 className="text-ink font-display text-base mt-1.5 leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-auto pt-2.5">
                        {product.out_of_stock ? (
                          <span className="text-[#B4544A] text-sm font-medium">Нет в наличии</span>
                        ) : (
                          <span className="text-forest font-medium">
                            {showPriceFrom(product) && <span className="text-brass italic">от </span>}
                            {formatPrice(product.price)} <span className="text-muted text-xs tracking-wide">BYN</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
