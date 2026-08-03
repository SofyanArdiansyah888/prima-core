import React from 'react';
import { ShoppingCart, X, Trash2, Plus, Minus, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  updateQuantity, 
  removeFromCart, 
  onProceedCheckout 
}) {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const ppn = subtotal * 0.11;
  const total = subtotal + ppn;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-4 bg-brand-800 text-white flex items-center justify-between border-b border-brand-700">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-sm text-white">Keranjang Pesanan PKM</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="p-4 flex-grow overflow-y-auto space-y-3 text-xs">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600 text-sm">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400">Pilih produk dari katalog untuk memulai pemesanan.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-brand-100 text-brand-800 font-extrabold px-2 py-0.5 rounded border border-brand-200">
                      {item.code}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{item.name}</h4>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="text-red-500 hover:text-red-700 p-1 text-xs font-bold transition-colors"
                    title="Hapus item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {item.notes && (
                  <div className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium">
                    📝 {item.notes}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)} 
                      className="font-bold px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-extrabold text-slate-800 text-xs">{item.quantity} {item.unit}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)} 
                      className="font-bold px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-medium">Subtotal:</div>
                    <div className="font-black text-brand-600 text-sm">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Totals & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Material:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>PPN (11%):</span>
                <span>Rp {ppn.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-base pt-1 border-t border-slate-200">
                <span>Total Tagihan:</span>
                <span className="text-brand-600">Rp {total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button 
              onClick={onProceedCheckout}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-brand-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-glow transition-all active:scale-95"
            >
              <span>Lanjut Ke Form Checkout & Lokasi Proyek</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
