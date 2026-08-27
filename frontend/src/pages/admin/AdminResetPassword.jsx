import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import PasswordInput from "../../components/PasswordInput.jsx";

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Lien invalide : aucun jeton de réinitialisation trouvé.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/admin/auth/reset-password", { token, new_password: newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/admin/login"), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-pop-dark flex items-center justify-center px-4">
      <div className="bg-white rounded-xl2 p-8 w-full max-w-sm shadow-card">
        <h1 className="text-xl font-bold text-center mb-1">Nouveau mot de passe</h1>
        <p className="text-center text-sm text-pop-dark/50 mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        {!token && (
          <p className="text-sm text-pop-red text-center mb-4">
            Lien invalide. Refaites une demande de réinitialisation.
          </p>
        )}

        {success ? (
          <p className="text-sm text-green-600 font-semibold text-center">
            ✅ Mot de passe réinitialisé ! Redirection vers la connexion...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              required
              placeholder="Nouveau mot de passe (8 caractères min.)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <PasswordInput
              required
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-sm text-pop-red">{error}</p>}
            <button
              disabled={submitting || !token}
              className="w-full bg-pop-red text-white font-semibold py-2.5 rounded-full hover:bg-pop-orange disabled:opacity-50"
            >
              {submitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        <Link to="/admin/login" className="block text-center text-sm text-pop-dark/40 mt-4">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}