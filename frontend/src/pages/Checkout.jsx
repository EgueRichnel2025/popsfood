import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { useCart } from "../context/CartContext.jsx";

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    whatsapp: "",
    delivery_zone_id: "",
    address: "",
    quartier: "",
    landmark: "",
    extra_notes: "",
    gps_lat: null,
    gps_lng: null,
  });
  const [gpsStatus, setGpsStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/delivery-zones").then(setZones);
  }, []);

  useEffect(() => {
    if (items.length === 0) navigate("/menu");
  }, [items, navigate]);

  const selectedZone = zones.find((z) => z.id === form.delivery_zone_id);
  const deliveryFee = selectedZone ? selectedZone.fee : 0;
  const total = subtotal + deliveryFee;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function useGps() {
    if (!navigator.geolocation) {
      setGpsStatus("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGpsStatus("Localisation en cours...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("gps_lat", pos.coords.latitude);
        update("gps_lng", pos.coords.longitude);
        setGpsStatus("✅ Position ajoutée à votre commande.");
      },
      () => setGpsStatus("Impossible d'obtenir votre position. Vous pouvez continuer sans."),
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.customer_name || !form.phone || !form.address || !form.quartier) {
      setError("Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (!form.delivery_zone_id) {
      setError("Merci de sélectionner votre zone de livraison.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
          selected_option_choice_ids: it.optionIds,
        })),
      };
      const order = await api.post("/api/orders", payload);
      clearCart();
      navigate(`/paiement/${order.id}`, { state: { orderNumber: order.order_number, total: order.total } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Finaliser la commande</h1>

      <div className="bg-white rounded-xl2 p-5 shadow-card mb-6">
        <h2 className="font-semibold mb-3">Résumé du panier</h2>
        <ul className="text-sm divide-y">
          {items.map((it) => (
            <li key={it.lineId} className="py-2 flex justify-between">
              <span>
                {it.quantity} × {it.productName}
                {it.optionLabels?.length > 0 && (
                  <span className="text-pop-dark/50"> ({it.optionLabels.join(", ")})</span>
                )}
              </span>
              <span className="font-semibold">{(it.unitPrice * it.quantity).toLocaleString("fr-FR")} F</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card space-y-4">
        <h2 className="font-semibold">Vos informations</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Nom complet *"
            value={form.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Téléphone *"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="WhatsApp (si différent)"
            value={form.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm sm:col-span-2"
          />
        </div>

        <h2 className="font-semibold pt-2">Livraison</h2>
        <p className="text-xs text-pop-dark/50 -mt-2">
          Donnez le plus de précisions possible pour que le livreur retrouve facilement votre emplacement.
        </p>

        <select
          required
          value={form.delivery_zone_id}
          onChange={(e) => update("delivery_zone_id", e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Sélectionnez votre zone de livraison *</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} — {z.fee.toLocaleString("fr-FR")} F
            </option>
          ))}
        </select>

        <input
          required
          placeholder="Adresse *"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Quartier *"
          value={form.quartier}
          onChange={(e) => update("quartier", e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Repère (ex : près de la pharmacie X)"
          value={form.landmark}
          onChange={(e) => update("landmark", e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Précision supplémentaire (optionnel)"
          value={form.extra_notes}
          onChange={(e) => update("extra_notes", e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
          rows={2}
        />

        <div>
          <button
            type="button"
            onClick={useGps}
            className="text-sm font-semibold text-pop-orange border border-pop-orange/30 px-4 py-2 rounded-full hover:bg-pop-orange/10"
          >
            📍 Partager ma position GPS (facultatif)
          </button>
          {gpsStatus && <p className="text-xs text-pop-dark/50 mt-1">{gpsStatus}</p>}
        </div>

        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Sous-total</span>
            <span>{subtotal.toLocaleString("fr-FR")} F</span>
          </div>
          <div className="flex justify-between">
            <span>Frais de livraison</span>
            <span>{deliveryFee.toLocaleString("fr-FR")} F</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Total</span>
            <span>{total.toLocaleString("fr-FR")} F</span>
          </div>
        </div>

        {error && <p className="text-sm text-pop-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-pop-red text-white font-semibold py-3 rounded-full hover:bg-pop-orange transition-colors disabled:opacity-50"
        >
          {submitting ? "Envoi en cours..." : "Valider la commande"}
        </button>
        <Link to="/menu" className="block text-center text-sm text-pop-dark/50">
          ← Continuer mes achats
        </Link>
      </form>
    </div>
  );
}
