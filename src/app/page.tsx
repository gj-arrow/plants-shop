'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Product, parseImages } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';
import FallingLeaves from '@/components/FallingLeaves';

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
      .then(res => res.json())
      .then(data => {
        setProducts(data);
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


  return (
    <>
      <FallingLeaves />
      <div className="bg-gradient-animated min-h-screen">
        {/* Hero секция — на всю ширину */}
        <div className="relative pt-20 px-10 pb-10 md:pt-20 md:px-14 md:pb-14 mb-0 text-white fade-in"
        style={{
          background: 'linear-gradient(135deg, #388E3C 0%, #66BB6A 35%, #A5D6A7 65%, #C8E6C9 100%)',
          maskImage: 'linear-gradient(to bottom, black 0% 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0% 70%, transparent 100%)',
        }}
      >
        {/* Фоновое изображение */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/uploads/products/plant-28.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 70%, transparent 95%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 70%, transparent 95%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-['Playfair_Display'] leading-tight bg-gradient-to-r from-white via-[#C8E6C9] to-[#FFF9C4] bg-clip-text text-transparent">
              Цветы, которые<br />говорят с душой
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-xl mb-7 font-['Playfair_Display'] font-light italic leading-relaxed">
              Каждое растение — маленькая история уюта, свежести и гармонии. Найдите свою.
            </p>
          </div>
        </div>

        {/* Картинка справа до края */}
        <div className="hidden md:block absolute top-0 right-0 bottom-0 w-[55%] overflow-hidden">
          <img
            src="/uploads/products/plant-17.jpg"
            alt="Комнатное растение"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              maskImage: 'linear-gradient(to left, black 55%, transparent 80%)',
              WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 80%)',
            }}
          />
        </div>

        {/* Декоративные элементы */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/8 blur-lg"></div>
      </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Фильтр по категориям */}
          <div id="catalog" className="mb-8 flex flex-wrap gap-2 fade-in" style={{ animationDelay: '0.1s' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-[50px] text-sm font-semibold btn-press transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] text-white shadow-[0_4px_15px_rgba(76,175,80,0.35)]'
                    : 'bg-white text-[#4A3267] border-2 border-[rgba(76,175,80,0.2)] shadow-sm hover:border-[#2E7D32] hover:bg-[rgba(76,175,80,0.15)] hover:shadow-md'
                }`}
              >
                {cat === 'all' ? '🌱 Все' : cat}
              </button>
            ))}
          </div>

          {/* Каталог товаров */}
          {loading ? (
            <div className="text-center py-12 fade-in">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4CAF50] mb-3"></div>
              <p className="text-[#4A3267]">Загрузка товаров...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-[#8a7a9a] fade-in">
              <span className="text-5xl block mb-3">🔍</span>
              <p className="text-lg font-medium">Товары не найдены</p>
              <p className="text-sm mt-1">{searchQuery ? 'Попробуйте изменить запрос' : 'Попробуйте изменить категорию'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <ProductCard
                    product={product}
                    isFavorite={isFavorite(product.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                </div>
              ))}
          </div>
        )}
        </div>
      </div>
    </div>

    {/* Обо мне */}
    <div id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 fade-in">
      <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-sm p-8 md:p-10 shadow-[0_4px_30px_rgba(76,175,80,0.08)] border border-[rgba(76,175,80,0.1)]">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center text-4xl md:text-5xl shrink-0 shadow-lg">
            🌸
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold font-['Playfair_Display'] text-[#2D1B4E] mb-3">Обо мне</h2>
            <p className="text-[#4A3267] leading-relaxed text-base max-w-2xl">
              Меня зовут Людмила. Уже много лет моя жизнь — это растения. 
              Гортензии всех оттенков, величественные рододендроны, пушистые хвойные — 
              каждое выращено с душой и заботой. Верю, что растение начинается с любви: 
              к земле, к тишине в теплице, к первому распустившемуся бутону.
            </p>
            <p className="text-[#4A3267] leading-relaxed text-base max-w-2xl mt-2">
              Работаю с Европочтой, принимаю на самовывоз из Горок (Могилёвская область). 
              Всегда рада, когда мои зелёные питомцы находят новый дом.
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Контакты внизу страницы */}
    <div id="contacts" className="bg-white/70 backdrop-blur-sm border-t border-[rgba(76,175,80,0.15)] py-14 fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-['Playfair_Display'] text-[#2D1B4E] mb-2">Контакты</h2>
          <p className="text-[#8a7a9a]">Свяжитесь со мной любым удобным способом</p>
        </div>

        {/* Информация */}
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <p className="text-[#4A3267] text-base leading-relaxed">
            📍 Могилёвская область, г. Горки.
          </p>
          <p className="text-[#4A3267] text-base leading-relaxed mt-2">
            Европочта, Белпочта. Крупномеры самовывоз.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Телефон */}
          <div className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group">
            <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #2E7D32, #4CAF50)'}}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/>
              </svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Телефон</span>
            <span className="text-xs text-[#8a7a9a]">+375 (29) 842-59-52</span>
          </div>

          {/* Telegram */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #0088cc, #00a8e6)'}}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Telegram</span>
            <span className="text-xs text-[#8a7a9a]">@nickname</span>
          </a>

          {/* Viber */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(135deg, #7360f2, #8b7cf7)'}}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <path d="M12.072 0C5.378 0 .029 4.317.029 10.639c0 3.139 1.382 5.954 3.571 7.873V24l6.97-3.243c.678.133 1.377.205 2.093.205 6.694 0 12.043-4.317 12.043-10.64C24.214 4.317 18.766 0 12.072 0zm6.047 14.572c-.273.773-1.396 1.418-1.956 1.512-.535.09-1.008.382-3.34-.703-2.82-1.254-4.617-4.5-4.757-4.71-.14-.21-1.134-1.512-1.134-2.883 0-1.371.723-2.04.98-2.32.258-.28.562-.35.749-.35.187 0 .374 0 .535.007.187.007.437-.07.686.522.257.604.875 2.098.952 2.25.077.154.128.332.025.536-.102.205-.154.332-.307.51-.153.176-.322.37-.46.497-.153.14-.312.293-.203.574.108.28.507 1.365 1.09 2.21.748 1.072 1.38 1.44 1.585 1.594.204.153.332.128.454-.077.12-.205.535-.624.678-.84.145-.215.29-.18.485-.107.196.074 1.254.59 1.47.698.215.107.358.16.41.25.05.09.05.52-.223 1.293z"/>
              </svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Viber</span>
            <span className="text-xs text-[#8a7a9a]">+375 (29) 842-59-52</span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/tereshko3584/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}>
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Instagram</span>
            <span className="text-xs text-[#8a7a9a]">@tereshko3584</span>
          </a>

          {/* Одноклассники */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group"
          >
            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="#EE8208">
                <path d="M12 0a4.56 4.56 0 0 0-4.5 4.5A4.56 4.56 0 0 0 12 9a4.56 4.56 0 0 0 4.5-4.5A4.56 4.56 0 0 0 12 0zm0 6.73a2.24 2.24 0 1 1 0-4.48 2.24 2.24 0 0 1 0 4.48zm-5.97 4.3a1 1 0 0 0-.2 1.4l4.67 5.97-4.67 5.96a1 1 0 0 0 1.6 1.2L12 19.4l4.57 5.16a1 1 0 0 0 .7.33 1 1 0 0 0 .7-1.53l-4.67-5.96 4.67-5.97a1 1 0 1 0-1.6-1.2L12 15.67 7.83 10.5a1 1 0 0 0-.8-.47z"/>
              </svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Одноклассники</span>
            <span className="text-xs text-[#8a7a9a]">@nickname</span>
          </a>

          {/* Макс */}
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 bg-white rounded-2xl px-5 py-6 card-hover border border-[rgba(76,175,80,0.1)] group"
          >
            <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="43" height="43" fill="none" viewBox="0 0 43 43"><g filter="url(#a)"><g clipPath="url(#b)"><foreignObject width="2764.31" height="2764.31" x="-1382.15" y="-1382.15" transform="matrix(-.0126698 .018634 -.017121 -.0117992 20.42 23.37)"><div style={{background: 'conic-gradient(from 90deg,#06affb 0deg,#00b8ff 5.4deg,#001cf1 109.8deg,#8900ac 252deg,#06affb 360deg)', height: '100%', width: '100%', opacity: 1}}></div></foreignObject></g><path d="M22.39 41.89c-3.93 0-5.75-.58-8.9-2.9-2.02 2.61-8.34 4.63-8.62 1.17 0-2.6-.58-4.8-1.22-7.2C2.87 30 2 26.72 2 21.94 2 10.56 11.28 2 22.28 2c11 0 19.63 8.98 19.63 20.06 0 11.07-8.9 19.83-19.52 19.83Zm.2-30.02c-5.22-.27-9.3 3.37-10.2 9.08-.74 4.72.58 10.48 1.7 10.77.54.13 1.9-.98 2.74-1.82 1.39.9 2.97 1.6 4.73 1.7a9.96 9.96 0 0 0 10.4-9.34 10 10 0 0 0-9.37-10.39Z" clipRule="evenodd"></path></g><g filter="url(#c)"><ellipse cx="21.95" cy="22.09" fill="url(#d)" rx="19.05" ry="19.18"></ellipse></g><g filter="url(#e)"><ellipse cx="21.78" cy="21.4" fill="url(#f)" rx="17.91" ry="18.03"></ellipse></g><g filter="url(#g)"><ellipse cx="14" cy="14.1" fill="url(#h)" rx="14" ry="14.1" transform="matrix(-.998415 -.0562829 .0555313 -.998457 35.55 36.84)"></ellipse></g><g filter="url(#i)"><ellipse cx="1.14" cy="6.87" fill="#000" fillOpacity=".38" rx="1.14" ry="6.87" transform="matrix(.988028 -.154275 .152257 .988341 3.25 21.78)"></ellipse></g><g filter="url(#j)"><path stroke="#fff" strokeOpacity=".3" strokeWidth=".36" d="M21.47 7.36a2.43 2.43 0 0 1 2.8 0c.6.43 1.4.56 2.11.33.98-.3 2.06.05 2.66.87.45.6 1.17.97 1.92.97 1.01.01 1.93.68 2.26 1.65.24.7.8 1.28 1.52 1.51a2.43 2.43 0 0 1 1.64 2.27c0 .74.37 1.46.97 1.9.82.62 1.17 1.7.87 2.67-.23.71-.1 1.5.33 2.12.6.83.6 1.96 0 2.8-.43.6-.56 1.4-.33 2.11.3.97-.05 2.06-.87 2.66-.6.45-.96 1.17-.97 1.91a2.43 2.43 0 0 1-1.64 2.27c-.71.24-1.28.8-1.52 1.51a2.43 2.43 0 0 1-2.26 1.65c-.75 0-1.47.37-1.92.97a2.43 2.43 0 0 1-2.66.87 2.43 2.43 0 0 0-2.12.33c-.83.6-1.96.6-2.8 0a2.43 2.43 0 0 0-2.11-.33c-.97.3-2.05-.05-2.66-.87a2.43 2.43 0 0 0-1.91-.97 2.43 2.43 0 0 1-2.27-1.65c-.23-.7-.8-1.27-1.51-1.51a2.43 2.43 0 0 1-1.65-2.27c0-.74-.37-1.46-.97-1.9a2.43 2.43 0 0 1-.86-2.67c.22-.71.1-1.5-.34-2.12a2.43 2.43 0 0 1 0-2.8c.43-.6.56-1.4.34-2.11-.3-.97.04-2.05.86-2.66.6-.45.97-1.17.97-1.91A2.43 2.43 0 0 1 11 12.69c.7-.23 1.28-.8 1.51-1.51a2.43 2.43 0 0 1 2.27-1.65c.74 0 1.46-.37 1.9-.97a2.43 2.43 0 0 1 2.67-.87c.71.23 1.5.1 2.12-.33Z"></path></g><defs><filter id="a" width="39.91" height="40" x="2" y="2" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"></feColorMatrix><feOffset></feOffset><feGaussianBlur stdDeviation="2.25"></feGaussianBlur><feComposite in2="hardAlpha" k2="-1" k3="1" operator="arithmetic"></feComposite><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0"></feColorMatrix><feBlend in2="shape" result="effect1_innerShadow_338_8816"></feBlend></filter><filter id="c" width="40.49" height="40.74" x="1.71" y="1.72" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur result="effect1_foregroundBlur_338_8816" stdDeviation=".6"></feGaussianBlur></filter><filter id="e" width="40.61" height="40.85" x="1.48" y=".98" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur result="effect1_foregroundBlur_338_8816" stdDeviation="1.2"></feGaussianBlur></filter><filter id="g" width="31.59" height="31.78" x="6.56" y="6.08" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur result="effect1_foregroundBlur_338_8816" stdDeviation=".9"></feGaussianBlur></filter><filter id="i" width="10.26" height="20.76" x=".3" y="18.02" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur result="effect1_foregroundBlur_338_8816" stdDeviation="1.79"></feGaussianBlur></filter><filter id="j" width="37.4" height="37.4" x="4.17" y="4.35" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend><feGaussianBlur result="effect1_foregroundBlur_338_8816" stdDeviation="1.2"></feGaussianBlur></filter><linearGradient id="d" x1="29.96" x2="37.74" y1="33.06" y2="48.3" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity="0"></stop><stop offset="1" stopColor="#fff" stopOpacity=".37"></stop></linearGradient><linearGradient id="f" x1="11.72" x2="14.13" y1="6" y2="9.55" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"></stop><stop offset="1" stopColor="#fff" stopOpacity="0"></stop></linearGradient><linearGradient id="h" x1="5.34" x2="8.27" y1="1.47" y2="5.69" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" stopOpacity=".69"></stop><stop offset="1" stopColor="#fff" stopOpacity="0"></stop></linearGradient><clipPath id="b"><path fillRule="evenodd" d="M22.39 41.89c-3.93 0-5.75-.58-8.9-2.9-2.02 2.61-8.34 4.63-8.62 1.17 0-2.6-.58-4.8-1.22-7.2C2.87 30 2 26.72 2 21.94 2 10.56 11.28 2 22.28 2c11 0 19.63 8.98 19.63 20.06 0 11.07-8.9 19.83-19.52 19.83Zm.2-30.02c-5.22-.27-9.3 3.37-10.2 9.08-.74 4.72.58 10.48 1.7 10.77.54.13 1.9-.98 2.74-1.82 1.39.9 2.97 1.6 4.73 1.7a9.96 9.96 0 0 0 10.4-9.34 10 10 0 0 0-9.37-10.39Z" clipRule="evenodd"></path></clipPath></defs></svg>
            </div>
            <span className="font-semibold text-[#2D1B4E]">Макс</span>
            <span className="text-xs text-[#8a7a9a]">+375 (29) 842-59-52</span>
          </a>
        </div>

        {/* Наверх */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="hidden xl:flex absolute -right-20 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] items-center justify-center shadow-[0_4px_15px_rgba(76,175,80,0.35)] hover:shadow-[0_8px_25px_rgba(76,175,80,0.5)] hover:scale-110 transition-all duration-300 cursor-pointer"
          aria-label="Наверх"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
      </div>
      </div>
    </div>
    </>
  );
}

interface ProductCardProps {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
}

function ProductCard({
  product,
  isFavorite,
  onToggleFavorite,
}: ProductCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/products/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-[20px] shadow-md overflow-hidden card-hover flex flex-col h-full cursor-pointer border border-[rgba(76,175,80,0.1)]"
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
            onClick={(e) => e.stopPropagation()}
          >
            Подробнее →
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
            className={`w-12 h-12 rounded-xl border-2 btn-press transition flex items-center justify-center shrink-0 ${
              isFavorite
                ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                : 'border-[rgba(76,175,80,0.2)] text-[#8a7a9a] hover:border-red-200 hover:text-red-400 hover:bg-red-50'
            }`}
            aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
