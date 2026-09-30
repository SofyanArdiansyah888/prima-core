import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cartOutline, informationCircleOutline } from 'ionicons/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import type { Product } from '../../domain/types';
import { Card, CategoryModal, ErrorText, Eyebrow, NavBar, PrimaryButton, Screen, Stepper, StickyBar } from '../../shared/ui';

export default function ProductPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [confirmMix, setConfirmMix] = useState(false);

  useEffect(() => {
    if (!uuid) {
      return;
    }

    api.product(uuid)
      .then((response) => {
        setProduct(response.data);
        setQuantity(response.data.min_order);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [uuid]);

  const addToCart = (replace: boolean) => {
    if (!product) {
      return;
    }

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

  return (
    <Screen
      header={<NavBar title="Kembali" backHref="/tabs/home" end={<span className="font-mono text-xs font-semibold text-muted">{product?.code}</span>} />}
      footer={product ? (
        <StickyBar>
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="block text-[10px] text-muted">Minimal order {formatQty(product.min_order)} {product.unit}</span>
              <span className="text-xs font-bold text-ink">Total min. {formatRupiah(product.base_price * product.min_order)}</span>
            </div>
            <PrimaryButton type="button" className="w-auto px-4" onClick={() => addToCart(false)}>
              <span className="inline-flex items-center gap-1.5">
                <IonIcon icon={cartOutline} />
                Masukkan keranjang
              </span>
            </PrimaryButton>
          </div>
        </StickyBar>
      ) : null}
    >
      <div className="space-y-4 px-4 py-4">
        {!product && !error ? <p className="text-xs text-muted">Memuat produk…</p> : null}
        <ErrorText>{error}</ErrorText>
        {product ? (
          <>
            <Card>
              <Eyebrow>PKM Tonasa</Eyebrow>
              <h1 className="mt-1 font-display text-lg font-bold text-ink">{product.name}</h1>
              <p className="mt-2 font-display text-xl font-bold text-brand">
                {formatRupiah(product.base_price)}
                <span className="font-sans text-xs font-normal text-muted"> / {product.unit}</span>
              </p>
              {product.slump ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-amber-line bg-amber-soft px-2.5 py-1 text-xs text-amber-ink">
                  <IonIcon icon={informationCircleOutline} />
                  Slump standar <strong>{product.slump}</strong>
                </p>
              ) : null}
              {product.description ? <p className="mt-2 border-t border-line pt-2 text-xs leading-relaxed text-muted">{product.description}</p> : null}
            </Card>
            {product.recommended_for ? (
              <div className="rounded-card border border-brand-line bg-brand-soft p-3 text-xs text-ink">
                <span className="block font-bold text-brand">Cocok untuk</span>
                <p className="mt-0.5">{product.recommended_for}</p>
              </div>
            ) : null}
            {product.specs ? (
              <Card>
                <h2 className="mb-3 font-mono text-xs font-bold tracking-wider text-ink uppercase">Spesifikasi teknis</h2>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-line bg-fill p-2.5">
                      <span className="block text-[10px] text-subtle">{key}</span>
                      <span className="font-semibold text-ink">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
            <Card>
              <p className="mb-2 text-[10px] font-medium text-muted uppercase">Jumlah · {categoryLabel(product.category)}</p>
              <Stepper
                label={`${formatQty(quantity)} ${product.unit}`}
                decreaseDisabled={quantity <= product.min_order}
                onDecrease={() => setQuantity((value) => quantityAfterStep(value, -1, product.min_order))}
                onIncrease={() => setQuantity((value) => quantityAfterStep(value, 1, product.min_order))}
              />
            </Card>
          </>
        ) : null}
      </div>
      {confirmMix && cart.category ? (
        <CategoryModal
          categoryLabel={categoryLabel(cart.category)}
          onClose={() => setConfirmMix(false)}
          onReplace={() => addToCart(true)}
        />
      ) : null}
    </Screen>
  );
}
