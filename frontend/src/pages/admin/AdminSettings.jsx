import React, { useEffect, useState } from "react";
import { api, imageUrl } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";

export default function AdminSettings() {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  useEffect(() => {
    api.get("/api/settings").then(setForm);
  }, []);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.postForm("/api/settings/upload-image", fd, true);
      setForm((f) => ({ ...f, logo_url: res.url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      const updated = await api.put("/api/settings", form, true);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!form) return <Loader />;

  async function handleResetTestData(e) {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetSubmitting(true);
    try {
      const res = await api.post("/api/orders/admin/reset-test-data", { current_password: resetPassword }, true);
      setResetMessage(res.message);
      setResetPassword("");
      setConfirmStep(false);
    } catch (err) {
      setResetError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  }

  const field = (key, label, type = "text") => (
    <div>
      <label className="text-xs text-pop-dark/50 block mb-1">{label}</label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border rounded-lg px-3 py-2 text-sm"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Paramètres du restaurant</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card space-y-5">
        <h2 className="font-semibold">Informations générales</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {field("restaurant_name", "Nom du restaurant")}
          {field("city", "Ville")}
          {field("phone", "Téléphone")}
          {field("whatsapp", "WhatsApp")}
          {field("opening_hours", "Horaires")}
        </div>
        <div>
          <label className="text-xs text-pop-dark/50 block mb-1">Logo</label>
          <input type="file" accept="image/*" onChange={handleLogoUpload} />
          {uploading && <span className="text-xs text-pop-dark/40 ml-2">Envoi...</span>}
          {form.logo_url && <img src={imageUrl(form.logo_url)} className="h-12 mt-2 rounded" alt="" />}
        </div>

        <h2 className="font-semibold pt-2">Paiement (preuve manuelle)</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {field("payment_number", "Numéro de dépôt")}
          {field("payment_beneficiary", "Nom du bénéficiaire")}
        </div>
        <div>
          <label className="text-xs text-pop-dark/50 block mb-1">Instructions de paiement</label>
          <textarea
            value={form.payment_instructions || ""}
            onChange={(e) => setForm((f) => ({ ...f, payment_instructions: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="text-xs text-pop-dark/50 block mb-1">Note sur les frais de transaction</label>
          <input
            value={form.payment_fee_note || ""}
            onChange={(e) => setForm((f) => ({ ...f, payment_fee_note: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <h2 className="font-semibold pt-2">Réseaux sociaux</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {field("tiktok_url", "URL TikTok")}
          {field("facebook_url", "URL Facebook")}
          {field("instagram_url", "URL Instagram")}
        </div>

        {error && <p className="text-sm text-pop-red">{error}</p>}
        {saved && <p className="text-sm text-green-600 font-semibold">✅ Paramètres enregistrés.</p>}

        <button className="bg-pop-red text-white font-semibold px-6 py-2.5 rounded-full hover:bg-pop-orange">
          Enregistrer les paramètres
        </button>
      </form>

      <div className="bg-white rounded-xl2 p-5 shadow-card mt-8 border-2 border-pop-red/20">
        <h2 className="font-semibold text-pop-red mb-2">⚠️ Zone dangereuse</h2>
        <p className="text-sm text-pop-dark/60 mb-4">
          Supprime définitivement <strong>toutes les commandes et tous les avis</strong> (remise à zéro
          avant de livrer le site à un client). Le menu, les catégories, les promotions, les zones de
          livraison et les paramètres restent intacts.
        </p>

        {resetMessage && <p className="text-sm text-green-600 font-semibold mb-3">✅ {resetMessage}</p>}

        {!confirmStep ? (
          <button
            onClick={() => setConfirmStep(true)}
            className="bg-white border-2 border-pop-red text-pop-red font-semibold px-5 py-2 rounded-full hover:bg-pop-red hover:text-white transition-colors"
          >
            Réinitialiser les commandes et avis
          </button>
        ) : (
          <form onSubmit={handleResetTestData} className="space-y-3 max-w-sm">
            <label className="text-xs text-pop-dark/50 block mb-1">
              Confirmez avec votre mot de passe actuel
            </label>
            <PasswordInput
              required
              placeholder="Mot de passe"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
            {resetError && <p className="text-sm text-pop-red">{resetError}</p>}
            <div className="flex gap-2">
              <button
                disabled={resetSubmitting}
                className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange disabled:opacity-50"
              >
                {resetSubmitting ? "Suppression..." : "Confirmer la suppression définitive"}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmStep(false); setResetError(""); setResetPassword(""); }}
                className="px-5 py-2 rounded-full border text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}