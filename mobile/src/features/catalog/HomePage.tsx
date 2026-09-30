import { useEffect, useState, useMemo } from 'react';
import { IonIcon, type RefresherEventDetail } from '@ionic/react';
import { 
  searchOutline, 
  closeOutline, 
  addOutline, 
  removeOutline, 
  cartOutline, 
  arrowForwardOutline, 
  newspaperOutline,
  chevronForwardOutline,
  sparklesOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import type { Product } from '../../domain/types';
import { 
  BrandBar, 
  CategoryModal, 
  ErrorText, 
  ProductCardSkeleton, 
  SafeImage,
  Screen 
} from '../../shared/ui';

type FilterCategory = 'all' | 'sak' | 'curah' | 'readymix';

const CATEGORY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'sak', label: 'Semen Sak' },
  { id: 'curah', label: 'Semen Curah' },
  { id: 'readymix', label: 'Ready Mix' },
];

const NEWS_SLIDES = [
  {
    id: 1,
    tag: 'Berita Tonasa',
    title: 'Komitmen Mutu & Beton Ramah Lingkungan SIG',
    desc: 'Produk Semen Tonasa memenuhi standar SNI mutu tinggi untuk ketahanan konstruksi optimal.',
    date: 'Update Terkini',
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 2,
    tag: 'Layanan Proyek',
    title: 'Distribusi Cepat Batching Plant & Armada Mixer',
    desc: 'Pengiriman langsung dari plant terdekat dengan penjadwalan terpadu & uji slump akurat.',
    date: 'Layanan Resmi',
    image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=500',
  },
  {
    id: 3,
    tag: 'Standar Mutu',
    title: 'Uji Kuat Tekan Laboratorium Berkala',
    desc: 'Setiap batch produksi dipantau ketat untuk menjamin kekuatan struktural bangunan.',
    date: 'Sertifikasi SNI',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=500',
  },
];

const PRODUCT_IMAGES: Record<string, string> = {
  'ST-BULK-300T': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=300',
  'ST-OPC-50KG': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=300',
  'ST-PCC-50KG': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=300',
  'RM-K175': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=300',
  'RM-K225': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=300',
  'RM-K300': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=300',
  'RM-K350': 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=300',
  'RM-K500': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=300',
};

function getProductImage(product: Product): string {
  if (PRODUCT_IMAGES[product.code]) return PRODUCT_IMAGES[product.code];
  if (product.category === 'readymix') {
    return 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=300';
  }
  if (product.code.toLowerCase().includes('bulk') || product.name.toLowerCase().includes('curah')) {
    return 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=300';
  }
  return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=300';
}

export default function HomePage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingConflictProduct, setPendingConflictProduct] = useState<Product | null>(null);

  // Auto-rotate news slide every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % NEWS_SLIDES.length);
    }, 4500);
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchesCat = true;
      if (activeCategory === 'sak') {
        matchesCat = p.category === 'cement' && !p.code.toLowerCase().includes('bulk') && !p.name.toLowerCase().includes('curah');
      } else if (activeCategory === 'curah') {
        matchesCat = p.category === 'cement' && (p.code.toLowerCase().includes('bulk') || p.name.toLowerCase().includes('curah'));
      } else if (activeCategory === 'readymix') {
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
  }, [products, activeCategory, searchQuery]);

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

  const activeNews = NEWS_SLIDES[currentSlide];

  return (
    <Screen
      onRefresh={handlePullRefresh}
      header={(
        <BrandBar
          title="Katalog Material"
          cartCount={cart.count}
        />
      )}
    >
      <div className="space-y-3 pb-24">
        
        {/* SIMPLE SEARCH BAR */}
        <div className="bg-white px-4 pt-3 pb-2 border-b border-slate-100">
          <div className="relative">
            <IonIcon icon={searchOutline} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none" />
            <input 
              type="text" 
              placeholder="Cari semen, ready mix, kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-xs pl-9 pr-8 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c1d37]/15 border border-transparent transition"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <IonIcon icon={closeOutline} className="text-sm" />
              </button>
            )}
          </div>
        </div>

        {/* BERITA & INFORMASI SLIDER (Clean Carousel) */}
        <div className="px-4 pt-1">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1d37] via-[#162e55] to-[#0c1d37] text-white shadow-sm border border-slate-200/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNews.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="relative p-4 flex gap-3 items-center min-h-[105px]"
              >
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="bg-[#ea580c] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wide">
                      {activeNews.tag}
                    </span>
                    <span className="text-[10px] text-slate-300 font-medium">· {activeNews.date}</span>
                  </div>
                  <h3 className="font-bold text-xs leading-snug text-white line-clamp-1">
                    {activeNews.title}
                  </h3>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                    {activeNews.desc}
                  </p>
                </div>

                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20 relative shadow-sm">
                  <SafeImage 
                    src={activeNews.image} 
                    alt={activeNews.title} 
                    type="news"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="flex justify-center items-center gap-1.5 pb-2.5">
              {NEWS_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentSlide ? 'w-5 bg-[#ea580c]' : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CATEGORY TABS (Clean Pill Switcher) */}
        <div className="px-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORY_TABS.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#0c1d37] text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRODUCT LIST (Simple & Clean) */}
        <div className="px-4 space-y-2.5">
          <ErrorText>{error}</ErrorText>

          {loading ? (
            <div className="space-y-2.5">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory + searchQuery}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5"
              >
                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80">
                    <p className="text-xs text-slate-500 font-medium">Tidak ada produk material yang sesuai.</p>
                  </div>
                ) : (
                  filteredProducts.map((p, index) => {
                    const cartItem = cart.lines.find((line) => line.product.uuid === p.uuid);
                    const qtyInCart = cartItem ? cartItem.quantity : 0;
                    const imageSrc = getProductImage(p);

                    return (
                      <motion.div
                        key={p.uuid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.03, 0.2) }}
                        onClick={() => navigate(`/product/${p.uuid}`)}
                        className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs hover:border-[#0c1d37]/30 transition-all flex flex-col justify-between cursor-pointer"
                      >
                        {/* Top: Thumbnail & Basic Info */}
                        <div className="flex gap-3 items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                            <SafeImage 
                              src={imageSrc} 
                              alt={p.name} 
                              type={p.category}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-semibold text-slate-400">{p.code}</span>
                              {p.tag && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <h2 className="font-bold text-[#0c1d37] text-xs leading-snug truncate mt-0.5">
                              {p.name}
                            </h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Min. order {formatQty(p.min_order)} {p.unit}
                            </p>
                          </div>
                        </div>

                        {/* Bottom: Price & Quick Action */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-extrabold text-[#d91424]">
                              {formatRupiah(p.base_price)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">/{p.unit}</span>
                          </div>

                          {qtyInCart === 0 ? (
                            <button 
                              type="button"
                              onClick={(e) => handleQuickAdd(p, e)}
                              className="bg-[#0c1d37] hover:bg-[#162e55] text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              <IonIcon icon={addOutline} className="text-xs" />
                              <span>Pesan</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
                              <button 
                                type="button"
                                onClick={(e) => handleStepQuantity(p, -1, e)}
                                className="size-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 active:scale-90 cursor-pointer border border-slate-200"
                                aria-label="Kurangi jumlah"
                              >
                                <IonIcon icon={removeOutline} className="text-xs" />
                              </button>
                              <span className="text-xs font-bold w-5 text-center text-[#0c1d37] font-mono">{qtyInCart}</span>
                              <button 
                                type="button"
                                onClick={(e) => handleStepQuantity(p, 1, e)}
                                className="size-6 rounded-lg bg-[#0c1d37] text-white flex items-center justify-center active:scale-90 cursor-pointer shadow-xs"
                                aria-label="Tambah jumlah"
                              >
                                <IonIcon icon={addOutline} className="text-xs" />
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* FLOATING CART SUMMARY BAR */}
      {cart.count > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40 pointer-events-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="bg-[#0c1d37] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700/80 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#d91424] p-2 rounded-xl text-white relative">
                <IonIcon icon={cartOutline} className="text-lg" />
                <span className="absolute -top-1 -right-1 bg-[#ea580c] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
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
