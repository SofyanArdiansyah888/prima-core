import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { 
  cartOutline, 
  arrowForwardOutline, 
  trashOutline, 
  informationCircleOutline, 
  bagHandleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import type { Product } from '../../domain/types';
import { 
  Card, 
  ConfirmModal,
  NavBar, 
  PrimaryButton, 
  SafeImage,
  Screen, 
  Stepper, 
  StickyBar 
} from '../../shared/ui';

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
  return 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=300';
}

export default function CartPage() {
  const navigate = useNavigate();
  const { lines, category, setQuantity, remove } = useCart();
  const [deletingProduct, setDeletingProduct] = useState<{ uuid: string; name: string } | null>(null);
  
  const totalItems = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.product.base_price * line.quantity, 0);

  return (
    <Screen
      header={(
        <NavBar 
          title="Keranjang Material" 
          backHref="/tabs/home" 
          end={
            <span className="rounded-full bg-[#0c1d37]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#0c1d37]">
              {lines.length} Item
            </span>
          } 
        />
      )}
      footer={lines.length > 0 ? (
        <StickyBar>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">Total Estimasi Material</span>
              <span className="font-extrabold text-base text-[#d91424]">
                {formatRupiah(subtotal)}
              </span>
            </div>
            <span className="text-right text-[11px] font-mono text-slate-500 font-semibold">
              {totalItems} unit produk
            </span>
          </div>
          <PrimaryButton type="button" onClick={() => navigate('/checkout')}>
            <span>Lanjut ke Pengiriman</span>
            <IonIcon icon={arrowForwardOutline} className="text-base" />
          </PrimaryButton>
        </StickyBar>
      ) : null}
    >
      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-4 shadow-inner">
            <IonIcon icon={bagHandleOutline} className="text-4xl text-slate-400" />
          </div>
          <h2 className="text-base font-extrabold text-[#0c1d37]">Keranjang Masih Kosong</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
            Anda belum menambahkan material semen sak, semen curah, atau ready mix ke dalam keranjang.
          </p>
          <button
            type="button"
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#0c1d37] hover:bg-[#162e55] px-5 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            onClick={() => navigate('/tabs/home')}
          >
            <IonIcon icon={cartOutline} className="text-sm" />
            <span>Pilih Material di Katalog</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4 pb-28">
          
          {/* Category Banner */}
          {category && (
            <div className="flex items-center justify-between rounded-xl bg-slate-100/90 px-3.5 py-2 text-xs border border-slate-200/60">
              <span className="text-slate-500">Kategori Pesanan:</span>
              <span className="font-extrabold text-[#0c1d37]">{categoryLabel(category)}</span>
            </div>
          )}

          {/* Cart Item Cards */}
          <div className="space-y-2.5">
            {lines.map((line) => {
              const lineTotal = line.product.base_price * line.quantity;
              const imageSrc = getProductImage(line.product);

              return (
                <Card key={line.product.uuid} className="p-3.5 space-y-3 border border-slate-200/90 shadow-xs">
                  <div className="flex gap-3 items-start">
                    {/* Thumbnail */}
                    <div className="size-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                      <SafeImage 
                        src={imageSrc} 
                        alt={line.product.name} 
                        type={line.product.category}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-semibold text-slate-400">
                          {line.product.code}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setDeletingProduct({ uuid: line.product.uuid, name: line.product.name })}
                          className="p-1 text-slate-400 hover:text-[#d91424] transition-colors cursor-pointer"
                          aria-label="Hapus item"
                        >
                          <IonIcon icon={trashOutline} className="text-base" />
                        </button>
                      </div>
                      <h2 className="text-xs font-bold text-[#0c1d37] leading-snug line-clamp-1 mt-0.5">
                        {line.product.name}
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {formatRupiah(line.product.base_price)} <span className="text-[10px] text-slate-400">/ {line.product.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Subtotal Row */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="block text-[10px] text-slate-400">Subtotal Item</span>
                      <span className="text-xs font-extrabold text-[#0c1d37]">
                        {formatRupiah(lineTotal)}
                      </span>
                    </div>

                    <Stepper
                      label={`${formatQty(line.quantity)} ${line.product.unit}`}
                      decreaseDisabled={line.quantity <= line.product.min_order}
                      onDecrease={() => {
                        if (line.quantity <= line.product.min_order) {
                          setDeletingProduct({ uuid: line.product.uuid, name: line.product.name });
                        } else {
                          setQuantity(line.product.uuid, quantityAfterStep(line.quantity, -1, line.product.min_order));
                        }
                      }}
                      onIncrease={() => setQuantity(line.product.uuid, quantityAfterStep(line.quantity, 1, line.product.min_order))}
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Guarantee & Info Notice */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
              <IonIcon icon={shieldCheckmarkOutline} className="text-base text-emerald-600" />
              <span>Jaminan Mutu Resmi Semen Tonasa</span>
            </div>
            <div className="flex items-start gap-2 text-slate-500 text-[11px] leading-relaxed">
              <IonIcon icon={informationCircleOutline} className="text-base text-slate-400 shrink-0 mt-0.5" />
              <span>Ongkos kirim dan PPN 11% akan dihitung otomatis oleh server pada tahap penentuan alamat proyek berikutnya.</span>
            </div>
          </div>

        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={Boolean(deletingProduct)}
        title="Hapus dari Keranjang?"
        description={`Apakah Anda yakin ingin menghapus "${deletingProduct?.name}" dari keranjang pesanan Anda?`}
        confirmText="Ya, Hapus Material"
        cancelText="Batal"
        tone="danger"
        iconType="trash"
        onConfirm={() => {
          if (deletingProduct) {
            remove(deletingProduct.uuid);
            setDeletingProduct(null);
          }
        }}
        onClose={() => setDeletingProduct(null)}
      />
    </Screen>
  );
}
