import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/orders/stats/dashboard", true).then(setStats);
  }, []);

  if (!stats) return <Loader />;

  const cards = [
    ["💰 Chiffre d'affaires total", `${stats.revenue_total.toLocaleString("fr-FR")} F`],
    ["📅 CA aujourd'hui", `${stats.revenue_today.toLocaleString("fr-FR")} F`],
    ["📦 Commandes totales", stats.orders_total],
    ["🆕 Commandes aujourd'hui", stats.orders_today],
    ["⏳ En attente", stats.orders_pending],
    ["🛵 En livraison", stats.orders_delivering],
    ["✅ Livrées", stats.orders_completed],
    ["🔥 Promos actives", stats.active_promotions],
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl2 p-5 shadow-card">
            <p className="text-xs text-pop-dark/50 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl2 p-5 shadow-card">
        <h2 className="font-semibold mb-4">Produits les plus vendus</h2>
        {stats.top_products.length === 0 ? (
          <p className="text-sm text-pop-dark/50">Pas encore de données de vente.</p>
        ) : (
          <ul className="divide-y text-sm">
            {stats.top_products.map((p, idx) => (
              <li key={p.name} className="py-2 flex justify-between">
                <span>
                  {idx + 1}. {p.name}
                </span>
                <span className="font-semibold">{p.quantity} vendus</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
