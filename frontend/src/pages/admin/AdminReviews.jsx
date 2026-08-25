import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";
import StarRating from "../../components/StarRating.jsx";

export default function AdminReviews() {
  const [reviews, setReviews] = useState(null);

  function load() {
    api.get("/api/reviews/admin/all", true).then(setReviews);
  }
  useEffect(load, []);

  async function moderate(id, patch) {
    await api.put(`/api/reviews/${id}/moderate`, patch, true);
    load();
  }

  async function remove(id) {
    if (!confirm("Supprimer cet avis définitivement ?")) return;
    await api.del(`/api/reviews/${id}`, true);
    load();
  }

  if (!reviews) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Avis clients</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-xl2 p-5 shadow-card flex justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={r.rating} size="text-sm" />
                <span className="font-semibold text-sm">{r.customer_name}</span>
              </div>
              <p className="text-sm text-pop-dark/70">{r.comment}</p>
              <p className="text-xs text-pop-dark/40 mt-1">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
              <div className="flex gap-2 mt-2">
                {r.is_approved && !r.is_hidden && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Visible</span>}
                {!r.is_approved && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">En attente</span>}
                {r.is_hidden && <span className="text-xs bg-pop-dark/10 px-2 py-1 rounded-full">Masqué</span>}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm whitespace-nowrap">
              {!r.is_approved && (
                <button onClick={() => moderate(r.id, { is_approved: true })} className="text-green-600 font-semibold">Approuver</button>
              )}
              {r.is_approved && !r.is_hidden && (
                <button onClick={() => moderate(r.id, { is_hidden: true })} className="text-pop-orange font-semibold">Masquer</button>
              )}
              {r.is_hidden && (
                <button onClick={() => moderate(r.id, { is_hidden: false })} className="text-pop-orange font-semibold">Afficher</button>
              )}
              <button onClick={() => remove(r.id)} className="text-pop-red font-semibold">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
