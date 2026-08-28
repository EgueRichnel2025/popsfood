import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import { ProtectedAdminRoute, Loader } from "./components/Misc.jsx";

import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Checkout from "./pages/Checkout.jsx";
import Payment from "./pages/Payment.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Contact from "./pages/Contact.jsx";

// Pages admin chargées à la demande uniquement (réduit le chargement initial du site public)
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.jsx"));
const AdminForgotPassword = lazy(() => import("./pages/admin/AdminForgotPassword.jsx"));
const AdminResetPassword = lazy(() => import("./pages/admin/AdminResetPassword.jsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts.jsx"));
const AdminProductOptions = lazy(() => import("./pages/admin/AdminProductOptions.jsx"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.jsx"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions.jsx"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews.jsx"));
const AdminDelivery = lazy(() => import("./pages/admin/AdminDelivery.jsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.jsx"));
const AdminAccount = lazy(() => import("./pages/admin/AdminAccount.jsx"));

function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public storefront */}
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/menu" element={<SiteLayout><Menu /></SiteLayout>} />
      <Route path="/produit/:slug" element={<SiteLayout><ProductPage /></SiteLayout>} />
      <Route path="/commande" element={<SiteLayout><Checkout /></SiteLayout>} />
      <Route path="/paiement/:orderId" element={<SiteLayout><Payment /></SiteLayout>} />
      <Route path="/suivi-commande" element={<SiteLayout><OrderTracking /></SiteLayout>} />
      <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />

      {/* Admin */}
      <Route path="/admin/login" element={<Suspense fallback={<Loader />}><AdminLogin /></Suspense>} />
      <Route path="/admin/mot-de-passe-oublie" element={<Suspense fallback={<Loader />}><AdminForgotPassword /></Suspense>} />
      <Route path="/admin/reinitialiser-mot-de-passe" element={<Suspense fallback={<Loader />}><AdminResetPassword /></Suspense>} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <Suspense fallback={<Loader />}><AdminLayout /></Suspense>
          </ProtectedAdminRoute>
        }
      >
        <Route path="dashboard" element={<Suspense fallback={<Loader />}><AdminDashboard /></Suspense>} />
        <Route path="produits" element={<Suspense fallback={<Loader />}><AdminProducts /></Suspense>} />
        <Route path="produits/:productId/options" element={<Suspense fallback={<Loader />}><AdminProductOptions /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<Loader />}><AdminCategories /></Suspense>} />
        <Route path="commandes" element={<Suspense fallback={<Loader />}><AdminOrders /></Suspense>} />
        <Route path="promotions" element={<Suspense fallback={<Loader />}><AdminPromotions /></Suspense>} />
        <Route path="avis" element={<Suspense fallback={<Loader />}><AdminReviews /></Suspense>} />
        <Route path="livraison" element={<Suspense fallback={<Loader />}><AdminDelivery /></Suspense>} />
        <Route path="parametres" element={<Suspense fallback={<Loader />}><AdminSettings /></Suspense>} />
        <Route path="mon-compte" element={<Suspense fallback={<Loader />}><AdminAccount /></Suspense>} />
      </Route>

      <Route
        path="*"
        element={
          <SiteLayout>
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
              <p className="text-5xl mb-4">🍔</p>
              <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
              <p className="text-pop-dark/50">La page que vous cherchez n'existe pas.</p>
            </div>
          </SiteLayout>
        }
      />
    </Routes>
  );
}