import React, { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

const links = [
  { to: "/admin/dashboard", label: "📊 Dashboard" },
  { to: "/admin/produits", label: "🍔 Produits" },
  { to: "/admin/categories", label: "🗂️ Catégories" },
  { to: "/admin/commandes", label: "📦 Commandes" },
  { to: "/admin/promotions", label: "🔥 Promotions" },
  { to: "/admin/avis", label: "⭐ Avis" },
  { to: "/admin/livraison", label: "🚚 Livraison" },
  { to: "/admin/parametres", label: "⚙️ Paramètres" },
  { to: "/admin/mon-compte", label: "🔐 Mon compte" },
];

export default function AdminLayout() {
  const { adminName, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-pop-cream">
      {/* Barre du haut visible uniquement sur mobile, avec bouton menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-pop-dark text-white flex items-center justify-between px-4 h-14">
        <button onClick={() => setSidebarOpen(true)} className="text-2xl leading-none" aria-label="Ouvrir le menu">
          ☰
        </button>
        <p className="font-display font-bold text-sm">Pop's FOOD — Admin</p>
        <div className="w-6" />
      </div>

      {/* Fond sombre derrière le menu mobile ouvert */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Menu latéral : hors-écran sur mobile par défaut, toujours visible sur desktop */}
      <aside
        className={`bg-pop-dark text-white flex flex-col w-64 shrink-0 fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="p-5 border-b border-white/10">
          <p className="font-display font-bold">Pop's FOOD</p>
          <p className="text-xs text-white/40 break-words">Admin — {adminName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-pop-orange text-white" : "text-white/70 hover:bg-white/10"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="m-3 text-sm text-white/50 hover:text-white text-left px-3 py-2">
          🚪 Déconnexion
        </button>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-6 pt-20 md:pt-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}