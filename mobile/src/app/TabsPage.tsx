import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { cubeOutline, documentTextOutline, personOutline, receiptOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import HomePage from '../features/catalog/HomePage';
import OrdersPage from '../features/orders/OrdersPage';
import DigitalDocsPage from '../features/docs/DigitalDocsPage';
import ProfilePage from '../features/profile/ProfilePage';

export default function TabsPage() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/home" element={<HomePage />} />
        <Route path="/tabs/orders" element={<OrdersPage />} />
        <Route path="/tabs/docs" element={<DigitalDocsPage />} />
        <Route path="/tabs/profile" element={<ProfilePage />} />
        <Route path="/tabs" element={<Navigate to="/tabs/home" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className="border-t border-slate-200 bg-white py-1">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={cubeOutline} />
          <IonLabel className="text-[10px] font-bold">Katalog</IonLabel>
        </IonTabButton>
        <IonTabButton tab="orders" href="/tabs/orders">
          <IonIcon icon={receiptOutline} />
          <IonLabel className="text-[10px] font-bold">Pesanan</IonLabel>
        </IonTabButton>
        <IonTabButton tab="docs" href="/tabs/docs">
          <IonIcon icon={documentTextOutline} />
          <IonLabel className="text-[10px] font-bold">Dokumen</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personOutline} />
          <IonLabel className="text-[10px] font-bold">Profil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}

