import { useEffect, useState, useMemo, useCallback } from 'react';
import { IonIcon, useIonViewWillEnter, type RefresherEventDetail } from '@ionic/react';
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
  chevronForwardOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import type { HomeBanner, Product } from '../../domain/types';
import { 
  CategoryModal, 
  ErrorText, 
  ProductCardSkeleton, 
  SafeImage,
  Screen 
} from '../../shared/ui';
import PkmLogo from '../../shared/ui/PkmLogo';

import { getProductImage, resolveStorageUrl } from '../../domain/product';

type CatalogChip = { id: string; label: string };

export function CategoryGlyph({ type, className = 'size-7' }: { type: string; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (type === 'readymix') {
    return (
      <svg {...common}>
        <path d="M3 15.5h2.2" />
        <path d="M13.2 15.5H15" />
        <circle cx="7.2" cy="16.4" r="1.7" />
        <circle cx="17.2" cy="16.4" r="1.7" />
        <path d="M4.2 15.5V11h6.2l1.4 4.5" />
        <path d="M11.8 11.2H15l2.6 3v1.3" />
        <path d="M8.9 15.5h6.6" />
        <path d="M14.2 6.4c1.5-.7 3.3.2 3.6 1.8.2 1.2-.5 2.2-1.6 2.6" />
        <path d="M13.4 8.2h3.2" />
      </svg>
    );
  }

  if (type === 'cement') {
    return (
      <svg {...common}>
        <path d="M8 7.5h8l1 2.2v8.6a1.8 1.8 0 0 1-1.8 1.8H8.8A1.8 1.8 0 0 1 7 18.3V9.7l1-2.2z" />
        <path d="M9.2 7.5V6a1.4 1.4 0 0 1 1.4-1.4h2.8A1.4 1.4 0 0 1 14.8 6v1.5" />
        <path d="M9.2 12.2h5.6" />
      </svg>
    );
  }

  if (type === 'mortar') {
    return (
      <svg {...common}>
        <path d="M14.2 3.8 20 9.6l-7.2 7.2L7 11z" />
        <path d="M7 11 3.6 19.2" />
        <path d="M3 20.4h4.2" />
      </svg>
    );
  }

  if (type === 'grout') {
    return (
      <svg {...common}>
        <path d="M8 9.2h8l-.9 9.4a1.6 1.6 0 0 1-1.6 1.4H10.5a1.6 1.6 0 0 1-1.6-1.4L8 9.2z" />
        <path d="M7.2 9.2h9.6" />
        <path d="M12 6.4v2.8" />
        <path d="M12 3.6c.9.7.9 1.5 0 2.4" />
      </svg>
    );
  }

  if (type === 'additive') {
    return (
      <svg {...common}>
        <path d="M9 3.2h6" />
        <path d="M10 3.2v4.6L6.8 15.8A3.1 3.1 0 0 0 9.6 20.6h4.8a3.1 3.1 0 0 0 2.8-4.8L14 7.8V3.2" />
        <path d="M8.4 14h7.2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="m12 3 8 4.5L12 12 4 7.5 12 3z" />
      <path d="m4 12 8 4.5L20 12" />
      <path d="m4 16.5 8 4.5 8-4.5" />
    </svg>
  );
}

function ShowcaseCard({
  product,
  qtyInCart,
  onOpen,
  onAdd,
  onStep,
  layout = 'strip',
}: {
  product: Product;
  qtyInCart: number;
  onOpen: () => void;
  onAdd: (event: React.MouseEvent) => void;
  onStep: (delta: number, event: React.MouseEvent) => void;
  layout?: 'strip' | 'grid';
}) {
  return (
    <div
      onClick={onOpen}
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all hover:border-[#d91424]/40 hover:shadow-md ${
        layout === 'grid' ? 'w-full' : 'w-[162px] shrink-0'
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <SafeImage
          src={getProductImage(product)}
          alt={product.name}
          type={product.category}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {product.is_featured ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#d91424] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              ★ Unggulan
            </span>
          ) : product.is_best_seller ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-[#ea580c] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
              🔥 Terlaris
            </span>
          ) : <span />}

          <span className="rounded-md bg-black/45 backdrop-blur-xs px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-xs">
            {product.category === 'readymix' ? 'Beton' : 'Semen'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-snug text-slate-900 group-hover:text-[#d91424] transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            Min. {formatQty(product.min_order)} {product.unit}
          </p>
        </div>
        <div className="mt-2.5 border-t border-slate-100 pt-2">
          <div className="mb-2 flex items-baseline gap-0.5">
            <span className="text-xs font-black text-[#d91424]">{formatRupiah(product.base_price)}</span>
            <span className="text-[9px] font-medium text-slate-400">/{product.unit}</span>
          </div>
          {qtyInCart === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#d91424] py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 active:scale-95"
            >
              <IonIcon icon={cartOutline} className="text-xs" />
              <span>Tambah</span>
            </button>
          ) : (
            <div
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 p-1"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={(event) => onStep(-1, event)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-xs active:scale-90"
              >
                <IonIcon icon={removeOutline} className="text-xs" />
              </button>
              <span className="font-mono text-xs font-bold text-slate-900">{qtyInCart}</span>
              <button
                type="button"
                onClick={(event) => onStep(1, event)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-lg bg-[#d91424] text-white shadow-xs active:scale-90"
              >
                <IonIcon icon={addOutline} className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cart = useCart();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') ?? 'all');
  const [quickCategories, setQuickCategories] = useState<CatalogChip[]>([]);
  const [heroSlides, setHeroSlides] = useState<HomeBanner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingConflictProduct, setPendingConflictProduct] = useState<Product | null>(null);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  const refreshActiveOrders = useCallback(async () => {
    try {
      const response = await api.orders();
      const active = (response?.data || []).filter(
        (o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
      ).length;
      setActiveOrderCount(active);
    } catch {
      setActiveOrderCount(0);
    }
  }, []);

  useIonViewWillEnter(() => {
    void refreshActiveOrders();
  });

  // Auto-rotate hero slider every 5 seconds
  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('kategori') ?? 'all');
  }, [searchParams]);

  const loadAllProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryResponse, productResponse, bannerResponse] = await Promise.all([
        api.categories(),
        api.products(),
        api.banners(),
      ]);
      setQuickCategories(categoryResponse.data.map((item) => ({ id: item.slug, label: item.name })));
      setProducts(productResponse.data);
      setHeroSlides(bannerResponse.data);
      setCurrentSlide(0);
      void refreshActiveOrders();
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
      const [categoryResponse, productResponse, bannerResponse] = await Promise.all([
        api.categories(),
        api.products(),
        api.banners(),
      ]);
      setQuickCategories(categoryResponse.data.map((item) => ({ id: item.slug, label: item.name })));
      setProducts(productResponse.data);
      setHeroSlides(bannerResponse.data);
      setError('');
      void refreshActiveOrders();
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

  const selectedCollection = searchParams.get('koleksi'); // 'unggulan' | 'terlaris' | null

  // Filtered products based on search, category, or collection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCollection === 'unggulan' && !p.is_featured) {
        return false;
      }
      if (selectedCollection === 'terlaris' && !p.is_best_seller) {
        return false;
      }

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.code.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, selectedCollection, searchQuery]);

  // Featured Products (⭐ Produk Unggulan)
  const featuredProducts = useMemo(() => {
    const fromFlag = products.filter((p) => p.is_featured);
    return fromFlag.length > 0 ? fromFlag : products.slice(0, 4);
  }, [products]);

  // Best Seller Products (🔥 Produk Terlaris)
  const bestSellerProducts = useMemo(() => {
    const fromFlag = products.filter((p) => p.is_best_seller);
    return fromFlag.length > 0 ? fromFlag : (products.length > 4 ? products.slice(2, 7) : products);
  }, [products]);

  const activeHero = heroSlides[currentSlide] ?? heroSlides[0];
  const isFilteredMode = Boolean(selectedCollection) || selectedCategory !== 'all' || searchQuery.trim().length > 0;

  return (
    <Screen onRefresh={handlePullRefresh}>
      <div className="min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-slate-50 pb-28">
        
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
            {activeOrderCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d91424] px-1 text-[9px] font-extrabold text-white shadow-xs">
                {activeOrderCount > 9 ? '9+' : activeOrderCount}
              </span>
            )}
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
        <div className="w-full min-w-0 space-y-4 pt-3">
          
          <ErrorText>{error}</ErrorText>

          {/* ========================================================================= */}
          {/* 3. KATEGORI SECTION: Clean Horizontal Category Icons Grid                 */}
          {/* ========================================================================= */}
          {!isFilteredMode && (
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between px-4">
                <h2 className="text-sm font-extrabold text-slate-900">Kategori</h2>
                <button 
                  type="button"
                  onClick={() => navigate('/tabs/categories')}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={arrowForwardOutline} className="text-xs" />
                </button>
              </div>

              <div className="flex w-full min-w-0 flex-nowrap gap-1.5 overflow-x-auto overscroll-x-contain px-4 pb-1 no-scrollbar touch-pan-x">
                {quickCategories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSearchParams({}, { replace: true });
                          return;
                        }
                        setSearchParams({ kategori: cat.id }, { replace: true });
                      }}
                      className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 ${
                        isSelected
                          ? 'border-[#d91424] bg-[#d91424] text-white'
                          : 'border-red-100 bg-red-50 text-[#d91424]'
                      }`}
                    >
                      <CategoryGlyph type={cat.id} className="size-4 shrink-0" />
                      <span className="whitespace-nowrap text-[11px] font-bold">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. HERO BANNER CAROUSEL: High Impact Promo Card                           */}
          {/* ========================================================================= */}
          {!isFilteredMode && activeHero && (
            <div className="px-4 pt-1">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md border border-slate-200/20">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHero.uuid}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      if (heroSlides.length < 2) return;
                      if (info.offset.x < -40) {
                        setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
                      } else if (info.offset.x > 40) {
                        setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
                      }
                    }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative p-4 sm:p-5 flex items-center justify-between min-h-[155px] gap-3 touch-pan-y"
                  >
                    <div className="absolute inset-0 z-0 opacity-25">
                      <img 
                        src={resolveStorageUrl(activeHero.image_url) || activeHero.image_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
                    </div>

                    <div className="relative z-10 flex-1 min-w-0 pr-2">
                      <div className="inline-flex items-center gap-1 bg-[#d91424] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs mb-2">
                        <IonIcon icon={starOutline} className="text-[10px]" />
                        <span>{activeHero.badge}</span>
                      </div>
                      
                      <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                        {activeHero.title}
                      </h3>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {activeHero.description}
                      </p>
                    </div>

                    <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border-2 border-white/20 shadow-lg bg-slate-800">
                      <SafeImage 
                        src={activeHero.image_url} 
                        alt={activeHero.title} 
                        type="readymix"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="relative z-10 flex justify-center items-center gap-1.5 pb-2.5">
                  {heroSlides.map((slide, idx) => (
                    <button
                      key={slide.uuid}
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
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-extrabold text-slate-800">
                  Hasil ({filteredProducts.length} Produk)
                </span>
                {selectedCollection === 'unggulan' && (
                  <span className="bg-amber-500/15 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>★</span> Produk Unggulan
                  </span>
                )}
                {selectedCollection === 'terlaris' && (
                  <span className="bg-rose-500/15 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>🔥</span> Produk Terlaris
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="bg-[#d91424]/10 text-[#d91424] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {quickCategories.find((item) => item.id === selectedCategory)?.label || selectedCategory}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({}, { replace: true });
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
                  {filteredProducts.map((p) => (
                    <ShowcaseCard
                      key={p.uuid}
                      layout="grid"
                      product={p}
                      qtyInCart={cart.lines.find((line) => line.product.uuid === p.uuid)?.quantity ?? 0}
                      onOpen={() => navigate(`/product/${p.uuid}`)}
                      onAdd={(event) => handleQuickAdd(p, event)}
                      onStep={(delta, event) => handleStepQuantity(p, delta, event)}
                    />
                  ))}
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
                  onClick={() => setSearchParams({ koleksi: 'unggulan' }, { replace: true })}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={chevronForwardOutline} className="text-xs" />
                </button>
              </div>

              {/* Horizontal Scroll Product List */}
              <div className="flex gap-3 overflow-x-auto px-4 pt-1 pb-3 no-scrollbar scroll-smooth">
                {featuredProducts.map((p) => (
                  <ShowcaseCard
                    key={p.uuid}
                    product={p}
                    qtyInCart={cart.lines.find((line) => line.product.uuid === p.uuid)?.quantity ?? 0}
                    onOpen={() => navigate(`/product/${p.uuid}`)}
                    onAdd={(event) => handleQuickAdd(p, event)}
                    onStep={(delta, event) => handleStepQuantity(p, delta, event)}
                  />
                ))}
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
                  onClick={() => setSearchParams({ koleksi: 'terlaris' }, { replace: true })}
                  className="text-xs font-bold text-[#d91424] hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Lihat Semua</span>
                  <IonIcon icon={chevronForwardOutline} className="text-xs" />
                </button>
              </div>

              {/* Horizontal Scroll Product List */}
              <div className="flex gap-3 overflow-x-auto px-4 pt-1 pb-3 no-scrollbar scroll-smooth">
                {bestSellerProducts.map((p) => (
                  <ShowcaseCard
                    key={p.uuid}
                    product={p}
                    qtyInCart={cart.lines.find((line) => line.product.uuid === p.uuid)?.quantity ?? 0}
                    onOpen={() => navigate(`/product/${p.uuid}`)}
                    onAdd={(event) => handleQuickAdd(p, event)}
                    onStep={(delta, event) => handleStepQuantity(p, delta, event)}
                  />
                ))}
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
