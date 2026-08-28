import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

const empty = { name: "", slug: "", description: "", image_url: "", display_order: 0, is_active: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/api/categories?include_inactive=true", true).then(setCategories);
  }

  useEffect(load, []);

  function slugify(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ ...cat });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/api/categories/${editingId}`, form, true);
      } else {
        await api.post("/api/categories", form, true);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await api.del(`/api/categories/${id}`, true);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (!categories) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Catégories</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card mb-6 grid sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Nom"
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
        <input
          placeholder="Description"
          value={form.description || ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm sm:col-span-2"
        />
        <input
          type="number"
          placeholder="Ordre d'affichage"
          value={form.display_order}
          onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active
        </label>
        {error && <p className="text-sm text-pop-red sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2 flex gap-2">
          <button className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
            {editingId ? "Enregistrer" : "Ajouter la catégorie"}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="px-5 py-2 rounded-full border text-sm">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl2 shadow-card divide-y overflow-hidden">
        {categories.map((c) => (
          <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-xs text-pop-dark/50 truncate">{c.slug}</p>
            </div>
            <span className={`self-start sm:self-auto shrink-0 px-2 py-1 rounded-full text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-pop-dark/10 text-pop-dark/50"}`}>
              {c.is_active ? "Active" : "Inactive"}
            </span>
            <div className="flex gap-4 shrink-0">
              <button onClick={() => startEdit(c)} className="text-pop-orange font-semibold text-sm">
                Modifier
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-pop-red font-semibold text-sm">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}