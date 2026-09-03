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
    fetch('/api/products').then(res=>res.json()).then((all:Product[])=>{ setProducts(all.filter(p=>favorites.includes(p.id))); setLoadingProducts(false);}).catch(()=>setLoadingProducts(false));
  }, [favorites, favoritesLoading]);

  return (
    <div className="bg-[#FDFBF7] pt-[88px] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div><span className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[#C9A86A]">Избранное</span><h1 className="font-display text-3xl sm:text-4xl text-[#122620] mt-1 tracking-[-0.02em] leading-none">Ваша коллекция</h1></div>
          <Link href="/#catalog" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E8D5B7]/40 text-sm text-[#122620] hover:border-[#C9A86A] transition shadow-sm">← В каталог</Link>
        </div>
        {favoritesLoading||loadingProducts ? (
          <div className="text-center py-16 bg-white rounded-[24px] border border-[#E8D5B7]/20"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#E8D5B7] border-t-[#C9A86A] mb-3"></div><p className="text-[#8A8178] text-sm">Загрузка...</p></div>
        ) : products.length===0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-[#E8D5B7]/30 shadow-[0_8px_30px_rgba(18,38,32,0.04)] max-w-2xl mx-auto"><div className="w-20 h-20 rounded-full bg-[#F5F1E8] border border-[#E8D5B7]/30 flex items-center justify-center mx-auto mb-4 text-3xl">♡</div><h2 className="font-display text-2xl text-[#122620]">В избранном пока пусто</h2><p className="text-[#8A8178] mt-2 text-sm leading-relaxed max-w-md mx-auto">Нажимайте ♡ на карточках товаров, чтобы сохранить их здесь.</p><button onClick={()=>router.push('/')} className="mt-6 px-8 py-3 bg-[#122620] text-white rounded-full text-sm font-medium hover:bg-black transition shadow-[0_8px_20px_rgba(18,38,32,0.2)]">Перейти в каталог →</button></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...products].sort((a,b)=>{if(a.out_of_stock&&!b.out_of_stock) return 1; if(!a.out_of_stock&&b.out_of_stock) return -1; return 0;}).map(product=>{
              const images=parseImages(product);
              return (
                <Link key={product.id} href={`/products/${product.id}`} className="group h-full">
                  <div className="bg-white rounded-[20px] overflow-hidden flex flex-col h-full border border-[#E8D5B7]/25 shadow-[0_4px_20px_rgba(18,38,32,0.05)] card-luxe">
                    <div className="aspect-[4/5] bg-[#F5F1E8] overflow-hidden relative img-zoom">
                      {images.length>0 ? <img src={images[0]} alt={product.name} className={`w-full h-full object-cover ${product.out_of_stock?'opacity-60':''}`} /> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[#F5F1E8] to-[#E8D5B7]/30">🪴</div>}
                      <button onClick={(e)=>{e.preventDefault(); toggleFavorite(product.id);}} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#C9A86A] border border-[#C9A86A] text-white flex items-center justify-center shadow-md"><svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.8}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></button>
                      {product.out_of_stock && <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#122620]/90 text-white text-[11px] font-semibold">Нет в наличии</div>}
                    </div>
                    <div className="pt-4 pb-4 px-4 flex-1 flex flex-col">
                      {product.category && <span className="text-[#C9A86A] text-[10px] tracking-[0.18em] uppercase font-semibold">{product.category}</span>}
                      <h3 className="text-[#122620] font-display text-[15px] font-medium mt-1 leading-snug line-clamp-2 min-h-[42px]">{product.name}</h3>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F1E8]">{product.out_of_stock ? <span className="text-[#8A8178] text-sm">Под заказ</span> : <span className="price-gold font-display text-[16px] font-semibold">{showPriceFrom(product)?'от ':''}{formatPrice(product.price)} <span className="text-xs font-sans font-medium">BYN</span></span>}<span className="w-7 h-7 rounded-full bg-[#FDFBF7] border border-[#E8D5B7]/40 flex items-center justify-center text-[#C9A86A] group-hover:bg-[#122620] group-hover:text-white transition">→</span></div>
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
