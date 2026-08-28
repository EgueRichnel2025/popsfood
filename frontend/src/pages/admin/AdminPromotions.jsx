import React, { useEffect, useState } from "react";
import { api, imageUrl } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

const empty = {
  title: "", description: "", image_url: "", product_id: "",
  regular_price: "", promo_price: "", start_date: "", end_date: "",
  is_active: true, is_highlighted: false,
};

export default function AdminPromotions() {
  const [promos, setPromos] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function load() {
    api.get("/api/promotions/admin/all", true).then(setPromos);
    api.get("/api/products?available_only=false", true).then(setProducts);
  }
  useEffect(load, []);

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      ...p,
      product_id: p.product_id || "",
      start_date: p.start_date.slice(0, 16),
      end_date: p.end_date.slice(0, 16),
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.postForm("/api/settings/upload-image", fd, true);
      setForm((f) => ({ ...f, image_url: res.url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        ...form,
        product_id: form.product_id || null,
        regular_price: Number(form.regular_price),
        promo_price: Number(form.promo_price),
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
      };
      if (editingId) {
        await api.put(`/api/promotions/${editingId}`, payload, true);
      } else {
        await api.post("/api/promotions", payload, true);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette promotion ?")) return;
    await api.del(`/api/promotions/${id}`, true);
    load();
  }

  if (!promos) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Promotions & plats spéciaux</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card mb-6 grid sm:grid-cols-2 gap-3">
        <input required placeholder="Titre" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" rows={2} />
        <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm sm:col-span-2">
          <option value="">Produit lié (optionnel)</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input required type="number" placeholder="Prix normal" value={form.regular_price} onChange={(e) => setForm((f) => ({ ...f, regular_price: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" placeholder="Prix promo" value={form.promo_price} onChange={(e) => setForm((f) => ({ ...f, promo_price: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        <div>
          <label className="text-xs text-pop-dark/50">Début</label>
          <input required type="datetime-local" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-pop-dark/50">Fin</label>
          <input required type="datetime-local" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="text-sm sm:col-span-2">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <span className="text-pop-dark/40 ml-2">Envoi...</span>}
          {form.image_url && <img src={imageUrl(form.image_url)} className="h-12 mt-2 rounded" alt="" />}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_highlighted} onChange={(e) => setForm((f) => ({ ...f, is_highlighted: e.target.checked }))} /> Mettre en avant sur l'accueil
        </label>
        {error && <p className="text-sm text-pop-red sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2 flex gap-2">
          <button className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
            {editingId ? "Enregistrer" : "Créer la promotion"}
          </button>
          {editingId && <button type="button" onClick={cancelEdit} className="px-5 py-2 rounded-full border text-sm">Annuler</button>}
        </div>
      </form>

      <div className="bg-white rounded-xl2 shadow-card divide-y overflow-hidden">
        {promos.map((p) => (
          <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.title} {p.is_highlighted && "⭐"}</p>
              <p className="text-xs text-pop-dark/50">
                {p.promo_price.toLocaleString("fr-FR")} F · {new Date(p.start_date).toLocaleDateString("fr-FR")} → {new Date(p.end_date).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span className={`self-start sm:self-auto shrink-0 px-2 py-1 rounded-full text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-pop-dark/10"}`}>
              {p.is_active ? "Active" : "Inactive"}
            </span>
            <div className="flex gap-4 shrink-0">
              <button onClick={() => startEdit(p)} className="text-pop-orange font-semibold text-sm">Modifier</button>
              <button onClick={() => handleDelete(p.id)} className="text-pop-red font-semibold text-sm">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}