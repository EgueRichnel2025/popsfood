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

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-pop-cream text-left">
            <tr>
              <th className="p-3">Nom</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 text-pop-dark/50">{c.slug}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${c.is_active ? "bg-green-100 text-green-700" : "bg-pop-dark/10 text-pop-dark/50"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => startEdit(c)} className="text-pop-orange font-semibold">
                    Modifier
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-pop-red font-semibold">
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
