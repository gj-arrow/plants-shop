'use client';

import { useState } from 'react';
import Link from 'next/link';
import { parseImages, type Product } from '@/lib/product-utils';
import { useFavorites } from '@/contexts/FavoritesContext';

export default function ProductDetailClient({ product }: { product: Product }) {
  const images = parseImages(product);
  const [selectedImage, setSelectedImage] = useState(0);
  const { toggleFavorite, isFavorite } = useFavorites();
  const fav = isFavorite(product.id);

  return (
    <section className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-sage transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Назад в каталог
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-6 reveal visible">
            <div className="aspect-[4/3] bg-[#F5F5F0] rounded-sm overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">🪴</div>
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
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 reveal visible reveal-delay-1">
            {product.category && (
              <span className="text-sage text-xs tracking-[0.15em] uppercase">
                {product.category}
              </span>
            )}

            <h1 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-2 leading-tight">
              {product.name}
            </h1>

            <div className="text-3xl text-sage font-medium mt-4">
              {product.price} BYN
            </div>

            {product.description && (
              <div className="mt-6">
                <p className="text-[#6B7280] leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-sage' : 'bg-[#D4D4D0]'}`} />
              <span className="text-sm text-[#6B7280]">
                {product.stock > 0 ? 'В наличии' : 'Нет в наличии'}
              </span>
            </div>

            <button
              onClick={() => toggleFavorite(product.id)}
              disabled={product.stock === 0}
              className="w-full mt-8 px-8 py-4 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed btn-press inline-flex items-center justify-center gap-2"
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

            <div className="mt-10 pt-8 border-t border-[#E5E5E0]">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-xl mb-1">🌱</div>
                  <div className="text-xs text-[#6B7280] uppercase tracking-wide">Уход</div>
                  <div className="text-sm text-[#1A1A1A] mt-0.5">Умеренный</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">💧</div>
                  <div className="text-xs text-[#6B7280] uppercase tracking-wide">Полив</div>
                  <div className="text-sm text-[#1A1A1A] mt-0.5">1 раз в неделю</div>
                </div>
                <div className="text-center">
                  <div className="text-xl mb-1">☀️</div>
                  <div className="text-xs text-[#6B7280] uppercase tracking-wide">Свет</div>
                  <div className="text-sm text-[#1A1A1A] mt-0.5">Рассеянный</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
