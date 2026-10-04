import { useEffect, useState, useMemo } from 'react';
import { IonIcon, type RefresherEventDetail } from '@ionic/react';
import { 
  searchOutline, 
  closeOutline, 
  addOutline, 
  removeOutline, 
  cartOutline, 
  arrowForwardOutline, 
  notificationsOutline,
  flameOutline,
  starOutline,
  sparklesOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import type { Product } from '../../domain/types';
import { 
  CategoryModal, 
  ErrorText, 
  ProductCardSkeleton, 
  SafeImage,
  Screen 
} from '../../shared/ui';
import PkmLogo from '../../shared/ui/PkmLogo';

type CategoryFilter = 'all' | 'cement' | 'mortar' | 'readymix' | 'tools' | 'promo';

const QUICK_CATEGORIES: { id: CategoryFilter; label: string; iconType: string }[] = [
  { id: 'cement', label: 'Semen', iconType: 'cement' },
  { id: 'mortar', label: 'Beton Instan', iconType: 'mortar' },
  { id: 'readymix', label: 'Ready Mix', iconType: 'readymix' },
  { id: 'tools', label: 'Aksesoris & Peralatan', iconType: 'tools' },
  { id: 'promo', label: 'Promo', iconType: 'promo' },
];

const HERO_SLIDES = [
  {
    id: 1,
    badge: '★ Produk Unggulan',
    title: 'Ready Mix Untuk Proyek Anda',
    desc: 'Kualitas terjamin, pasokan tepat waktu, untuk hasil pembangunan terbaik.',
    cta: 'Lihat Produk',
    categoryTarget: 'readymix' as CategoryFilter,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 2,
    badge: '★ Semen Standar SNI',
    title: 'Semen Portland Kokoh & Rekat',
    desc: 'Daya ikat kuat untuk pondasi, plesteran, dan konstruksi struktural tahan lama.',
    cta: 'Pesan Semen',
    categoryTarget: 'cement' as CategoryFilter,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 3,
    badge: '★ Layanan Armada Batching Plant',
    title: 'Distribusi Cepat & Slump Akurat',
    desc: 'Didukung armada mixer prima siap melayani pengecoran proyek Anda.',
    cta: 'Cek Armada',
    categoryTarget: 'readymix' as CategoryFilter,
    image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=600',
  },
];

const PRODUCT_IMAGES: Record<string, string> = {
  'ST-OPC-50KG': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400',
  'ST-PCC-50KG': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400',
  'ST-BULK-300T': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=400',
  'RM-K175': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=400',
  'RM-K225': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400',
  'RM-K300': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=400',
  'RM-K350': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=400',
  'RM-K500': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=400',
};

function getProductImage(product: Product): string {
  if (PRODUCT_IMAGES[product.code]) return PRODUCT_IMAGES[product.code];
  if (product.category === 'readymix') {
    return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=400';
  }
  if (product.code.toLowerCase().includes('bulk') || product.name.toLowerCase().includes('curah')) {
    return 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=400';
  }
  return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400';
}

function CategoryIcon({ type }: { type: string }) {
  switch (type) {
    case 'cement':
      return (
        <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
          <path d="M19 5h-3V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM10 4h4v1h-4V4zm9 16H5V7h3v2h8V7h3v13z" />
          <path d="M8 12h8v2H8zm0 3h5v2H8z" />
        </svg>
      );
    case 'mortar':
      return (
        <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
          <path d="M21.71 8.29l-6-6a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l6 6a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM12 17.59L6.41 12 14 4.41 19.59 10 12 17.59z" />
          <path d="M4 19h16v2H4z" />
        </svg>
      );
    case 'readymix':
      return (
        <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM17 12V9.5h2.5l2 2.5H17z" />
          <path d="M10 6l4 3-4 3z" />
        </svg>
      );
    case 'tools':
      return (
        <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
      );
    case 'promo':
    default:
      return (
        <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden="true">
          <path d="M7.5 11C9.43 11 11 9.43 11 7.5S9.43 4 7.5 4 4 5.57 4 7.5 5.57 11 7.5 11zm0-5C8.33 6 9 6.67 9 7.5S8.33 9 7.5 9 6 8.33 6 7.5 6.67 6 7.5 6zm9 7c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5zm0 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM6.41 19L19 6.41 17.59 5 5 17.59 6.41 19z" />
        </svg>
      );
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingConflictProduct, setPendingConflictProduct] = useState<Product | null>(null);

  // Auto-rotate hero slider every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const loadAllProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const [resCement, resReadymix] = await Promise.all([
        api.products('cement'),
        api.products('readymix'),
      ]);
      setProducts([...resCement.data, ...resReadymix.data]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllProducts();
  }, []);

  const handlePullRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      const [resCement, resReadymix] = await Promise.all([
        api.products('cement'),
        api.products('readymix'),
      ]);
      setProducts([...resCement.data, ...resReadymix.data]);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memperbarui data.');
    } finally {
      event.detail.complete();
    }
  };

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cart.conflicts(product)) {
      setPendingConflictProduct(product);
      return;
    }
    cart.add(product, product.min_order);
  };

  const handleStepQuantity = (product: Product, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = cart.lines.find((line) => line.product.uuid === product.uuid);
    if (!existing) return;

    if (delta > 0) {
      const next = quantityAfterStep(existing.quantity, 1, product.min_order);
      cart.setQuantity(product.uuid, next);
    } else {
      if (existing.quantity <= product.min_order) {
        cart.remove(product.uuid);
      } else {
        const next = quantityAfterStep(existing.quantity, -1, product.min_order);
        cart.setQuantity(product.uuid, next);
      }
    }
  };

  const totalCartPrice = useMemo(() => {
    return cart.lines.reduce((sum, line) => sum + line.product.base_price * line.quantity, 0);
  }, [cart.lines]);

  // Filtered products based on search or category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchesCat = true;
      if (selectedCategory === 'cement') {
        matchesCat = p.category === 'cement' && !p.code.toLowerCase().includes('bulk') && !p.name.toLowerCase().includes('curah');
      } else if (selectedCategory === 'mortar') {
        matchesCat = p.category === 'cement' && (p.code.toLowerCase().includes('bulk') || p.name.toLowerCase().includes('curah') || p.name.toLowerCase().includes('mortar'));
      } else if (selectedCategory === 'readymix') {
        matchesCat = p.category === 'readymix';
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Featured Products (⭐ Produk Unggulan)
  const featuredProducts = useMemo(() => {
    return products.slice(0, 4);
  }, [products]);

  // Best Seller Products (🔥 Produk Terlaris)
  const bestSellerProducts = useMemo(() => {
    return products.length > 4 ? products.slice(2, 7) : products;
  }, [products]);

  const activeHero = HERO_SLIDES[currentSlide];
  const isFilteredMode = selectedCategory !== 'all' || searchQuery.trim().length > 0;

  return (
    <Screen onRefresh={handlePullRefresh}>
      <div className="bg-slate-50 min-h-full pb-28">
        
        {/* ========================================================================= */}
        {/* 1. TOP APP BAR: Brand Logo + Notification Icon                            */}
        {/* ========================================================================= */}
        <div className="bg-white px-4 pt-3.5 pb-2.5 flex items-center justify-between sticky top-0 z-30 border-b border-slate-100/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <PkmLogo className="size-7 drop-shadow-xs" />
              <div className="ml-1.5 flex flex-col justify-center">
                <div className="flex items-center gap-1 leading-none">
                  <span className="font-black text-sm tracking-tight text-[#0c1d37]">PRIMA</span>
                  <span className="bg-[#d91424] text-white text-[9px] font-black italic px-1.5 py-0.5 rounded tracking-wider">
                    SALES PRO
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                  PT. PRIMA KARYA MANUNGGAL
                </span>
              </div>
            </div>
          </div>

          {/* Notification Bell with Red Badge */}
          <button 
            type="button"
            onClick={() => navigate('/tabs/orders')}
            className="relative p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Notifikasi"
          >
            <IonIcon icon={notificationsOutline} className="text-2xl" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#d91424] text-[9px] font-extrabold text-white shadow-xs">
              2
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. SEARCH BAR: Clean Rounded Input Field                                  */}
        {/* ========================================================================= */}
        <div className="bg-white px-4 pt-1 pb-3.5 border-b border-slate-100">
          <div className="relative flex items-center">
            <IonIcon 
              icon={searchOutline} 
              className="text-slate-400 absolute left-3.5 text-lg pointer-events-none" 
            />
            <input 
              type="text" 
              placeholder="Cari produk, kategori, atau kebutuhan Anda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 text-xs pl-10 pr-9 py-3 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#d91424]/20 focus:border-[#d91424]/40 border border-slate-200/60 transition-all shadow-inner"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <IonIcon icon={closeOutline} className="text-base" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4 pt-3">
          
          <ErrorText>{error}</ErrorText>

          {/* ========================================================================= */}
          {/* 3. KATEGORI SECTION: Clean Horizontal Category Icons Grid                 */}
          {/* ========================================================================= */}
          {!isFilteredMode && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-extrabold text-slate-900">Kategori</h2>
                <button 
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={arrowForwardOutline} className="text-xs" />
                </button>
              </div>

              {/* 5 Quick Category Cards */}
              <div className="grid grid-cols-5 gap-2">
                {QUICK_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                      className="flex flex-col items-center text-center group cursor-pointer"
                    >
                      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#d91424] text-white shadow-md scale-105 ring-2 ring-[#d91424]/30' 
                          : 'bg-red-50/80 text-[#d91424] border border-red-100 hover:bg-red-100/90 active:scale-95'
                      }`}>
                        <CategoryIcon type={cat.iconType} />
                      </div>
                      <span className={`text-[10px] font-bold mt-1.5 line-clamp-2 leading-tight ${
                        isSelected ? 'text-[#d91424]' : 'text-slate-700'
                      }`}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. HERO BANNER CAROUSEL: High Impact Promo Card                           */}
          {/* ========================================================================= */}
          {!isFilteredMode && (
            <div className="px-4 pt-1">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md border border-slate-200/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHero.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative p-4 sm:p-5 flex items-center justify-between min-h-[155px] gap-3"
                  >
                    {/* Background Visual Overlay */}
                    <div className="absolute inset-0 z-0 opacity-25">
                      <img 
                        src={activeHero.image} 
                        alt="Hero background" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
                    </div>

                    {/* Text & Action CTA */}
                    <div className="relative z-10 flex-1 min-w-0 pr-2">
                      <div className="inline-flex items-center gap-1 bg-[#d91424] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs mb-2">
                        <IonIcon icon={starOutline} className="text-[10px]" />
                        <span>{activeHero.badge}</span>
                      </div>
                      
                      <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                        {activeHero.title}
                      </h3>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {activeHero.desc}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedCategory(activeHero.categoryTarget)}
                        className="mt-3 inline-flex items-center gap-1 bg-[#d91424] hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <span>{activeHero.cta}</span>
                        <IonIcon icon={arrowForwardOutline} className="text-xs" />
                      </button>
                    </div>

                    {/* Right Hero Graphic Thumbnail */}
                    <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border-2 border-white/20 shadow-lg bg-slate-800">
                      <SafeImage 
                        src={activeHero.image} 
                        alt={activeHero.title} 
                        type="readymix"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Dot Pagination Indicators */}
                <div className="relative z-10 flex justify-center items-center gap-1.5 pb-2.5">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentSlide ? 'w-5 bg-[#d91424]' : 'w-1.5 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. FILTER CHIP INDICATOR (If user searched or selected category)          */}
          {/* ========================================================================= */}
          {isFilteredMode && (
            <div className="px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  Hasil ({filteredProducts.length} Produk)
                </span>
                {selectedCategory !== 'all' && (
                  <span className="bg-[#d91424]/10 text-[#d91424] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {QUICK_CATEGORIES.find(c => c.id === selectedCategory)?.label || selectedCategory}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="px-4 space-y-3">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. SEARCH / FILTER RESULT VIEW (Grid View)                                */}
          {/* ========================================================================= */}
          {!loading && isFilteredMode && (
            <div className="px-4">
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80">
                  <p className="text-xs text-slate-500 font-medium">Tidak ada produk material yang sesuai kriteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredProducts.map((p) => {
                    const cartItem = cart.lines.find((line) => line.product.uuid === p.uuid);
                    const qtyInCart = cartItem ? cartItem.quantity : 0;
                    const imageSrc = getProductImage(p);

                    return (
                      <div
                        key={p.uuid}
                        onClick={() => navigate(`/product/${p.uuid}`)}
                        className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#d91424]/40 transition-all"
                      >
                        <div>
                          <div className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                            <SafeImage 
                              src={imageSrc} 
                              alt={p.name} 
                              type={p.category}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <h3 className="font-bold text-slate-900 text-xs leading-snug mt-2 line-clamp-2 min-h-[32px]">
                            {p.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatQty(p.min_order)} {p.unit}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-0.5 mb-2">
                            <span className="text-xs font-black text-[#d91424]">
                              {formatRupiah(p.base_price)}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">/{p.unit}</span>
                          </div>

                          {qtyInCart === 0 ? (
                            <button
                              type="button"
                              onClick={(e) => handleQuickAdd(p, e)}
                              className="w-full bg-[#d91424] hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              <IonIcon icon={cartOutline} className="text-xs" />
                              <span>Tambah</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                              <button 
                                type="button"
                                onClick={(e) => handleStepQuantity(p, -1, e)}
                                className="size-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer border border-slate-200"
                              >
                                <IonIcon icon={removeOutline} className="text-xs" />
                              </button>
                              <span className="text-xs font-bold text-slate-900 font-mono">{qtyInCart}</span>
                              <button 
                                type="button"
                                onClick={(e) => handleStepQuantity(p, 1, e)}
                                className="size-6 rounded-lg bg-[#d91424] text-white flex items-center justify-center active:scale-90 cursor-pointer shadow-xs"
                              >
                                <IonIcon icon={addOutline} className="text-xs" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 7. ⭐ PRODUK UNGGULAN (Horizontal Scrollable Cards)                        */}
          {/* ========================================================================= */}
          {!loading && !isFilteredMode && (
            <div className="space-y-2.5">
              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base text-[#d91424]">★</span>
                  <h2 className="text-sm font-extrabold text-slate-900">Produk Unggulan</h2>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedCategory('cement')}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={chevronForwardOutline} className="text-xs" />
                </button>
              </div>

              {/* Horizontal Scroll Product List */}
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                {featuredProducts.map((p) => {
                  const cartItem = cart.lines.find((line) => line.product.uuid === p.uuid);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;
                  const imageSrc = getProductImage(p);

                  return (
                    <div
                      key={p.uuid}
                      onClick={() => navigate(`/product/${p.uuid}`)}
                      className="w-[155px] shrink-0 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#d91424]/40 transition-all"
                    >
                      <div>
                        <div className="w-full h-28 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                          <SafeImage 
                            src={imageSrc} 
                            alt={p.name} 
                            type={p.category}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs leading-snug mt-2 line-clamp-2 min-h-[32px]">
                          {p.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatQty(p.min_order)} {p.unit}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-0.5 mb-2">
                          <span className="text-xs font-black text-[#d91424]">
                            {formatRupiah(p.base_price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">/{p.unit}</span>
                        </div>

                        {qtyInCart === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(p, e)}
                            className="w-full bg-[#d91424] hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            <IonIcon icon={cartOutline} className="text-xs" />
                            <span>Tambah</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={(e) => handleStepQuantity(p, -1, e)}
                              className="size-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer border border-slate-200"
                            >
                              <IonIcon icon={removeOutline} className="text-xs" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 font-mono">{qtyInCart}</span>
                            <button 
                              type="button"
                              onClick={(e) => handleStepQuantity(p, 1, e)}
                              className="size-6 rounded-lg bg-[#d91424] text-white flex items-center justify-center active:scale-90 cursor-pointer shadow-xs"
                            >
                              <IonIcon icon={addOutline} className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 8. 🔥 PRODUK TERLARIS (Horizontal Scrollable Cards)                       */}
          {/* ========================================================================= */}
          {!loading && !isFilteredMode && (
            <div className="space-y-2.5 pt-1">
              <div className="px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base text-[#ea580c]">🔥</span>
                  <h2 className="text-sm font-extrabold text-slate-900">Produk Terlaris</h2>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedCategory('readymix')}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={chevronForwardOutline} className="text-xs" />
                </button>
              </div>

              {/* Horizontal Scroll Product List */}
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
                {bestSellerProducts.map((p) => {
                  const cartItem = cart.lines.find((line) => line.product.uuid === p.uuid);
                  const qtyInCart = cartItem ? cartItem.quantity : 0;
                  const imageSrc = getProductImage(p);

                  return (
                    <div
                      key={p.uuid}
                      onClick={() => navigate(`/product/${p.uuid}`)}
                      className="w-[155px] shrink-0 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#d91424]/40 transition-all"
                    >
                      <div>
                        <div className="w-full h-28 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 p-2">
                          <SafeImage 
                            src={imageSrc} 
                            alt={p.name} 
                            type={p.category}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h3 className="font-bold text-slate-900 text-xs leading-snug mt-2 line-clamp-2 min-h-[32px]">
                          {p.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatQty(p.min_order)} {p.unit}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline gap-0.5 mb-2">
                          <span className="text-xs font-black text-[#d91424]">
                            {formatRupiah(p.base_price)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">/{p.unit}</span>
                        </div>

                        {qtyInCart === 0 ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(p, e)}
                            className="w-full bg-[#d91424] hover:bg-red-700 text-white text-xs font-bold py-1.5 rounded-xl flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            <IonIcon icon={cartOutline} className="text-xs" />
                            <span>Tambah</span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              type="button"
                              onClick={(e) => handleStepQuantity(p, -1, e)}
                              className="size-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer border border-slate-200"
                            >
                              <IonIcon icon={removeOutline} className="text-xs" />
                            </button>
                            <span className="text-xs font-bold text-slate-900 font-mono">{qtyInCart}</span>
                            <button 
                              type="button"
                              onClick={(e) => handleStepQuantity(p, 1, e)}
                              className="size-6 rounded-lg bg-[#d91424] text-white flex items-center justify-center active:scale-90 cursor-pointer shadow-xs"
                            >
                              <IonIcon icon={addOutline} className="text-xs" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 9. BOTTOM PROMO BANNER (Diskon Khusus Proyek)                              */}
          {/* ========================================================================= */}
          {!isFilteredMode && (
            <div className="px-4 pt-2">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#d91424] via-[#b91c1c] to-[#991b1b] text-white p-4 shadow-md flex items-center justify-between gap-3">
                <div className="relative z-10 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-white/20 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-xs">
                      % Promo Spesial
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    Diskon Hingga 10%
                  </h3>
                  <p className="text-[10px] text-white/80 mt-0.5 leading-snug">
                    Untuk pembelian Semen & Ready Mix
                  </p>
                  <button 
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="mt-2.5 inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-[#d91424] text-[11px] font-black px-3 py-1 rounded-full shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <span>Lihat Promo</span>
                    <IonIcon icon={arrowForwardOutline} className="text-[11px]" />
                  </button>
                </div>

                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/30 relative shadow-md bg-white/10">
                  <img 
                    src="https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=300"
                    alt="Promo Material" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 10. FLOATING CART SUMMARY BAR                                             */}
      {/* ========================================================================= */}
      {cart.count > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-40 pointer-events-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-[#0c1d37] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700/80 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#d91424] p-2 rounded-xl text-white relative">
                <IonIcon icon={cartOutline} className="text-lg" />
                <span className="absolute -top-1 -right-1 bg-[#ea580c] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {cart.count}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-300 block">Total Est. Material</span>
                <p className="text-xs sm:text-sm font-extrabold text-white">
                  {formatRupiah(totalCartPrice)}
                </p>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => navigate('/cart')}
              className="bg-[#d91424] hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition active:scale-95 cursor-pointer"
            >
              <span>Detail</span>
              <IonIcon icon={arrowForwardOutline} className="text-sm" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Category Conflict Modal */}
      {pendingConflictProduct && cart.category && (
        <CategoryModal
          categoryLabel={categoryLabel(cart.category)}
          onClose={() => setPendingConflictProduct(null)}
          onReplace={() => {
            cart.replace(pendingConflictProduct, pendingConflictProduct.min_order);
            setPendingConflictProduct(null);
          }}
        />
      )}
    </Screen>
  );
}
