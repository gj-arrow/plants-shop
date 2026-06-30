'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, parseImages } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="bg-gradient-animated min-h-screen" style={{ paddingTop: '5rem' }} />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setLoading(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter((c): c is string => Boolean(c))))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center bg-white">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">

            {/* Left: Text */}
            <div className="reveal visible">
              <span className="text-sage text-xs tracking-[0.2em] uppercase font-medium">
                ♡ PLANT SHOP
              </span>
              <h1 className="text-[#1A3326] font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mt-6">
                Преврати свой дом в оазис
              </h1>
              <p className="text-[#6B7280] text-lg mt-6 max-w-md leading-relaxed">
                Редкие комнатные растения с доставкой по Москве
              </p>

              {/* CTA */}
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-sage text-white rounded-full text-sm tracking-wide hover:bg-sage-dark transition-colors btn-press"
              >
                Смотреть каталог
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              {/* Social */}
              <div className="flex gap-4 mt-12">
                <a href="#" className="w-10 h-10 rounded-full border border-[#E5E5E0] flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all" aria-label="Telegram">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-[#E5E5E0] flex items-center justify-center text-sage hover:bg-sage hover:text-white transition-all" aria-label="WhatsApp">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
              </div>
            </div>

            {/* Right: Image */}
            <div className="reveal visible reveal-delay-2 h-full flex items-center justify-center">
              <div className="relative w-full max-w-lg">
                <div className="aspect-[4/5] rounded-sm bg-[#F5F5F0] overflow-hidden">
                  <img
                    src="/uploads/products/plant-17.jpg"
                    alt="Monstera"
                    className="w-full h-full object-cover hero-parallax"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#E5E5E0] bg-white">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-xs text-[#6B7280] tracking-wide">
                <span className="text-sage font-medium">Доставка</span> 1-3 дня
              </div>
              <div className="text-xs text-[#6B7280] tracking-wide">
                <span className="text-sage font-medium">Бесплатно</span> от 5000₽
              </div>
              <div className="text-xs text-[#6B7280] tracking-wide">
                <span className="text-sage font-medium">100%</span> свежесть
              </div>
            </div>
          </div>
        </div>
      </section>

        <div className="max-w-7xl mx-auto px-6 pb-8">
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-center" id="catalog">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-sage text-white'
                    : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                }`}
              >
                🌿 Все
              </button>
              {categories.filter(c => c !== 'all').map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-sage text-white'
                      : 'bg-white text-[#6B7280] border border-[#E5E5E0] hover:border-sage'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-3"></div>
                <p className="text-[#6B7280]">Загрузка товаров...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[#6B7280]">Нет товаров в этой категории</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {filteredProducts.map((product, i) => {
                  const images = parseImages(product);
                  
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group card-enter"
                      style={{ animationDelay: `${Math.min(i, 5) * 0.1}s` }}
                    >
                      <div className="bg-white rounded-sm shadow-[0_2px_20px_rgba(28,55,40,0.06)]">
                        {/* Image */}
                        <div className="aspect-[4/5] bg-[#F5F5F0] overflow-hidden rounded-sm img-zoom relative">
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
                          
                          {/* Favorite button on hover */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <svg className={`w-4 h-4 ${isFavorite(product.id) ? 'text-red-500 fill-red-500' : 'text-[#8CA89C]'}`} viewBox="0 0 24 24" fill={isFavorite(product.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
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
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* About */}
      <section id="about" className="py-24 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="text-sage text-xs tracking-[0.2em] uppercase font-medium">О НАС</span>
              <h2 className="font-display text-3xl sm:text-4xl text-[#1A3326] mt-3 leading-tight">
                Больше чем просто магазин растений
              </h2>
              <p className="text-[#6B7280] mt-5 leading-relaxed">
                Мы отбираем редкие и здоровые растения, чтобы ваш дом наполнился жизнью и уютом. Каждое растение проходит проверку перед отправкой.
              </p>
              <div className="mt-8 flex gap-10">
                <div>
                  <div className="text-2xl font-display text-[#1A3326]">50+</div>
                  <div className="text-xs text-[#6B7280] mt-1">видов растений</div>
                </div>
                <div>
                  <div className="text-2xl font-display text-[#1A3326]">1000+</div>
                  <div className="text-xs text-[#6B7280] mt-1">счастливых клиентов</div>
                </div>
                <div>
                  <div className="text-2xl font-display text-[#1A3326]">5★</div>
                  <div className="text-xs text-[#6B7280] mt-1">средний рейтинг</div>
                </div>
              </div>
            </div>
            <div className="reveal reveal-delay-2">
              <div className="aspect-[4/3] bg-[#E8F0EA] rounded-sm overflow-hidden">
                <img src="/uploads/products/plant-28.jpg" alt="About us" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacts" className="bg-sage text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <h3 className="font-display text-lg tracking-wide">Plant Shop</h3>
              <p className="text-white/70 text-sm mt-3 leading-relaxed">Редкие комнатные растения с доставкой по Москве</p>
            </div>
            <div>
              <h4 className="text-xs tracking-[0.15em] uppercase mb-4 font-medium">Информация</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Доставка и оплата</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Возврат</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Уход за растениями</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs tracking-[0.15em] uppercase mb-4 font-medium">Контакты</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>Telegram: @plantshop</li>
                <li>WhatsApp: +7 (999) 123-45-67</li>
                <li>Email: hello@plantshop.ru</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/20 text-center text-xs text-white/50">
            © 2026 Plant Shop. Все права защищены.
          </div>
        </div>
      </footer>
    </>
  );
}
