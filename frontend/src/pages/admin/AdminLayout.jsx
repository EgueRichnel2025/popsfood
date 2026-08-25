import React from "react";
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
];

export default function AdminLayout() {
  const { adminName, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen flex bg-pop-cream">
      <aside className="w-56 bg-pop-dark text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <p className="font-display font-bold">Pop's FOOD</p>
          <p className="text-xs text-white/40">Admin — {adminName}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
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
      <main className="flex-1 p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
