import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imageUrl } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

const empty = {
  name: "", slug: "", description: "", price: "", compare_at_price: "",
  image_url: "", category_id: "", is_available: true, is_featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function load() {
    api.get("/api/products?available_only=false", true).then(setProducts);
    api.get("/api/categories?include_inactive=true", true).then(setCategories);
  }
  useEffect(load, []);

  function slugify(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, slug: p.slug, description: p.description || "",
      price: p.price, compare_at_price: p.compare_at_price || "",
      image_url: p.image_url || "", category_id: p.category_id,
      is_available: p.is_available, is_featured: p.is_featured,
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
    } catch (err) {
      setError(err.message);
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
        price: Number(form.price),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      };
      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload, true);
      } else {
        await api.post("/api/products", payload, true);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer ce produit ?")) return;
    try {
      await api.del(`/api/products/${id}`, true);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!products) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Produits</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card mb-6 grid sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Nom du produit"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <select
          required
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Catégorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="number"
          required
          placeholder="Prix (FCFA)"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Ancien prix (si promo)"
          value={form.compare_at_price}
          onChange={(e) => setForm((f) => ({ ...f, compare_at_price: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <div className="text-sm">
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {uploading && <span className="text-pop-dark/40 ml-2">Envoi...</span>}
          {form.image_url && <img src={imageUrl(form.image_url)} className="h-12 mt-2 rounded" alt="" />}
        </div>
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm sm:col-span-2"
          rows={2}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_available} onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))} />
          Disponible
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
          Mettre en avant (populaire)
        </label>
        {error && <p className="text-sm text-pop-red sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2 flex gap-2">
          <button className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
            {editingId ? "Enregistrer" : "Ajouter le produit"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-5 py-2 rounded-full border text-sm">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl2 shadow-card divide-y overflow-hidden">
        {products.map((p) => (
          <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {p.image_url && (
                <img src={imageUrl(p.image_url)} className="w-10 h-10 rounded object-cover shrink-0" alt="" />
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-pop-dark/50">{p.price.toLocaleString("fr-FR")} F</p>
              </div>
            </div>

            <span className={`self-start sm:self-auto shrink-0 px-2 py-1 rounded-full text-xs ${p.is_available ? "bg-green-100 text-green-700" : "bg-pop-dark/10 text-pop-dark/50"}`}>
              {p.is_available ? "Disponible" : "Indisponible"}
            </span>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0">
              <Link to={`/admin/produits/${p.id}/options`} className="text-pop-orange font-semibold text-sm">
                Options ({p.option_groups.length})
              </Link>
              <button onClick={() => startEdit(p)} className="text-pop-orange font-semibold text-sm">Modifier</button>
              <button onClick={() => handleDelete(p.id)} className="text-pop-red font-semibold text-sm">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}