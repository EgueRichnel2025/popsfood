import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/client";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);
    try {
      const res = await api.post("/api/admin/auth/forgot-password", { email });
      setMessage(res.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-pop-dark flex items-center justify-center px-4">
      <div className="bg-white rounded-xl2 p-8 w-full max-w-sm shadow-card">
        <h1 className="text-xl font-bold text-center mb-1">Mot de passe oublié</h1>
        <p className="text-center text-sm text-pop-dark/50 mb-6">
          Recevez un lien de réinitialisation par email.
        </p>

        {message ? (
          <p className="text-sm text-green-600 font-semibold text-center">✅ {message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="Votre email admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-pop-red">{error}</p>}
            <button
              disabled={submitting}
              className="w-full bg-pop-red text-white font-semibold py-2.5 rounded-full hover:bg-pop-orange disabled:opacity-50"
            >
              {submitting ? "Envoi..." : "Envoyer le lien de réinitialisation"}
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