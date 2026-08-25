import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";

export default function Payment() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [order, setOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [phoneUsed, setPhoneUsed] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const orderNumber = location.state?.orderNumber;
  const total = location.state?.total;

  useEffect(() => {
    api.get("/api/settings").then(setSettings);
  }, []);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)) {
      setError("Format non supporté. Utilisez JPG, PNG ou WEBP.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 5 Mo).");
      return;
    }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) {
      setError("Merci de joindre la capture d'écran du paiement.");
      return;
    }
    if (!phoneUsed) {
      setError("Merci d'indiquer le numéro utilisé pour le paiement.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("payment_number_used", phoneUsed);
      const updated = await api.postForm(`/api/orders/${orderId}/payment-proof`, formData);
      setOrder(updated);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Preuve envoyée !</h1>
        <p className="text-pop-dark/60 mb-6">
          Votre commande <strong>{orderNumber}</strong> est en attente de vérification par notre équipe. Vous serez livré dès validation du paiement.
        </p>
        <Link
          to={`/suivi-commande?numero=${orderNumber}`}
          className="inline-block bg-pop-red text-white font-semibold px-6 py-3 rounded-full hover:bg-pop-orange"
        >
          Suivre ma commande
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">Paiement</h1>
      {orderNumber && (
        <p className="text-sm text-pop-dark/60 mb-6">
          Commande <strong>{orderNumber}</strong> — Total à payer : <strong>{total?.toLocaleString("fr-FR")} F</strong>
        </p>
      )}

      <div className="bg-white rounded-xl2 p-5 shadow-card mb-6 space-y-2">
        <h2 className="font-semibold">Informations de paiement</h2>
        {settings ? (
          <>
            <p className="text-sm">
              💰 Numéro de dépôt : <strong>{settings.payment_number}</strong>
            </p>
            <p className="text-sm">
              👤 Nom de confirmation : <strong>{settings.payment_beneficiary}</strong>
            </p>
            <p className="text-sm text-pop-dark/70">{settings.payment_instructions}</p>
            <p className="text-xs text-pop-orange font-semibold">{settings.payment_fee_note}</p>
          </>
        ) : (
          <p className="text-sm text-pop-dark/40">Chargement des informations de paiement...</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card space-y-4">
        <h2 className="font-semibold">Envoyer la preuve de paiement</h2>

        <input
          placeholder="Numéro ayant effectué le paiement *"
          value={phoneUsed}
          onChange={(e) => setPhoneUsed(e.target.value)}
          className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />

        <div>
          <label className="block text-sm font-semibold mb-2">Capture d'écran du paiement *</label>
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFile} className="text-sm" />
        </div>

        {preview && (
          <img src={preview} alt="Aperçu" className="w-full max-h-64 object-contain rounded-lg border" />
        )}

        {error && <p className="text-sm text-pop-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-pop-red text-white font-semibold py-3 rounded-full hover:bg-pop-orange transition-colors disabled:opacity-50"
        >
          {submitting ? "Envoi en cours..." : "Envoyer la preuve de paiement"}
        </button>
      </form>
    </div>
  );
}
