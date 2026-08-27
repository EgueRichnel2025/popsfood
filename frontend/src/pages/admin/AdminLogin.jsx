import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-pop-dark flex items-center justify-center px-4">
      <div className="bg-white rounded-xl2 p-8 w-full max-w-sm shadow-card">
        <h1 className="text-xl font-bold text-center mb-1">
          Pop's <span className="text-pop-red">FOOD</span> BENIN
        </h1>
        <p className="text-center text-sm text-pop-dark/50 mb-6">Espace administrateur</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
          />
          <PasswordInput
            required
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-pop-red">{error}</p>}
          <button
            disabled={loading}
            className="w-full bg-pop-red text-white font-semibold py-2.5 rounded-full hover:bg-pop-orange disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <Link to="/admin/mot-de-passe-oublie" className="block text-center text-sm text-pop-dark/40 mt-4">
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  );
}