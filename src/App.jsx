import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import PWABanner from './components/PWABanner';
import CatalogView from './components/CatalogView';
import CalculatorView from './components/CalculatorView';
import TrackingView from './components/TrackingView';
import DigitalDocsView from './components/DigitalDocsView';
import B2BProfileView from './components/B2BProfileView';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import PresentationView from './components/PresentationView';

import {
  PRODUCTS_DATA,
  BATCHING_PLANTS,
  INITIAL_ORDERS,
  B2B_PARTNER_INFO
} from './data/mockData';

import {
  Layers,
  Calculator,
  Truck,
  FileText,
  Building2,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Presentation
} from 'lucide-react';

export default function App() {
  const [portalMode, setPortalMode] = useState('client'); // 'client' or 'admin'
  const [activeTab, setActiveTab] = useState('presentation'); // Default to presentation slide deck view or 'catalog', 'calculator', 'tracking', 'digital-docs'

  const [products] = useState(PRODUCTS_DATA);
  const [plants] = useState(BATCHING_PLANTS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [b2bPartner] = useState(B2B_PARTNER_INFO);

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedDocOrder, setSelectedDocOrder] = useState(INITIAL_ORDERS[0]);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [calcData, setCalcData] = useState({
    productId: 'rm-k300',
    length: '10',
    width: '6',
    thickness: '12',
    wasteMargin: '5',
    columnCount: '10',
    sideA: '30',
    sideB: '30',
    height: '4',
    footingCount: '8',
    footingL: '120',
    footingW: '120',
    footingD: '60'
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const addToCart = (product, quantity, notes = '') => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (notes) updated[existingIndex].notes = notes;
        return updated;
      } else {
        return [...prev, { ...product, quantity, notes }];
      }
    });
    triggerToast(`Ditambahkan ke keranjang: ${quantity} ${product.unit} ${product.code}`);
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handlePlaceOrder = (newOrderObj) => {
    setOrders(prev => [newOrderObj, ...prev]);
    setSelectedDocOrder(newOrderObj);
    setCart([]);
    triggerToast(`Pesanan berhasil dibuat! Kode Invoice: ${newOrderObj.id}`);
    setActiveTab('tracking');
  };

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-[#FAF7F7] flex flex-col pb-24 md:pb-8 font-sans">

      {/* Header Bar */}
      <Header
        portalMode={portalMode}
        setPortalMode={setPortalMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalCount}
        setIsCartOpen={setIsCartOpen}
      />

      {/* PWA Prompt Banner */}
      {/* {activeTab !== 'presentation' && <PWABanner triggerToast={triggerToast} />} */}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-grow w-full">

        {activeTab === 'presentation' ? (
          <PresentationView
            setActiveTab={setActiveTab}
            setPortalMode={setPortalMode}
          />
        ) : portalMode === 'admin' ? (
          <AdminDashboard
            plants={plants}
            orders={orders}
            triggerToast={triggerToast}
          />
        ) : (
          <>
            {activeTab === 'catalog' && (
              <CatalogView
                products={products}
                addToCart={addToCart}
                setActiveTab={setActiveTab}
                setCalcData={setCalcData}
              />
            )}

            {activeTab === 'calculator' && (
              <CalculatorView
                products={products}
                calcData={calcData}
                setCalcData={setCalcData}
                addToCart={addToCart}
                setIsCartOpen={setIsCartOpen}
              />
            )}

            {activeTab === 'tracking' && (
              <TrackingView
                orders={orders}
                setActiveTab={setActiveTab}
                setSelectedDocOrder={setSelectedDocOrder}
              />
            )}

            {activeTab === 'digital-docs' && (
              <DigitalDocsView
                order={selectedDocOrder || orders[0]}
                triggerToast={triggerToast}
              />
            )}

            {activeTab === 'b2b-profile' && (
              <B2BProfileView
                partner={b2bPartner}
                triggerToast={triggerToast}
              />
            )}
          </>
        )}

      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout & Location Pinpoint Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        b2bPartner={b2bPartner}
        onPlaceOrder={handlePlaceOrder}
        triggerToast={triggerToast}
      />

      {/* Toast Notification Popup */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-brand-800 to-brand-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl border border-brand-500/50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {portalMode === 'client' && activeTab !== 'presentation' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#FDF8F3]/95 backdrop-blur-md border-t border-[#E2D0B8] z-40 py-1.5 px-2 flex justify-around items-center text-[10px] font-bold text-stone-400 shadow-2xl">

          {[
            { tab: 'catalog', label: 'Katalog', icon: Layers },
            { tab: 'calculator', label: 'Kalkulator', icon: Calculator },
            { tab: 'tracking', label: 'Lacak', icon: Truck },
            { tab: 'digital-docs', label: 'Dokumen', icon: FileText },
          ].map(({ tab, label, icon: Icon }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 ${isActive
                  ? 'text-brand-700 bg-brand-50'
                  : 'text-slate-400 hover:text-slate-700'
                  }`}
              >
                {/* Active top accent bar */}
                {isActive && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-brand-600 rounded-full" />
                )}

                {tab === 'tracking' ? (
                  <span className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : ''}`} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  </span>
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : ''}`} />
                )}

                <span className={`mt-0.5 text-[10px] font-extrabold ${isActive ? 'text-brand-700' : ''
                  }`}>{label}</span>
              </button>
            );
          })}

        </div>
      )}

    </div>
  );
}
