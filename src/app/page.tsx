'use client';

import { Fragment, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, parseImages, formatPrice, showPriceFrom } from '@/lib/product-utils';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="bg-[#FDFBF7] min-h-screen" style={{ paddingTop: '5rem' }} />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['all']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Гортензии');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  const [cardImageIdx, setCardImageIdx] = useState<Record<number, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [heroVersion, setHeroVersion] = useState(0);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth').then(r=>r.ok?r.json():null).then(d=>{if(d?.authenticated&&d.user?.role==='admin') setIsAdmin(true)}).catch(()=>{});
  }, []);
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if(!file) return; setHeroUploading(true);
    try{ const fd=new FormData(); fd.append('file',file); const res=await fetch('/api/upload/hero',{method:'POST',body:fd}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Ошибка'); setHeroVersion(Date.now()); }catch(err){ alert(err instanceof Error?err.message:'Ошибка')}finally{ setHeroUploading(false); e.target.value='';}
  };
  useEffect(()=>{ const s=sessionStorage; const sc=s.getItem('catalogCategory'); const ss=s.getItem('catalogSubcategory'); const sp=s.getItem('catalogPage'); if(sc||ss||sp){ if(sc){s.setItem('_restoredCategory',sc); setSelectedCategory(sc);} if(ss) setSelectedSubcategory(ss); if(sp) setPage(parseInt(sp,10)); } s.removeItem('catalogCategory'); s.removeItem('catalogSubcategory'); s.removeItem('catalogPage'); },[]);
  useEffect(()=>{ const mq=window.matchMedia('(min-width:1024px)'); setIsDesktop(mq.matches); const h=(e:MediaQueryListEvent)=>setIsDesktop(e.matches); mq.addEventListener('change',h); return()=>mq.removeEventListener('change',h);},[]);
  const PAGE_SIZE=isDesktop?12:14; const clickCount=useRef(0); const router=useRouter();
  const handleSecretClick=useCallback(()=>{ clickCount.current+=1; if(clickCount.current>=15) router.push('/login');},[router]);
  const [mobileSearchValue,setMobileSearchValue]=useState(searchQuery);
  useEffect(()=>{ const t=setTimeout(()=>{ const tr=mobileSearchValue.trim(); const cq=new URLSearchParams(window.location.search).get('q')||''; if(tr!==cq){ router.push(tr?`/?q=${encodeURIComponent(tr)}`:'/',{scroll:false});}},400); return()=>clearTimeout(t);},[mobileSearchValue,router]);
  useEffect(()=>setMobileSearchValue(searchQuery),[searchQuery]);
  const {favorites,toggleFavorite,isFavorite}=useFavorites();
  useEffect(()=>{ Promise.all([fetch('/api/products').then(r=>r.ok?r.json():[]),fetch('/api/categories').then(r=>r.ok?r.json():[]) ]).then(([p,c])=>{ setProducts(Array.isArray(p)?p:[]); setCategories(['all',... (Array.isArray(c)?c:[]).map((x:any)=>x.name)]); setLoading(false);}).catch(()=>setLoading(false));},[]);
  useEffect(()=>{ if(!loading){ const y=sessionStorage.getItem('catalogScrollY'); if(y){ sessionStorage.removeItem('catalogScrollY'); requestAnimationFrame(()=>window.scrollTo(0,parseInt(y,10)));}}},[loading]);
  const saveScroll=()=>{ sessionStorage.setItem('catalogScrollY',String(window.scrollY)); sessionStorage.setItem('catalogPage',String(page)); sessionStorage.setItem('catalogCategory',selectedCategory); sessionStorage.setItem('catalogSubcategory',selectedSubcategory);};
  const filteredProducts=products.filter(p=>{ const s=searchQuery.trim().length>0; return (s||selectedCategory==='all'||p.category===selectedCategory) && (s||!selectedSubcategory||p.subcategory===selectedSubcategory) && (!searchQuery||p.name.toLowerCase().includes(searchQuery.toLowerCase()));});
  const subcategories=selectedCategory!=='all'?[...new Set(products.filter(p=>p.category===selectedCategory&&p.subcategory).map(p=>p.subcategory!))]:[];
  const totalPages=Math.max(1,Math.ceil(filteredProducts.length/PAGE_SIZE)); const currentPage=Math.min(page,totalPages);
  const sorted=[...filteredProducts].sort((a,b)=>{ if(a.out_of_stock&&!b.out_of_stock) return 1; if(!a.out_of_stock&&b.out_of_stock) return -1; return 0;});
  const paginated=sorted.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);
  const prevCat=useRef(selectedCategory); const prevQ=useRef(searchQuery);
  useEffect(()=>{ if(prevCat.current===selectedCategory&&prevQ.current===searchQuery) return; const r=sessionStorage.getItem('_restoredCategory'); if(r){ sessionStorage.removeItem('_restoredCategory'); prevCat.current=selectedCategory; prevQ.current=searchQuery; return; } prevCat.current=selectedCategory; prevQ.current=searchQuery; setSelectedSubcategory(''); setPage(1);},[selectedCategory,searchQuery]);
  const once=useRef(false); useEffect(()=>{ if(!loading){ if(!once.current){ once.current=true; return;} document.getElementById('catalog')?.scrollIntoView({behavior:'smooth',block:'start'});} },[page,loading]);
  useEffect(()=>{ const o=new IntersectionObserver(ents=>ents.forEach(e=>{if(e.isIntersecting) e.target.classList.add('visible')}),{threshold:0.1}); document.querySelectorAll('.reveal').forEach(el=>o.observe(el)); return()=>o.disconnect();},[]);
  return (
    <>
      {/* HERO LUXE */}
      <section className="relative bg-[#122620] pt-[68px] overflow-hidden min-h-[88vh] flex flex-col">
        <div className="absolute inset-0">
          <img src={`/uploads/products/hero.jpg?v=${heroVersion}`} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#122620]/80 via-[#122620]/55 to-[#122620]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#122620]/40 via-transparent to-transparent" />
          <div className="absolute inset-0 opacity-[0.15]" style={{background:'radial-gradient(ellipse at 30% 50%, rgba(201,168,106,0.3), transparent 60%)'}} />
        </div>
        {isAdmin && (
          <div className="absolute top-[84px] right-4 z-20">
            <input ref={heroFileInputRef} type="file" accept="image/*" onChange={handleHeroUpload} disabled={heroUploading} className="hidden" />
            <button type="button" onClick={()=>heroFileInputRef.current?.click()} disabled={heroUploading} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-white/20 transition cursor-pointer">
              {heroUploading ? <><span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span> Загрузка...</> : <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Изменить фото</>}
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 flex-1 flex items-center">
          <div className="grid grid-cols-1 gap-8 items-center w-full min-h-[calc(88vh-68px)] py-10 lg:py-0" onClick={handleSecretClick}>
            <div className="reveal visible flex flex-col">
              <h1 className="font-display leading-[0.95] tracking-[-0.03em]">
                <span className="block text-[#E8D5B7] text-[13px] sm:text-sm tracking-[0.32em] uppercase font-medium mb-4 opacity-90">Цветы Людмилы</span>
                <span className="block text-white text-[42px] sm:text-[54px] lg:text-[64px] font-[400] leading-[0.95]">Хвойные,</span>
                <span className="block text-white text-[42px] sm:text-[54px] lg:text-[64px] font-[300] italic leading-[0.95]" style={{fontFamily:'var(--font-cormorant)'}}>ниваки &</span>
                <span className="block text-white text-[42px] sm:text-[54px] lg:text-[64px] font-[400] leading-[0.95]">гортензии</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button onClick={()=>document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'})} className="inline-flex items-center gap-2 bg-[#C9A86A] text-[#122620] px-7 py-3.5 rounded-full text-[13px] font-semibold tracking-wide hover:bg-[#D4B98A] transition shadow-[0_8px_24px_rgba(201,168,106,0.3)] btn-press">Перейти в каталог <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
                <a href="tel:+375298425952" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-6 py-3.5 rounded-full text-[13px] font-medium hover:bg-white/20 transition"><span className="w-6 h-6 rounded-full bg-white flex items-center justify-center"><svg width="11" height="11" viewBox="0 0 24 24" fill="#122620"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/></svg></span>+375 29 842-59-52</a>
              </div>

            </div>

          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A86A]/40 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgba(18,38,32,0.06)] border border-[#E8D5B7]/30 p-3 flex items-center gap-3 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8178] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" value={mobileSearchValue} onChange={e=>setMobileSearchValue(e.target.value)} placeholder="Поиск по названию — гортензия, туя, ниваки..." className="w-full pl-11 pr-10 py-3 text-[14px] rounded-full bg-[#FDFBF7] border border-[#E8D5B7]/40 text-[#122620] placeholder-[#8A8178]/70 focus:outline-none focus:border-[#C9A86A] focus:bg-white transition" />
            {mobileSearchValue && <button onClick={()=>{setMobileSearchValue(''); router.push('/',{scroll:false})}} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#122620] text-white flex items-center justify-center hover:bg-black transition cursor-pointer" aria-label="Очистить"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] tracking-wide uppercase text-[#8A8178] pr-2"><span className="w-2 h-2 rounded-full bg-[#C9A86A] animate-pulse"/> Каталог {filteredProducts.length}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="pt-8 lg:pt-10" id="catalog">
          <div className="text-center mb-6"><span className="text-[11px] tracking-[0.28em] uppercase font-semibold text-[#C9A86A]">Коллекция</span><h2 className="font-display text-[28px] sm:text-[32px] text-[#122620] leading-none mt-2 tracking-[-0.02em]">Выберите категорию</h2><div className="w-12 h-[2px] bg-[#C9A86A] mx-auto mt-3 rounded-full" /></div>
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.filter(c=>c==='Гортензии').map(cat=>(
              <Fragment key={cat}><div className="flex flex-wrap gap-2 justify-center items-center w-full">
                <button onClick={()=>setSelectedCategory(cat)} className={`px-7 py-2.5 rounded-full text-[13px] font-medium tracking-wide transition-all border ${selectedCategory===cat?'bg-[#122620] text-white border-[#122620] shadow-[0_4px_16px_rgba(18,38,32,0.2)]':'bg-white text-[#122620] border-[#E8D5B7]/60 hover:border-[#C9A86A] hover:bg-[#FDFBF7] shadow-sm'}`}>{cat} <span className={`ml-1 text-xs ${selectedCategory===cat?'text-[#C9A86A]':'text-[#8A8178]'}`}>•</span></button>
                {selectedCategory===cat&&subcategories.length>0&&<div className="flex flex-wrap gap-1.5 items-center"><button onClick={()=>setSelectedSubcategory('')} className={`px-4 py-2 rounded-full text-xs font-medium border ${!selectedSubcategory?'bg-[#C9A86A] text-white border-[#C9A86A] shadow-sm':'bg-white text-[#6B6B6B] border-[#E8D5B7]/50 hover:border-[#C9A86A]'}`}>Все</button>{subcategories.map(sub=><button key={sub} onClick={()=>setSelectedSubcategory(sub)} className={`px-4 py-2 rounded-full text-xs font-medium border ${selectedSubcategory===sub?'bg-[#C9A86A] text-white border-[#C9A86A] shadow-sm':'bg-white text-[#6B6B6B] border-[#E8D5B7]/50 hover:border-[#C9A86A]'}`}>{sub}</button>)}</div>}
              </div></Fragment>
            ))}
            <div className="flex flex-wrap gap-2 justify-center items-center w-full">
              {categories.filter(c=>c!=='all'&&c!=='Гортензии').map(cat=>(
                <Fragment key={cat}>
                  <button onClick={()=>setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-full text-[13px] font-medium tracking-wide border ${selectedCategory===cat?'bg-[#122620] text-white border-[#122620] shadow-[0_4px_16px_rgba(18,38,32,0.2)]':'bg-white text-[#122620] border-[#E8D5B7]/60 hover:border-[#C9A86A] hover:bg-[#FDFBF7] shadow-sm'}`}>{cat}</button>
                  {selectedCategory===cat&&subcategories.length>0&&<div className="flex flex-wrap gap-1.5 items-center"><button onClick={()=>setSelectedSubcategory('')} className={`px-4 py-2 rounded-full text-xs font-medium border ${!selectedSubcategory?'bg-[#C9A86A] text-white border-[#C9A86A]':'bg-white text-[#6B6B6B] border-[#E8D5B7]/50 hover:border-[#C9A86A]'}`}>Все</button>{subcategories.map(sub=><button key={sub} onClick={()=>setSelectedSubcategory(sub)} className={`px-4 py-2 rounded-full text-xs font-medium border ${selectedSubcategory===sub?'bg-[#C9A86A] text-white border-[#C9A86A]':'bg-white text-[#6B6B6B] border-[#E8D5B7]/50 hover:border-[#C9A86A]'}`}>{sub}</button>)}</div>}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-[#E8D5B7] border-t-[#C9A86A] mb-3"></div><p className="text-[#8A8178] text-sm">Загрузка коллекции...</p></div>
        ) : filteredProducts.length===0 ? (
          <div className="text-center py-20"><div className="w-16 h-16 rounded-full bg-[#F5F1E8] border border-[#E8D5B7]/40 flex items-center justify-center mx-auto mb-4 text-xl">🌿</div><p className="text-[#122620] font-display text-lg">Нет товаров в этой категории</p><p className="text-[#8A8178] text-sm mt-1">Попробуйте другую категорию или сбросьте поиск</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
              {paginated.map((product,i)=>{
                const images=parseImages(product); const idx=Math.min(cardImageIdx[product.id]??0, Math.max(images.length-1,0)); const next=()=>setCardImageIdx(prev=>({...prev,[product.id]:(idx+1)%images.length})); const prev=()=>setCardImageIdx(prev=>({...prev,[product.id]:(idx-1+images.length)%images.length}));
                return (
                  <Link key={product.id} href={`/products/${product.id}`} className="group card-enter h-full" style={{animationDelay:`${Math.min(i,5)*0.08}s`}} onClick={saveScroll}>
                    <div className="bg-white rounded-[20px] overflow-hidden flex flex-col h-full border border-[#E8D5B7]/25 shadow-[0_4px_20px_rgba(18,38,32,0.05)] card-luxe">
                      <div className="aspect-[4/5] bg-[#F5F1E8] overflow-hidden relative img-zoom">
                        {images.length>0 ? <img src={images[idx]} alt={product.name} className={`w-full h-full object-cover ${product.out_of_stock?'opacity-60 grayscale-[0.2]':''}`} /> : <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[#F5F1E8] to-[#E8D5B7]/30">🪴</div>}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {images.length>1 && <><button onClick={(e)=>{e.preventDefault(); e.stopPropagation(); prev();}} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-[#122620] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] opacity-0 group-hover:opacity-100 transition hover:bg-white hover:scale-105 z-10"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7"/></svg></button><button onClick={(e)=>{e.preventDefault(); e.stopPropagation(); next();}} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur text-[#122620] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] opacity-0 group-hover:opacity-100 transition hover:bg-white hover:scale-105 z-10"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg></button></>}
                        {images.length>1 && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">{images.map((_,di)=><button key={di} onClick={(e)=>{e.preventDefault(); e.stopPropagation(); setCardImageIdx(prev=>({...prev,[product.id]:di}));}} className={`h-1.5 rounded-full transition-all ${di===idx?'w-6 bg-[#C9A86A]':'w-1.5 bg-white/70 hover:bg-white'}`} aria-label={`Фото ${di+1}`} />)}</div>}
                        {product.out_of_stock && <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#122620]/90 backdrop-blur text-white text-[11px] font-semibold">Нет в наличии</div>}
                        <button onClick={(e)=>{e.preventDefault(); toggleFavorite(product.id);}} className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.08)] border backdrop-blur ${isFavorite(product.id)?'bg-[#C9A86A] border-[#C9A86A] text-white':'bg-white/90 border-white/50 text-[#8A8178] hover:text-[#C9A86A] hover:border-[#C9A86A]/30 hover:bg-white'}`}><svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite(product.id)?'currentColor':'none'} stroke="currentColor" strokeWidth={1.8}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></button>
                      </div>
                      <div className="pt-4 pb-4 px-4 flex-1 flex flex-col">
                        {product.category && <span className="text-[10px] tracking-[0.18em] uppercase font-semibold text-[#C9A86A]">{product.category}{product.subcategory?<span className="text-[#8A8178] font-normal"> • {product.subcategory}</span>:null}</span>}
                        <h3 className="text-[#122620] font-display text-[15px] font-[500] mt-1 leading-snug line-clamp-2 min-h-[42px]">{product.name}</h3>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F1E8]">
                          {product.out_of_stock ? <span className="text-[#8A8178] text-sm">Под заказ</span> : <span className="price-gold font-display text-[16px] font-semibold">{showPriceFrom(product)?'от ':''}{formatPrice(product.price)} <span className="text-xs font-sans font-medium">BYN</span></span>}
                          <span className="w-7 h-7 rounded-full bg-[#FDFBF7] border border-[#E8D5B7]/40 flex items-center justify-center text-[#C9A86A] group-hover:bg-[#122620] group-hover:text-white group-hover:border-[#122620] transition"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalPages>1 && <div className="flex items-center justify-center gap-1.5 mt-10"><button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={currentPage===1} className="w-9 h-9 rounded-full border border-[#E8D5B7]/50 flex items-center justify-center disabled:opacity-30 hover:border-[#C9A86A] bg-white shadow-sm">←</button>{Array.from({length:totalPages},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-9 h-9 rounded-full text-sm font-medium ${p===currentPage?'bg-[#122620] text-white shadow-[0_4px_12px_rgba(18,38,32,0.2)]':'bg-white border border-[#E8D5B7]/50 text-[#6B6B6B] hover:border-[#C9A86A] shadow-sm'}`}>{p}</button>)}<button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages} className="w-9 h-9 rounded-full border border-[#E8D5B7]/50 flex items-center justify-center disabled:opacity-30 hover:border-[#C9A86A] bg-white shadow-sm">→</button></div>}
            <div className="text-center text-xs tracking-wide text-[#8A8178] mt-3">Показано {(currentPage-1)*PAGE_SIZE+1}–{Math.min(currentPage*PAGE_SIZE, filteredProducts.length)} из {filteredProducts.length}</div>
          </>
        )}
      </div>

      <section id="contacts" className="pt-12 pb-12 bg-[#FDFBF7] scroll-mt-20 border-t border-[#E8D5B7]/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#E8D5B7]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-10"><h2 className="font-display text-3xl sm:text-4xl text-[#122620] mt-2 tracking-[-0.02em]">Свяжитесь <span className="italic font-light" style={{fontFamily:'var(--font-cormorant)'}}>со мной</span></h2><div className="w-12 h-[2px] bg-[#C9A86A] mx-auto mt-4 rounded-full" /><p className="text-[#6B6B6B] mt-4 max-w-xl mx-auto text-[14px] leading-relaxed">Помогу с выбором, расскажу про уход и подберу растения под ваш сад. Отвечаю лично.</p><p className="text-[#8A8178] mt-1 text-xs tracking-wide">Доставка Европочтой и Белпочтой • Крупномеры — самовывоз (г. Горки)</p></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <a href="tel:+375298425952" className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group no-underline hover:border-[#C9A86A]/30 transition-all">
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:'linear-gradient(135deg, #2E7D32, #4CAF50)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11.36 11.36 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.59 1 1 0 01-.25 1l-2.2 2.2z"/></svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Телефон</span><span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>
            <a href="https://t.me/+375298425952" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group hover:border-[#C9A86A]/30 transition-all">
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:'linear-gradient(135deg, #0088cc, #00a8e6)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Telegram</span><span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>
            <a href="https://viber.click/375298425952" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group hover:border-[#C9A86A]/30 transition-all">
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:'linear-gradient(135deg, #7360f2, #8b7cf7)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12.072 0C5.378 0 .029 4.317.029 10.639c0 3.139 1.382 5.954 3.571 7.873V24l6.97-3.243c.678.133 1.377.205 2.093.205 6.694 0 12.043-4.317 12.043-10.64C24.214 4.317 18.766 0 12.072 0zm6.047 14.572c-.273.773-1.396 1.418-1.956 1.512-.535.09-1.008.382-3.34-.703-2.82-1.254-4.617-4.5-4.757-4.71-.14-.21-1.134-1.512-1.134-2.883 0-1.371.723-2.04.98-2.32.258-.28.562-.35.749-.35.187 0 .374 0 .535.007.187.007.437-.07.686.522.257.604.875 2.098.952 2.25.077.154.128.332.025.536-.102.205-.154.332-.307.51-.153.176-.322.37-.46.497-.153.14-.312.293-.203.574.108.28.507 1.365 1.09 2.21.748 1.072 1.38 1.44 1.585 1.594.204.153.332.128.454-.077.12-.205.535-.624.678-.84.145-.215.29-.18.485-.107.196.074 1.254.59 1.47.698.215.107.358.16.41.25.05.09.05.52-.223 1.293z"/></svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Viber</span><span className="text-xs text-[#6B7280]">+375 (29) 842-59-52</span>
            </a>
            <a href="https://www.instagram.com/tereshko3584/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-3 bg-[#F5F5F0] rounded-2xl px-4 py-6 border border-[#E8F0EA] group hover:border-[#C9A86A]/30 transition-all">
              <div className="w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{background:'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'}}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </div>
              <span className="font-semibold text-[#1A3326] text-sm">Instagram</span><span className="text-xs text-[#6B7280]">@tereshko3584</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#122620] text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A86A]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_0.8fr_1.2fr] gap-8">
            <div><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#C9A86A]">✦</div><span className="font-display text-lg"><span className="text-white">Зелёная</span> <span className="text-[#C9A86A]">мастерская</span></span></div><p className="text-white/60 text-sm mt-3 leading-relaxed">Зеленая мастерская в Горках. Авторские ниваки, хвойные и гортензии — с любовью к каждому растению.</p><p className="text-white/40 text-xs mt-3">Доставка: Европочта, Белпочта • Самовывоз: г. Горки</p></div>
            <div><h4 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#C9A86A] mb-3">Контакты</h4><ul className="space-y-1.5 text-sm text-white/70"><li>Людмила Леонидовна</li><li className="text-white font-medium">+375 (29) 842-59-52</li><li className="text-white/50 text-xs">@tereshko3584 • Instagram</li></ul></div>
            <div className="text-sm text-white/50 md:text-right md:ml-auto"><p>Терешко Людмила Леонидовна</p><p className="mt-1">УНП МА1500564</p><p className="mt-1 text-xs text-white/30">Самозанятая • Налог на проф. доход</p><p className="mt-4 text-xs tracking-wide text-[#C9A86A]/70">© {new Date().getFullYear()} Зелёная мастерская • Горки</p></div>
          </div>
        </div>
      </footer>
    </>
  );
}
