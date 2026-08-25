import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import StarRating from "../components/StarRating.jsx";

export default function Contact() {
  const [settings, setSettings] = useState(null);
  const [reviewForm, setReviewForm] = useState({ customer_name: "", rating: 5, comment: "" });
  const [reviewSent, setReviewSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/settings").then(setSettings);
  }, []);

  async function submitReview(e) {
    e.preventDefault();
    setError("");
    if (!reviewForm.comment) {
      setError("Merci d'écrire un commentaire.");
      return;
    }
    try {
      await api.post("/api/reviews", reviewForm);
      setReviewSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Contact</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-white rounded-xl2 p-5 shadow-card">
          <h2 className="font-semibold mb-2">📍 Pop's FOOD BENIN</h2>
          <p className="text-sm text-pop-dark/60">{settings?.city || "Calavi, Bénin"}</p>
          {settings?.opening_hours && <p className="text-sm text-pop-dark/60 mt-1">🕒 {settings.opening_hours}</p>}
          {settings?.phone && <p className="text-sm text-pop-dark/60 mt-1">📞 {settings.phone}</p>}
        </div>
        <div className="bg-white rounded-xl2 p-5 shadow-card flex flex-col justify-center gap-3">
          {settings?.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="bg-green-500 text-white font-semibold text-center py-2.5 rounded-full hover:bg-green-600"
            >
              💬 Contacter sur WhatsApp
            </a>
          )}
          {settings?.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="bg-pop-orange text-white font-semibold text-center py-2.5 rounded-full hover:bg-pop-red"
            >
              📞 Appeler
            </a>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl2 p-6 shadow-card">
        <h2 className="font-semibold mb-4">Laisser un avis</h2>
        {reviewSent ? (
          <p className="text-sm text-green-600 font-semibold">
            ✅ Merci pour votre avis ! Il sera visible après validation par notre équipe.
          </p>
        ) : (
          <form onSubmit={submitReview} className="space-y-4">
            <input
              placeholder="Votre nom (optionnel)"
              value={reviewForm.customer_name}
              onChange={(e) => setReviewForm((f) => ({ ...f, customer_name: e.target.value }))}
              className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
            />
            <div>
              <label className="text-sm font-semibold block mb-1">Votre note</label>
              <StarRating value={reviewForm.rating} onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))} />
            </div>
            <textarea
              placeholder="Votre commentaire *"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
              className="w-full border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
              rows={3}
            />
            {error && <p className="text-sm text-pop-red">{error}</p>}
            <button className="bg-pop-red text-white font-semibold px-6 py-2.5 rounded-full hover:bg-pop-orange">
              Envoyer mon avis
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
