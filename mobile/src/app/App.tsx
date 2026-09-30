import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider } from '../data/auth';
import { CartProvider } from '../data/cart';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import CartPage from '../features/cart/CartPage';
import ProductPage from '../features/catalog/ProductPage';
import CheckoutPage from '../features/checkout/CheckoutPage';
import SuccessPage from '../features/checkout/SuccessPage';
import OrderDetailPage from '../features/orders/OrderDetailPage';
import RequireAuth from './RequireAuth';
import TabsPage from './TabsPage';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '../theme/variables.css';

setupIonicReact();

export default function App() {
  return (
    <div className="pkm-frame">
      <IonApp>
      <AuthProvider>
        <CartProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/tabs/*" element={<RequireAuth><TabsPage /></RequireAuth>} />
              <Route path="/product/:uuid" element={<RequireAuth><ProductPage /></RequireAuth>} />
              <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
              <Route path="/orders/:uuid" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
              <Route path="/success/:code" element={<RequireAuth><SuccessPage /></RequireAuth>} />
              <Route path="/" element={<Navigate to="/tabs/home" replace />} />
            </IonRouterOutlet>
          </IonReactRouter>
        </CartProvider>
      </AuthProvider>
      </IonApp>
    </div>
  );
}
