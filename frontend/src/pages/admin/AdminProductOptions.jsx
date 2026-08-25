import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client";
import { Loader } from "../../components/Misc.jsx";

export default function AdminProductOptions() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: "", is_required: false, allow_multiple: false, max_choices: 1 });
  const [choiceForms, setChoiceForms] = useState({}); // groupId -> {label, extra_price}
  const [error, setError] = useState("");

  function load() {
    api.get(`/api/products/${productId}`).then(setProduct);
  }
  useEffect(load, [productId]);

  async function addGroup(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/api/products/${productId}/option-groups`, { ...groupForm, choices: [] }, true);
      setGroupForm({ name: "", is_required: false, allow_multiple: false, max_choices: 1 });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteGroup(groupId) {
    if (!confirm("Supprimer ce groupe d'options ?")) return;
    await api.del(`/api/products/option-groups/${groupId}`, true);
    load();
  }

  async function addChoice(groupId) {
    const form = choiceForms[groupId];
    if (!form?.label) return;
    try {
      await api.post(`/api/products/option-groups/${groupId}/choices`, {
        label: form.label,
        extra_price: Number(form.extra_price || 0),
      }, true);
      setChoiceForms((f) => ({ ...f, [groupId]: { label: "", extra_price: "" } }));
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteChoice(choiceId) {
    if (!confirm("Supprimer cette option ?")) return;
    await api.del(`/api/products/option-choices/${choiceId}`, true);
    load();
  }

  if (!product) return <Loader />;

  return (
    <div>
      <Link to="/admin/produits" className="text-sm text-pop-dark/50">← Retour aux produits</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">Options — {product.name}</h1>
      <p className="text-sm text-pop-dark/50 mb-6">
        Gérez les accompagnements, sauces et suppléments configurables pour ce produit, sans toucher au code.
      </p>

      <form onSubmit={addGroup} className="bg-white rounded-xl2 p-5 shadow-card mb-6 grid sm:grid-cols-2 gap-3">
        <input
          required
          placeholder="Nom du groupe (ex: Sauce, Fromage, Supplément)"
          value={groupForm.name}
          onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
          className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={groupForm.is_required} onChange={(e) => setGroupForm((f) => ({ ...f, is_required: e.target.checked }))} />
          Obligatoire
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={groupForm.allow_multiple} onChange={(e) => setGroupForm((f) => ({ ...f, allow_multiple: e.target.checked }))} />
          Choix multiples
        </label>
        {groupForm.allow_multiple && (
          <input
            type="number"
            min={1}
            placeholder="Nombre maximum de choix"
            value={groupForm.max_choices}
            onChange={(e) => setGroupForm((f) => ({ ...f, max_choices: Number(e.target.value) }))}
            className="border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
          />
        )}
        {error && <p className="text-sm text-pop-red sm:col-span-2">{error}</p>}
        <button className="sm:col-span-2 bg-pop-red text-white font-semibold px-5 py-2 rounded-full hover:bg-pop-orange">
          Ajouter le groupe d'options
        </button>
      </form>

      <div className="space-y-4">
        {product.option_groups.map((group) => (
          <div key={group.id} className="bg-white rounded-xl2 p-5 shadow-card">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-xs text-pop-dark/50">
                  {group.is_required ? "Obligatoire" : "Optionnel"} · {group.allow_multiple ? `Multi (max ${group.max_choices})` : "Choix unique"}
                </p>
              </div>
              <button onClick={() => deleteGroup(group.id)} className="text-pop-red text-sm font-semibold">
                Supprimer le groupe
              </button>
            </div>

            <ul className="divide-y mb-3">
              {group.choices.map((c) => (
                <li key={c.id} className="py-2 flex justify-between items-center text-sm">
                  <span>{c.label} {c.extra_price > 0 && <span className="text-pop-dark/50">(+{c.extra_price} F)</span>}</span>
                  <button onClick={() => deleteChoice(c.id)} className="text-pop-red text-xs font-semibold">Supprimer</button>
                </li>
              ))}
            </ul>

            <div className="flex gap-2">
              <input
                placeholder="Nouveau choix (ex: Fromage fondant)"
                value={choiceForms[group.id]?.label || ""}
                onChange={(e) => setChoiceForms((f) => ({ ...f, [group.id]: { ...f[group.id], label: e.target.value } }))}
                className="flex-1 border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Prix suppl."
                value={choiceForms[group.id]?.extra_price || ""}
                onChange={(e) => setChoiceForms((f) => ({ ...f, [group.id]: { ...f[group.id], extra_price: e.target.value } }))}
                className="w-28 border border-pop-dark/10 rounded-lg px-3 py-2 text-sm"
              />
              <button onClick={() => addChoice(group.id)} className="bg-pop-orange text-white text-sm font-semibold px-4 rounded-lg">
                Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
