import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Loader } from "../components/Misc.jsx";

const STATUS_STEPS = [
  { key: "en_attente_paiement", label: "En attente de paiement", icon: "⏳" },
  { key: "paiement_a_verifier", label: "Paiement à vérifier", icon: "🔍" },
  { key: "paiement_confirme", label: "Paiement confirmé", icon: "✅" },
  { key: "commande_confirmee", label: "Commande confirmée", icon: "📋" },
  { key: "en_preparation", label: "En préparation", icon: "👨‍🍳" },
  { key: "en_livraison", label: "En livraison", icon: "🛵" },
  { key: "livree", label: "Livrée", icon: "🎉" },
];

const TERMINAL_BAD = {
  annulee: "❌ Commande annulée",
  paiement_rejete: "⚠️ Paiement rejeté",
};

export default function OrderTracking() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("numero") || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e?.preventDefault();
    if (!orderNumber) return;
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const data = await api.get(`/api/orders/track/${orderNumber}`);
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (searchParams.get("numero")) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const isBadTerminal = order && TERMINAL_BAD[order.status];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Suivi de commande</h1>

      <form onSubmit={search} className="flex gap-2 mb-8">
        <input
          placeholder="Numéro de commande (ex: PF-260825-1234)"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          className="flex-1 border border-pop-dark/10 rounded-full px-4 py-2 text-sm"
        />
        <button className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
          Rechercher
        </button>
      </form>

      {loading && <Loader />}
      {error && <p className="text-sm text-pop-red">{error}</p>}

      {order && (
        <div className="bg-white rounded-xl2 p-6 shadow-card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-bold text-lg">{order.order_number}</h2>
              <p className="text-sm text-pop-dark/50">{order.customer_name} — {order.quartier}</p>
            </div>
            <span className="font-bold text-pop-red">{order.total.toLocaleString("fr-FR")} F</span>
          </div>

          {isBadTerminal ? (
            <div className="bg-pop-red/10 text-pop-red rounded-lg p-4 text-sm font-semibold">
              {TERMINAL_BAD[order.status]}
              {order.payment_rejected_reason && (
                <p className="font-normal mt-1">Motif : {order.payment_rejected_reason}</p>
              )}
            </div>
          ) : (
            <ol className="space-y-3">
              {STATUS_STEPS.map((step, idx) => {
                const done = idx <= currentStepIndex;
                return (
                  <li key={step.key} className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        done ? "bg-pop-orange text-white" : "bg-pop-dark/10 text-pop-dark/30"
                      }`}
                    >
                      {step.icon}
                    </span>
                    <span className={`text-sm ${done ? "font-semibold text-pop-dark" : "text-pop-dark/40"}`}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="border-t mt-5 pt-4">
            <h3 className="font-semibold text-sm mb-2">Détails de la commande</h3>
            <ul className="text-sm divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="py-1.5 flex justify-between">
                  <span>{it.quantity} × {it.product_name}</span>
                  <span>{it.line_total.toLocaleString("fr-FR")} F</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
