import React, { useEffect, useState } from "react";
import { api, imageUrl } from "../../api/client";
import { Loader, EmptyState } from "../../components/Misc.jsx";

const STATUS_LABELS = {
  en_attente_paiement: "En attente de paiement",
  paiement_a_verifier: "Paiement à vérifier",
  paiement_confirme: "Paiement confirmé",
  commande_confirmee: "Commande confirmée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  annulee: "Annulée",
  paiement_rejete: "Paiement rejeté",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  function load() {
    const qs = filter ? `?status=${filter}` : "";
    api.get(`/api/orders${qs}`, true).then(setOrders);
  }
  useEffect(load, [filter]);

  async function openOrder(id) {
    const order = await api.get(`/api/orders/${id}`, true);
    setSelected(order);
  }

  async function decidePayment(approve) {
    try {
      const updated = await api.post(`/api/orders/${selected.id}/payment-decision`, {
        approve,
        reason: approve ? undefined : rejectReason,
      }, true);
      setSelected(updated);
      setRejectReason("");
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function changeStatus(status) {
    try {
      const updated = await api.put(`/api/orders/${selected.id}/status`, { status }, true);
      setSelected(updated);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!orders) return <Loader />;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Commandes</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {orders.length === 0 ? (
          <EmptyState title="Aucune commande" />
        ) : (
          <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-pop-cream text-left">
                <tr>
                  <th className="p-3">N°</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className={selected?.id === o.id ? "bg-pop-orange/5" : ""}>
                    <td className="p-3 font-semibold">{o.order_number}</td>
                    <td className="p-3">{o.customer_name}<br /><span className="text-xs text-pop-dark/40">{o.phone}</span></td>
                    <td className="p-3">{o.total.toLocaleString("fr-FR")} F</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-pop-dark/10">{STATUS_LABELS[o.status]}</span>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => openOrder(o.id)} className="text-pop-orange font-semibold">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        {selected ? (
          <div className="bg-white rounded-xl2 p-5 shadow-card sticky top-6">
            <h2 className="font-bold mb-1">{selected.order_number}</h2>
            <span className="inline-block px-2 py-1 rounded-full text-xs bg-pop-dark/10 mb-3">{STATUS_LABELS[selected.status]}</span>

            <div className="text-sm space-y-1 mb-4">
              <p><strong>{selected.customer_name}</strong> — {selected.phone}</p>
              {selected.whatsapp && <p>WhatsApp : {selected.whatsapp}</p>}
              <p>{selected.address}, {selected.quartier}</p>
              {selected.landmark && <p>Repère : {selected.landmark}</p>}
              {selected.extra_notes && <p>Note : {selected.extra_notes}</p>}
            </div>

            <ul className="text-sm divide-y mb-4">
              {selected.items.map((it) => (
                <li key={it.id} className="py-1.5 flex justify-between">
                  <span>{it.quantity} × {it.product_name}</span>
                  <span>{it.line_total.toLocaleString("fr-FR")} F</span>
                </li>
              ))}
            </ul>
            <div className="text-sm font-bold flex justify-between mb-4">
              <span>Total</span>
              <span>{selected.total.toLocaleString("fr-FR")} F</span>
            </div>

            {selected.payment_proof_url && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-1">Preuve de paiement</p>
                <p className="text-xs text-pop-dark/50 mb-2">Numéro utilisé : {selected.payment_number_used}</p>
                <img src={imageUrl(selected.payment_proof_url)} alt="Preuve" className="w-full rounded-lg border" />
              </div>
            )}

            {selected.status === "paiement_a_verifier" && (
              <div className="space-y-2 mb-4 border-t pt-4">
                <p className="text-sm font-semibold">Vérifier le paiement</p>
                <button onClick={() => decidePayment(true)} className="w-full bg-green-600 text-white font-semibold py-2 rounded-full">
                  ✅ Approuver le paiement
                </button>
                <input
                  placeholder="Motif du rejet"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={() => decidePayment(false)} className="w-full bg-pop-red text-white font-semibold py-2 rounded-full">
                  ❌ Rejeter le paiement
                </button>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">Changer le statut</p>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl2 p-5 shadow-card text-sm text-pop-dark/50">
            Sélectionnez une commande pour voir les détails.
          </div>
        )}
      </div>
    </div>
  );
}
