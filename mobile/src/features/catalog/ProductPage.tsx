import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { 
  cartOutline, 
  informationCircleOutline, 
  shieldCheckmarkOutline, 
  checkmarkCircle,
  cubeOutline,
  speedometerOutline,
  sparklesOutline
} from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import { getProductImage } from '../../domain/product';
import type { Product } from '../../domain/types';
import { 
  Card, 
  CategoryModal, 
  ErrorText, 
  NavBar, 
  PrimaryButton, 
  ProductDetailSkeleton,
  SafeImage,
  Screen, 
  Stepper, 
  StickyBar 
} from '../../shared/ui';

export default function ProductPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [confirmMix, setConfirmMix] = useState(false);

  useEffect(() => {
    if (!uuid) return;

    api.product(uuid)
      .then((response) => {
        setProduct(response.data);
        setQuantity(response.data.min_order);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [uuid]);

  const addToCart = (replace: boolean) => {
    if (!product) return;

    if (quantity < product.min_order) {
      setError(`${product.name} minimal ${formatQty(product.min_order)} ${product.unit}.`);
      return;
    }

    if (!replace && cart.conflicts(product)) {
      setConfirmMix(true);
      return;
    }

    if (replace) {
      cart.replace(product, quantity);
    } else {
      cart.add(product, quantity);
    }

    setConfirmMix(false);
    navigate('/cart');
  };

  const totalPrice = product ? product.base_price * quantity : 0;

  return (
    <Screen
      header={
        <NavBar 
          title="Detail Material" 
          backHref="/tabs/home" 
          end={
            <span className="font-mono text-xs font-bold text-slate-500">
              {product?.code}
            </span>
          } 
        />
      }
      footer={
        product ? (
          <StickyBar>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Min. {formatQty(product.min_order)} {product.unit} · Subtotal
                </span>
                <span className="text-base font-extrabold text-[#d91424]">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
              <PrimaryButton 
                type="button" 
                className="w-auto px-5" 
                onClick={() => addToCart(false)}
              >
                <IonIcon icon={cartOutline} className="text-base" />
                <span>Tambah Keranjang</span>
              </PrimaryButton>
            </div>
          </StickyBar>
        ) : null
      }
    >
      <div className="pb-28">
        <ErrorText>{error}</ErrorText>

        {!product && !error ? (
          <div className="px-4 py-4">
            <ProductDetailSkeleton />
          </div>
        ) : null}

        {product && (
          <>
            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
              <SafeImage 
                src={getProductImage(product)} 
                alt={product.name} 
                type={product.category}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className="bg-[#0c1d37]/90 backdrop-blur-xs text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                  {categoryLabel(product.category)}
                </span>
                {product.tag && (
                  <span className="bg-[#ea580c] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg">
                    {product.tag}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3.5 px-4 py-4">
            {/* PRODUCT TITLE & PRICE CARD */}
            <Card className="p-4 space-y-2.5 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#ea580c] uppercase tracking-wider">
                <IonIcon icon={shieldCheckmarkOutline} className="text-xs" />
                <span>Produk Resmi PT Semen Tonasa</span>
              </div>

              <h1 className="text-base font-extrabold text-[#0c1d37] leading-snug">
                {product.name}
              </h1>

              <div className="flex items-baseline gap-1.5 pt-1">
                <span className="text-xl font-extrabold text-[#d91424]">
                  {formatRupiah(product.base_price)}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ {product.unit}</span>
              </div>

              {product.slump && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 font-medium">
                  <IonIcon icon={speedometerOutline} className="text-amber-700" />
                  <span>Uji Slump Standar: <strong>{product.slump}</strong></span>
                </div>
              )}

              {product.description && (
                <p className="border-t border-slate-100 pt-2.5 text-xs leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}
            </Card>

            {/* RECOMMENDED FOR CARD */}
            {product.recommended_for && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-slate-800 space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#0c1d37] uppercase tracking-wider">
                  <IonIcon icon={sparklesOutline} className="text-xs text-[#ea580c]" />
                  Aplikasi & Peruntukan Konstruksi
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {product.recommended_for}
                </p>
              </div>
            )}

            {/* TECHNICAL SPECS */}
            {product.specs && (
              <Card className="p-4 space-y-3 border border-slate-200/90 shadow-xs">
                <h2 className="text-xs font-extrabold text-[#0c1d37] uppercase tracking-wide">
                  Spesifikasi Teknis & Standarisasi
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                      <span className="block text-[10px] text-slate-400 font-medium capitalize">{key}</span>
                      <span className="font-bold text-xs text-[#0c1d37]">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* QUANTITY STEPPER CARD */}
            <Card className="p-4 space-y-3 border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0c1d37]">Jumlah Pemesanan</h3>
                  <span className="text-[10px] text-slate-400">
                    Min. order {formatQty(product.min_order)} {product.unit}
                  </span>
                </div>

                <Stepper
                  label={`${formatQty(quantity)} ${product.unit}`}
                  decreaseDisabled={quantity <= product.min_order}
                  onDecrease={() => setQuantity((value) => quantityAfterStep(value, -1, product.min_order))}
                  onIncrease={() => setQuantity((value) => quantityAfterStep(value, 1, product.min_order))}
                />
              </div>
            </Card>
            </div>
          </>
        )}
      </div>

      {confirmMix && cart.category && (
        <CategoryModal
          categoryLabel={categoryLabel(cart.category)}
          onClose={() => setConfirmMix(false)}
          onReplace={() => addToCart(true)}
        />
      )}
    </Screen>
  );
}
