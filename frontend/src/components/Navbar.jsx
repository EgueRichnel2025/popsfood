import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/menu", label: "Menu" },
  { to: "/suivi-commande", label: "Suivi commande" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { totalQuantity, setIsOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-pop-cream/95 backdrop-blur border-b border-pop-orange/10">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span className="font-display font-extrabold text-lg text-pop-dark">
            Pop's <span className="text-pop-red">FOOD</span> <span className="text-pop-orange">BENIN</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition-colors ${
                  isActive ? "text-pop-red" : "text-pop-dark/70 hover:text-pop-orange"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 bg-pop-orange text-white px-4 py-2 rounded-full font-semibold text-sm shadow-card hover:bg-pop-red transition-colors"
          >
            🛒 <span className="hidden sm:inline">Panier</span>
            {totalQuantity > 0 && (
              <span className="absolute -top-2 -right-2 bg-pop-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {totalQuantity}
              </span>
            )}
          </button>
          <button className="md:hidden text-2xl" onClick={() => setMobileOpen((o) => !o)}>
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-pop-orange/10 px-4 py-3 flex flex-col gap-3">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-pop-dark/80">
              {l.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
}
