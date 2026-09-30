import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../data/api';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { segmentLabel } from '../../domain/rules';
import type { Product, ProductCategory } from '../../domain/types';
import { BrandBar, Card, ErrorText, Screen, Segment } from '../../shared/ui';

export default function HomePage() {
  const navigate = useNavigate();
  const { count } = useCart();
  const [category, setCategory] = useState<ProductCategory>('cement');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.products(category)
      .then((response) => setProducts(response.data))
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <Screen
      header={(
        <BrandBar
          title="Katalog material"
          cartCount={count}
          extra={(
            <Segment
              value={category}
              options={(['cement', 'readymix'] as const).map((value) => ({ value, label: segmentLabel(value) }))}
              onChange={setCategory}
            />
          )}
        />
      )}
    >
      <div className="space-y-3 px-4 py-4">
        <ErrorText>{error}</ErrorText>
        {loading ? <p className="text-xs text-muted">Memuat katalog…</p> : null}
        {products.map((product) => (
          <button key={product.uuid} type="button" className="block w-full text-left" onClick={() => navigate(`/product/${product.uuid}`)}>
            <Card className="p-3.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-muted">{product.code}</span>
                {product.tag ? (
                  <span className="rounded-full border border-brand-line bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">{product.tag}</span>
                ) : null}
              </div>
              <h2 className="text-sm font-bold text-ink">{product.name}</h2>
              {product.description ? <p className="mt-1 line-clamp-2 text-[11px] text-muted">{product.description}</p> : null}
              <div className="mt-2 flex items-end justify-between border-t border-line pt-2">
                <div>
                  <span className="block text-[10px] text-muted">Min. order {formatQty(product.min_order)} {product.unit}</span>
                  <span className="font-display text-base font-bold text-brand">{formatRupiah(product.base_price)}</span>
                  <span className="text-[10px] text-muted">/{product.unit}</span>
                </div>
                <span className="rounded-lg bg-fill p-2 text-muted">
                  <IonIcon icon={chevronForwardOutline} />
                </span>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </Screen>
  );
}
