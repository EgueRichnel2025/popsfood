import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

const empty = { name: "", fee: "", is_active: true };

export default function AdminDelivery() {
  const [zones, setZones] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/api/delivery-zones?include_inactive=true", true).then(setZones);
  }
  useEffect(load, []);

  function startEdit(z) {
    setEditingId(z.id);
    setForm({ ...z });
  }
  function cancelEdit() {
    setEditingId(null);
    setForm(empty);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, fee: Number(form.fee) };
      if (editingId) {
        await api.put(`/api/delivery-zones/${editingId}`, payload, true);
      } else {
        await api.post("/api/delivery-zones", payload, true);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette zone de livraison ?")) return;
    await api.del(`/api/delivery-zones/${id}`, true);
    load();
  }

  if (!zones) return <Loader />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Zones de livraison</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl2 p-5 shadow-card mb-6 grid sm:grid-cols-3 gap-3 items-end">
        <input required placeholder="Nom de la zone" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        <input required type="number" placeholder="Frais (FCFA)" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
        </label>
        {error && <p className="text-sm text-pop-red sm:col-span-3">{error}</p>}
        <div className="sm:col-span-3 flex gap-2">
          <button className="bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
            {editingId ? "Enregistrer" : "Ajouter la zone"}
          </button>
          {editingId && <button type="button" onClick={cancelEdit} className="px-5 py-2 rounded-full border text-sm">Annuler</button>}
        </div>
      </form>

      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-pop-cream text-left">
            <tr><th className="p-3">Zone</th><th className="p-3">Frais</th><th className="p-3">Statut</th><th className="p-3"></th></tr>
          </thead>
          <tbody className="divide-y">
            {zones.map((z) => (
              <tr key={z.id}>
                <td className="p-3 font-semibold">{z.name}</td>
                <td className="p-3">{z.fee.toLocaleString("fr-FR")} F</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${z.is_active ? "bg-green-100 text-green-700" : "bg-pop-dark/10"}`}>{z.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => startEdit(z)} className="text-pop-orange font-semibold">Modifier</button>
                  <button onClick={() => handleDelete(z.id)} className="text-pop-red font-semibold">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
