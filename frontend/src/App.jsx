import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import { ProtectedAdminRoute } from "./components/Misc.jsx";

import Home from "./pages/Home.jsx";
import Menu from "./pages/Menu.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Checkout from "./pages/Checkout.jsx";
import Payment from "./pages/Payment.jsx";
import OrderTracking from "./pages/OrderTracking.jsx";
import Contact from "./pages/Contact.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminProductOptions from "./pages/admin/AdminProductOptions.jsx";
import AdminCategories from "./pages/admin/AdminCategories.jsx";
import AdminOrders from "./pages/admin/AdminOrders.jsx";
import AdminPromotions from "./pages/admin/AdminPromotions.jsx";
import AdminReviews from "./pages/admin/AdminReviews.jsx";
import AdminDelivery from "./pages/admin/AdminDelivery.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";
import AdminAccount from "./pages/admin/AdminAccount.jsx";

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
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="produits" element={<AdminProducts />} />
        <Route path="produits/:productId/options" element={<AdminProductOptions />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="commandes" element={<AdminOrders />} />
        <Route path="promotions" element={<AdminPromotions />} />
        <Route path="avis" element={<AdminReviews />} />
        <Route path="livraison" element={<AdminDelivery />} />
        <Route path="parametres" element={<AdminSettings />} />
        <Route path="mon-compte" element={<AdminAccount />} />
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