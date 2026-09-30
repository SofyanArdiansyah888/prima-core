import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { cubeOutline, personOutline, receiptOutline } from 'ionicons/icons';
import { Navigate, Route } from 'react-router-dom';
import HomePage from '../features/catalog/HomePage';
import OrdersPage from '../features/orders/OrdersPage';
import ProfilePage from '../features/profile/ProfilePage';

export default function TabsPage() {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/home" element={<HomePage />} />
        <Route path="/tabs/orders" element={<OrdersPage />} />
        <Route path="/tabs/profile" element={<ProfilePage />} />
        <Route path="/tabs" element={<Navigate to="/tabs/home" replace />} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="home" href="/tabs/home">
          <IonIcon icon={cubeOutline} />
          <IonLabel>Katalog</IonLabel>
        </IonTabButton>
        <IonTabButton tab="orders" href="/tabs/orders">
          <IonIcon icon={receiptOutline} />
          <IonLabel>Pesanan</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
