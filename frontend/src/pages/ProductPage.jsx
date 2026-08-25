import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, imageUrl } from "../api/client";
import { useCart } from "../context/CartContext.jsx";
import { Loader } from "../components/Misc.jsx";

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selections, setSelections] = useState({}); // groupId -> [choiceId]
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setProduct(null);
    setSelections({});
    setAdded(false);
    api.get(`/api/products/slug/${slug}`).then(setProduct);
  }, [slug]);

  if (!product) return <Loader />;

  function toggleChoice(group, choice) {
    setSelections((prev) => {
      const current = prev[group.id] || [];
      if (group.allow_multiple) {
        const exists = current.includes(choice.id);
        let next;
        if (exists) {
          next = current.filter((id) => id !== choice.id);
        } else {
          if (current.length >= group.max_choices) return prev; // limit reached
          next = [...current, choice.id];
        }
        return { ...prev, [group.id]: next };
      }
      return { ...prev, [group.id]: [choice.id] };
    });
  }

  function computeUnitPrice() {
    let price = product.price;
    for (const group of product.option_groups) {
      const chosen = selections[group.id] || [];
      for (const choiceId of chosen) {
        const choice = group.choices.find((c) => c.id === choiceId);
        if (choice) price += choice.extra_price;
      }
    }
    return price;
  }

  function handleAddToCart() {
    for (const group of product.option_groups) {
      const chosen = selections[group.id] || [];
      if (group.is_required && chosen.length === 0) {
        setError(`Veuillez choisir une option pour « ${group.name} ».`);
        return;
      }
    }
    setError("");

    const optionIds = [];
    const optionLabels = [];
    for (const group of product.option_groups) {
      const chosen = selections[group.id] || [];
      for (const choiceId of chosen) {
        const choice = group.choices.find((c) => c.id === choiceId);
        if (choice) {
          optionIds.push(choice.id);
          optionLabels.push(choice.label);
        }
      }
    }

    addItem({
      productId: product.id,
      productName: product.name,
      unitPrice: computeUnitPrice(),
      quantity,
      optionIds,
      optionLabels,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-sm text-pop-dark/50 mb-4">
        ← Retour
      </button>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="rounded-xl2 overflow-hidden bg-pop-cream h-72 md:h-96">
          {product.image_url ? (
            <img src={imageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <p className="text-pop-dark/60 mb-4">{product.description}</p>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold text-pop-red">{product.price.toLocaleString("fr-FR")} F</span>
            {hasDiscount && (
              <span className="text-sm line-through text-pop-dark/40">
                {product.compare_at_price.toLocaleString("fr-FR")} F
              </span>
            )}
            {!product.is_available && (
              <span className="text-xs bg-pop-dark/10 px-2 py-1 rounded-full">Indisponible</span>
            )}
          </div>

          {product.option_groups
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
            .map((group) => (
              <div key={group.id} className="mb-5">
                <h3 className="font-semibold mb-2 text-sm">
                  {group.name}
                  {group.is_required && <span className="text-pop-red ml-1">*</span>}
                  {group.allow_multiple && (
                    <span className="text-xs text-pop-dark/40 ml-2">(max {group.max_choices})</span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.choices
                    .filter((c) => c.is_available)
                    .map((choice) => {
                      const chosen = (selections[group.id] || []).includes(choice.id);
                      return (
                        <button
                          key={choice.id}
                          onClick={() => toggleChoice(group, choice)}
                          className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                            chosen
                              ? "bg-pop-orange text-white border-pop-orange"
                              : "bg-white text-pop-dark/70 border-pop-dark/10 hover:border-pop-orange"
                          }`}
                        >
                          {choice.label}
                          {choice.extra_price > 0 && ` (+${choice.extra_price.toLocaleString("fr-FR")} F)`}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-semibold">Quantité</span>
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-pop-cream font-bold"
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-full bg-pop-cream font-bold"
            >
              +
            </button>
          </div>

          {error && <p className="text-sm text-pop-red mb-3">{error}</p>}

          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="w-full bg-pop-red text-white font-semibold py-3 rounded-full hover:bg-pop-orange transition-colors disabled:opacity-40"
          >
            {added ? "✅ Ajouté au panier !" : `Ajouter au panier — ${(computeUnitPrice() * quantity).toLocaleString("fr-FR")} F`}
          </button>
        </div>
      </div>
    </div>
  );
}
