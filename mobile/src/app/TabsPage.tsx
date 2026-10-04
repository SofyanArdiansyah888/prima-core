import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { homeOutline, personOutline, receiptOutline, cartOutline, documentTextOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import HomePage from '../features/catalog/HomePage';
import OrdersPage from '../features/orders/OrdersPage';
import CartPage from '../features/cart/CartPage';
import DigitalDocsPage from '../features/docs/DigitalDocsPage';
import ProfilePage from '../features/profile/ProfilePage';
import { useCart } from '../data/cart';

export default function TabsPage() {
  const cart = useCart();

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/home" element={<HomePage />} />
        <Route path="/tabs/orders" element={<OrdersPage />} />
        <Route path="/tabs/cart" element={<CartPage />} />
        <Route path="/tabs/docs" element={<DigitalDocsPage />} />
        <Route path="/tabs/profile" element={<ProfilePage />} />
        <Route path="/tabs" element={<Navigate to="/tabs/home" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="border-t border-slate-200 bg-white py-1 shadow-sm">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={homeOutline} className="text-xl" />
          <IonLabel className="text-[11px] font-bold mt-0.5">Beranda</IonLabel>
        </IonTabButton>
        <IonTabButton tab="orders" href="/tabs/orders">
          <IonIcon icon={receiptOutline} className="text-xl" />
          <IonLabel className="text-[11px] font-bold mt-0.5">Pesanan</IonLabel>
        </IonTabButton>
        <IonTabButton tab="cart" href="/tabs/cart">
          <div className="relative inline-flex items-center justify-center">
            <IonIcon icon={cartOutline} className="text-xl" />
            {cart.count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d91424] px-1 text-[9px] font-black text-white shadow-xs">
                {cart.count}
              </span>
            )}
          </div>
          <IonLabel className="text-[11px] font-bold mt-0.5">Keranjang</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personOutline} className="text-xl" />
          <IonLabel className="text-[11px] font-bold mt-0.5">Akun</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

