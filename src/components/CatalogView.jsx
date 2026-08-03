import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calculator, 
  Check, 
  Info, 
  Plus, 
  ShieldAlert, 
  Layers, 
  Box, 
  Truck, 
  Building,
  SlidersHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function CatalogView({ 
  products, 
  addToCart, 
  setActiveTab, 
  setCalcData 
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);
  const [customSlump, setCustomSlump] = useState('12 ± 2 cm');
  const [customFlyAsh, setCustomFlyAsh] = useState('Non-Fly Ash');

  const categories = [
    { id: 'all', label: 'Semua Produk', icon: Layers },
    { id: 'readymix', label: 'Ready Mix Beton', icon: Building },
    { id: 'material', label: 'Material Curah & Tambang', icon: Box },
    { id: 'precast', label: 'Precast & Paving', icon: Layers },
    { id: 'rental', label: 'Sewa Alat & Armada', icon: Truck },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.recommendedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tag.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Hero Banner for PT PKM */}
      <div className="relative rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white p-6 md:p-8 overflow-hidden shadow-premium border border-brand-500/20">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Building className="w-96 h-96" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Penyedia Beton & Agregat Terpercaya Sulawesi Selatan</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
            Produk Berkualitas Tinggi Dari Semen Tonasa Group
          </h2>

          <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
            Pesan Ready Mix Mutu K-100 s/d K-500, Material Pertambangan Pasir & Split, Precast Paving, hingga Sewa Pompa Beton secara real-time dengan jaminan kepastian pengiriman.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setActiveTab('calculator')}
              className="bg-amber-500 hover:bg-amber-400 text-brand-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shadow-glow transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>Buka Kalkulator Volume Beton</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveTab('tracking')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 backdrop-blur-md transition-all"
            >
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Lacak Pengiriman Aktif</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-grow">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari mutu beton (misal: K-300), material pasir, split, atau sewa armada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm font-medium text-slate-800 outline-none focus:border-brand-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Calculator Shortcut Card */}
          <button
            onClick={() => setActiveTab('calculator')}
            className="flex items-center justify-between bg-brand-50 border border-brand-200 hover:bg-brand-100/70 p-2.5 rounded-xl text-xs font-semibold text-brand-900 transition-colors flex-shrink-0"
          >
            <div className="flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-brand-600" />
              <span>Kalkulator Kubikasi</span>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-600" />
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div 
            key={product.id}
            className="bg-white rounded-2xl border border-slate-200/80 hover:border-brand-300 shadow-card hover:shadow-premium transition-all duration-200 p-5 flex flex-col justify-between group"
          >
            <div>
              {/* Product Header Badges */}
              <div className="flex items-center justify-between mb-3">
                <span className="bg-brand-50 text-brand-700 border border-brand-200 font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                  {product.code}
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  {product.tag}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-brand-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-slate-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                {product.description}
              </p>

              {/* Product Key Specifications */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 mb-4">
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 font-medium">Penggunaan:</span>
                  <span className="font-bold text-slate-800 text-right max-w-[60%]">{product.recommendedFor}</span>
                </div>
                {product.slump && product.slump !== 'N/A' && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Slump Standar:</span>
                    <span className="font-semibold text-slate-700">{product.slump}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Minimum Order:</span>
                  <span className="font-bold text-brand-700">{product.minOrder} {product.unit}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions & Price */}
            <div>
              <div className="flex items-baseline justify-between pt-3 border-t border-slate-100 mb-3">
                <span className="text-[11px] text-slate-400 font-medium">Harga Per {product.unit}:</span>
                <div className="text-right">
                  <div className="text-lg font-black text-brand-600">
                    Rp {product.price.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">+ PPN 11%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Secondary Detail / Calculate Button */}
                {product.category === 'readymix' ? (
                  <button
                    onClick={() => {
                      setCalcData(prev => ({ ...prev, productId: product.id }));
                      setActiveTab('calculator');
                    }}
                    className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-slate-600" />
                    <span>Hitung Kubik</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedProductDetail(product)}
                    className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-600" />
                    <span>Spesifikasi</span>
                  </button>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => addToCart(product, product.minOrder)}
                  className="py-2.5 px-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Keranjang</span>
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-base">Tidak ada produk yang ditemukan</h4>
          <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau pilih kategori lainnya.</p>
        </div>
      )}

      {/* PRODUCT SPECIFICATION MODAL */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-4">
            
            <div className="bg-brand-700 text-white p-5 flex justify-between items-start">
              <div>
                <span className="bg-amber-500 text-brand-950 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase">
                  {selectedProductDetail.code}
                </span>
                <h3 className="font-extrabold text-lg text-white mt-1">
                  {selectedProductDetail.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedProductDetail(null)}
                className="text-slate-300 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                {selectedProductDetail.description}
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                  Spesifikasi Teknis (Semen Tonasa Standard)
                </h4>
                {selectedProductDetail.specs && Object.entries(selectedProductDetail.specs).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-bold text-slate-800">{val}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400">Harga Per {selectedProductDetail.unit}</div>
                  <div className="font-black text-brand-600 text-lg">
                    Rp {selectedProductDetail.price.toLocaleString('id-ID')}
                  </div>
                </div>

                <button
                  onClick={() => {
                    addToCart(selectedProductDetail, selectedProductDetail.minOrder);
                    setSelectedProductDetail(null);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-brand-950 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan ke Keranjang</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
