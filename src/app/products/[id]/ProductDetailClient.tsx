'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseImages, formatPrice, showPriceFrom, SITE_URL, type Product } from '@/lib/product-utils';
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
    fetch('/api/auth').then(r=>r.ok?r.json():null).then(d=>{if(d?.authenticated&&d.user?.role==='admin') setIsAdmin(true)}).catch(()=>{});
    fetch('/api/categories').then(r=>r.json()).then(d=>setCategories(d)).catch(()=>{});
  }, []);
  useEffect(()=>{ if(!fullscreen) return; const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') setFullscreen(false); if(e.key==='ArrowLeft') setSelectedImage(p=>(p-1+images.length)%images.length); if(e.key==='ArrowRight') setSelectedImage(p=>(p+1)%images.length);}; window.addEventListener('keydown',onKey); return()=>window.removeEventListener('keydown',onKey);},[fullscreen,images.length]);

  return (
    <section className="min-h-screen bg-[#FDFBF7] pt-[88px] pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({'@context':'https://schema.org','@type':'Product',name:product.name,category:product.category,description:product.description||undefined,image:images.length>0?images.map(img=>new URL(img,SITE_URL).toString()):undefined,offers:{'@type':'Offer',priceCurrency:'BYN',price:String(product.price),availability:product.out_of_stock?'https://schema.org/OutOfStock':'https://schema.org/InStock',url:`${SITE_URL}/products/${product.id}`}}).replace(/</g,'\\u003c')}} />
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-[#122620]/90 backdrop-blur-md flex items-center justify-center p-4" onClick={()=>setFullscreen(false)}>
          <button onClick={(e)=>{e.stopPropagation(); setSelectedImage(p=>(p-1+images.length)%images.length)}} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white flex items-center justify-center z-10"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path d="M15 19l-7-7 7-7"/></svg></button>
          {images.length>0 ? <img src={images[selectedImage]} alt={product.name} className={`max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl cursor-zoom-out ${product.out_of_stock?'opacity-60':''}`} onClick={()=>setFullscreen(false)} /> : <div className="text-8xl">🪴</div>}
          <button onClick={(e)=>{e.stopPropagation(); setSelectedImage(p=>(p+1)%images.length)}} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white flex items-center justify-center z-10"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path d="M9 5l7 7-7 7"/></svg></button>
          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur border border-white/20 text-white text-xs px-3 py-1.5 rounded-full">{selectedImage+1} / {Math.max(images.length,1)}</span>
          <button onClick={()=>setFullscreen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/20">✕</button>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/#catalog" className="inline-flex items-center gap-2 text-[13px] text-[#8A8178] hover:text-[#122620] transition mb-6 group"><span className="w-7 h-7 rounded-full bg-white border border-[#E8D5B7]/40 flex items-center justify-center group-hover:border-[#C9A86A] group-hover:bg-[#122620] group-hover:text-white transition"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path d="M19 12H5m7-7l-7 7 7 7"/></svg></span> Назад в каталог</Link>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[24px] overflow-hidden border border-[#E8D5B7]/30 shadow-[0_8px_30px_rgba(18,38,32,0.06)] p-3">
              <div className="bg-[#F5F1E8] rounded-[16px] overflow-hidden cursor-zoom-in relative aspect-[4/3] flex items-center justify-center">
                {images.length>0 ? <img src={images[selectedImage]} alt={product.name} className={`w-full h-full object-contain ${product.out_of_stock?'opacity-60':''}`} onClick={()=>setFullscreen(true)} /> : <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-[#F5F1E8] to-[#E8D5B7]/30">🪴</div>}
                {images.length>1 && <><button onClick={()=>setSelectedImage(p=>(p-1+images.length)%images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-[#E8D5B7]/30 flex items-center justify-center hover:bg-white"> <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg></button><button onClick={()=>setSelectedImage(p=>(p+1)%images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md border border-[#E8D5B7]/30 flex items-center justify-center hover:bg-white"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg></button></>}
                <div className="absolute bottom-3 right-3 bg-[#122620]/80 backdrop-blur text-white text-xs px-3 py-1 rounded-full border border-white/10">{selectedImage+1} / {Math.max(images.length,1)} • Нажмите для увеличения</div>
              </div>
              {images.length>1 && <div className="flex gap-2.5 mt-3 justify-center">{images.map((img,i)=><button key={i} onClick={()=>setSelectedImage(i)} className={`w-[72px] h-[72px] rounded-xl overflow-hidden border-2 ${selectedImage===i?'border-[#C9A86A] shadow-[0_4px_12px_rgba(201,168,106,0.3)] scale-[1.02]':'border-transparent hover:border-[#E8D5B7] opacity-70 hover:opacity-100'}`}><img src={img} alt="" className={`w-full h-full object-cover ${product.out_of_stock?'opacity-60':''}`} /></button>)}</div>}
            </div>
            <div className="mt-4 bg-[#122620] rounded-2xl p-4 flex items-center gap-3 text-white relative overflow-hidden"><div className="absolute -right-10 -top-10 w-32 h-32 bg-[#C9A86A]/10 rounded-full blur-2xl" /><div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">✓</div><div><div className="text-sm font-medium">Фото перед отправкой • ЗКС • Адаптировано к Беларуси</div><div className="text-xs text-white/60">Доставка Европочтой / Белпочтой • Самовывоз г. Горки</div></div></div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[24px] border border-[#E8D5B7]/30 shadow-[0_8px_30px_rgba(18,38,32,0.05)] p-6 sm:p-8 sticky top-[88px]">
              {product.category && <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F1E8] border border-[#E8D5B7]/30 text-[11px] tracking-[0.15em] uppercase font-semibold text-[#8C704A]"><span className="w-1.5 h-1.5 rounded-full bg-[#C9A86A]" /> {product.category}{product.subcategory && <span className="text-[#8A8178] font-normal normal-case tracking-normal">• {product.subcategory}</span>}</div>}
              <h1 className="font-display text-[28px] sm:text-[32px] text-[#122620] mt-3 leading-[1.1] tracking-[-0.02em]">{product.name}</h1>
              <div className="mt-4 flex items-baseline gap-3">{product.out_of_stock ? <span className="px-4 py-2 rounded-full bg-[#122620] text-white text-sm font-medium">Нет в наличии — под заказ</span> : <><span className="font-display text-[30px] font-semibold tracking-[-0.02em] text-[#8C704A]">{showPriceFrom(product)?'от ':''}{formatPrice(product.price)}</span><span className="text-[#8C704A] font-medium">BYN</span><span className="ml-auto text-xs text-[#8A8178] bg-[#FDFBF7] border border-[#E8D5B7]/30 px-3 py-1 rounded-full">Цена за 1 шт.</span></>}</div>
              <div className="h-[1px] bg-gradient-to-r from-[#E8D5B7]/40 via-[#E8D5B7]/20 to-transparent my-6" />
              {product.description && <div><h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#8A8178] mb-2">Описание</h3><p className="text-[#2B2B2B] leading-relaxed whitespace-pre-line text-[14px]">{product.description}</p></div>}
              {!isAdmin ? <button onClick={()=>toggleFavorite(product.id)} className={`w-full mt-7 px-8 py-4 rounded-full text-sm font-semibold tracking-wide btn-press inline-flex items-center justify-center gap-2 border ${fav?'bg-[#122620] text-white border-[#122620] shadow-[0_8px_20px_rgba(18,38,32,0.2)]':'bg-[#C9A86A] text-white border-[#C9A86A] hover:bg-[#8C704A] hover:border-[#8C704A] shadow-[0_8px_20px_rgba(201,168,106,0.3)]'}`}><svg width="18" height="18" viewBox="0 0 24 24" fill={fav?'currentColor':'none'} stroke="currentColor" strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>{fav?'В избранном ✓':'Добавить в избранное'}</button> : <><button onClick={()=>setShowEditModal(true)} className="w-full mt-7 px-8 py-4 rounded-full border-2 border-[#122620] text-[#122620] text-sm font-semibold hover:bg-[#122620] hover:text-white transition btn-press">✏️ Редактировать</button><button onClick={async()=>{ if(!confirm('Удалить товар?')) return; const r=await fetch(`/api/products/${product.id}`,{method:'DELETE'}); if(r.ok) window.location.href='/admin/products'; else alert('Ошибка');}} className="w-full mt-3 px-8 py-3 rounded-full border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition">Удалить</button></>}
              <div className="mt-5 bg-[#FDFBF7] rounded-2xl p-4 border border-[#E8D5B7]/30 flex gap-3"><div className="w-9 h-9 rounded-full bg-[#122620] flex items-center justify-center text-white flex-shrink-0">✦</div><div><div className="text-sm font-medium text-[#122620]">Нужна консультация?</div><div className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">Подберу растения под ваш сад, расскажу про уход. Звоните — отвечаю лично.</div><a href="tel:+375298425952" className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-[#8C704A] hover:text-[#122620] transition">+375 (29) 842-59-52 <span>→</span></a></div></div>
              <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-[#F5F1E8] text-xs text-[#8A8178]"><span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px]">✓</span> Проверено</span><span className="w-1 h-1 rounded-full bg-[#E8D5B7]" /><span>Фото реальные</span><span className="w-1 h-1 rounded-full bg-[#E8D5B7]" /><span>Отправка 2–3 дня</span></div>
            </div>
          </div>
        </div>
      </div>
      {showEditModal && <ProductEditModal product={product} categories={categories} onClose={()=>setShowEditModal(false)} onSaved={()=>window.location.reload()} />}
    </section>
  );
}
