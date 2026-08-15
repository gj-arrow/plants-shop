'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseImages, formatPrice, showPriceFrom, type Product } from '@/lib/product-utils';
import { useFavorites } from '@/contexts/FavoritesContext';
import ProductEditModal from '@/components/ProductEditModal';

export default function ProductDetailClient({ product }: { product: Product }) {
  const images = parseImages(product);
  const [selectedImage, setSelectedImage] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { toggleFavorite, isFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user?.role === 'admin') {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'ArrowLeft') setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setSelectedImage((prev) => (prev + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, images.length]);

  return (
    <section className="min-h-screen bg-white pt-20 pb-16">
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Предыдущее фото"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {images.length > 0 ? (
            <img
              src={images[selectedImage]}
              alt={product.name}
                className={`max-w-full max-h-full object-contain cursor-zoom-out ${product.out_of_stock ? 'opacity-60' : ''}`}
              onClick={() => setFullscreen(false)}
            />
          ) : (
            <div className="text-8xl">🪴</div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) => (prev + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            aria-label="Следующее фото"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {selectedImage + 1} / {images.length}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-sage transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16">
          <div className="lg:col-span-6 reveal visible">
            <div className="bg-[#F5F5F0] rounded-sm overflow-hidden cursor-zoom-in w-fit mx-auto">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className={`w-auto h-auto max-h-[50vh] sm:max-h-[75vh] max-w-full object-contain ${product.out_of_stock ? 'opacity-60' : ''}`}
                  onClick={() => setFullscreen(true)}
                />
              ) : (
                <div className="w-full min-w-[280px] aspect-[4/3] flex items-center justify-center text-6xl">🪴</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-sm overflow-hidden border transition-colors ${
                      selectedImage === i ? 'border-sage' : 'border-[#E5E5E0] hover:border-sage'
                    }`}
                  >
                    <img src={img} alt="" className={`w-full h-full object-contain ${product.out_of_stock ? 'opacity-60' : ''}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 reveal visible reveal-delay-1">
            {product.category && (
              <span className="text-sage text-xs tracking-[0.15em] uppercase">
                {product.category}
                {product.subcategory && <span className="text-[#9CA3AF]"> / {product.subcategory}</span>}
              </span>
            )}

            <h1 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="text-3xl text-sage font-medium mt-4">
              {product.out_of_stock ? (
                <span className="text-red-400 text-2xl font-medium">Нет в наличии</span>
              ) : (
                <>{showPriceFrom(product) ? 'от ' : ''}{formatPrice(product.price)} BYN</>
              )}
            </div>

            {product.description && (
              <div className="mt-6">
                <p className="text-[#6B7280] leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}



            <button
              onClick={() => toggleFavorite(product.id)}
              className="w-full mt-8 px-8 py-4 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors btn-press inline-flex items-center justify-center gap-2"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={fav ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {fav ? 'В избранном' : 'Добавить в избранное'}
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-3 px-8 py-4 border-2 border-sage text-sage rounded-full text-sm tracking-wide hover:bg-sage hover:text-white transition-colors btn-press inline-flex items-center justify-center gap-2"
              >
                ✏️ Редактировать
              </button>
            )}

            <p className="mt-4 text-sm text-[#6B7280] leading-relaxed text-center">
              Получить консультацию и уточнить наличие товара можно по телефону{' '}
              <a href="tel:+375298425952" className="text-sage hover:underline whitespace-nowrap">+375 (29) 842-59-52</a>
            </p>


          </div>
        </div>
      </div>

      {showEditModal && (
        <ProductEditModal
          product={product}
          categories={categories}
          onClose={() => setShowEditModal(false)}
          onSaved={() => window.location.reload()}
        />
      )}
    </section>
  );
}
