import React, { useState } from "react";
import { api } from "../../api/client";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";

export default function AdminAccount() {
  const { adminName } = useAdminAuth();
  const [form, setForm] = useState({
    current_password: "",
    full_name: adminName || "",
    email: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.current_password) {
      setError("Merci de saisir votre mot de passe actuel pour confirmer les changements.");
      return;
    }
    if (form.new_password && form.new_password !== form.confirm_password) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (form.new_password && form.new_password.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { current_password: form.current_password };
      if (form.full_name) payload.full_name = form.full_name;
      if (form.email) payload.email = form.email;
      if (form.new_password) payload.new_password = form.new_password;

      const data = await api.put("/api/admin/auth/me", payload, true);

      // Le token peut avoir changé (email modifié) : on le met à jour pour rester connecté
      localStorage.setItem("popsfood_admin_token", data.access_token);
      localStorage.setItem("popsfood_admin_name", data.admin_name);

      setSuccess("✅ Vos informations ont été mises à jour avec succès.");
      setForm((f) => ({ ...f, current_password: "", new_password: "", confirm_password: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Mon compte</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card space-y-4">
        <div>
          <label className="text-xs text-pop-dark/50 block mb-1">Nom complet</label>
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-pop-dark/50 block mb-1">Nouvel email (laisser vide pour ne pas changer)</label>
          <input
            type="email"
            placeholder="nouvel-email@exemple.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t pt-4">
          <label className="text-xs text-pop-dark/50 block mb-1">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
          <input
            type="password"
            placeholder="Au moins 8 caractères"
            value={form.new_password}
            onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          <label className="text-xs text-pop-dark/50 block mb-1">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t pt-4">
          <label className="text-xs text-pop-dark/50 block mb-1">
            Mot de passe actuel <span className="text-pop-red">* (obligatoire pour confirmer)</span>
          </label>
          <input
            type="password"
            required
            value={form.current_password}
            onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-pop-red">{error}</p>}
        {success && <p className="text-sm text-green-600 font-semibold">{success}</p>}

        <button
          disabled={submitting}
          className="bg-pop-red text-white font-semibold px-6 py-2.5 rounded-full hover:bg-pop-orange disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}