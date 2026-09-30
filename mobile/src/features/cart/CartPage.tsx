import { useNavigate } from 'react-router-dom';
import { useCart } from '../../data/cart';
import { formatQty, formatRupiah } from '../../domain/format';
import { categoryLabel, quantityAfterStep } from '../../domain/rules';
import { Card, NavBar, Note, PrimaryButton, QuietButton, RemoveButton, Screen, Stepper, StickyBar } from '../../shared/ui';

export default function CartPage() {
  const navigate = useNavigate();
  const { lines, category, setQuantity, remove } = useCart();
  const subtotal = lines.reduce((sum, line) => sum + line.product.base_price * line.quantity, 0);

  return (
    <Screen
      header={<NavBar title="Keranjang pesanan" backHref="/tabs/home" end={<span className="font-mono text-xs text-muted">{lines.length} item</span>} />}
      footer={lines.length > 0 ? (
        <StickyBar>
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="text-muted">Subtotal material</span>
            <span className="font-display text-sm font-bold text-ink">{formatRupiah(subtotal)}</span>
          </div>
          <PrimaryButton type="button" onClick={() => navigate('/checkout')}>Lanjut antar</PrimaryButton>
        </StickyBar>
      ) : null}
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <h2 className="font-display text-sm font-bold text-ink">Keranjang masih kosong</h2>
          <p className="mt-1 text-xs text-muted">Pilih semen atau ready mix dari katalog.</p>
          <QuietButton type="button" className="mt-4 w-auto bg-brand px-4 text-surface" onClick={() => navigate('/tabs/home')}>
            Lihat katalog
          </QuietButton>
        </div>
      ) : (
        <div className="space-y-3 px-4 py-4">
          {category ? <p className="text-[11px] font-semibold text-brand">{categoryLabel(category)}</p> : null}
          {lines.map((line) => (
            <Card key={line.product.uuid} className="p-3.5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <span className="block font-mono text-[10px] font-semibold text-subtle">{line.product.code}</span>
                  <h2 className="text-xs font-bold text-ink">{line.product.name}</h2>
                </div>
                <RemoveButton onClick={() => remove(line.product.uuid)} />
              </div>
              <div className="flex items-end justify-between border-t border-line pt-2">
                <div>
                  <span className="block text-[10px] text-subtle">Harga satuan</span>
                  <span className="font-display text-xs font-bold text-brand">
                    {formatRupiah(line.product.base_price)} / {line.product.unit}
                  </span>
                </div>
                <Stepper
                  label={`${formatQty(line.quantity)} ${line.product.unit}`}
                  decreaseDisabled={line.quantity <= line.product.min_order}
                  onDecrease={() => setQuantity(line.product.uuid, quantityAfterStep(line.quantity, -1, line.product.min_order))}
                  onIncrease={() => setQuantity(line.product.uuid, quantityAfterStep(line.quantity, 1, line.product.min_order))}
                />
              </div>
            </Card>
          ))}
          <Note>Ongkos kirim dan PPN 11% dihitung server pada langkah pengiriman berikutnya.</Note>
        </div>
      )}
    </Screen>
  );
}
