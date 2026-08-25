import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-[slideIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-display font-bold text-lg">Votre panier</h2>
          <button onClick={() => setIsOpen(false)} className="text-2xl leading-none text-pop-dark/50 hover:text-pop-dark">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-pop-dark/50 gap-2">
              <span className="text-4xl">🛒</span>
              <p>Votre panier est vide.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.lineId} className="flex gap-3 border-b pb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.productName}</p>
                    {item.optionLabels?.length > 0 && (
                      <p className="text-xs text-pop-dark/50">{item.optionLabels.join(", ")}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="w-7 h-7 rounded-full bg-pop-cream font-bold"
                        onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        className="w-7 h-7 rounded-full bg-pop-cream font-bold"
                        onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="ml-auto text-xs text-pop-red/70 hover:text-pop-red"
                        onClick={() => removeItem(item.lineId)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                  <div className="font-bold text-sm whitespace-nowrap">
                    {(item.unitPrice * item.quantity).toLocaleString("fr-FR")} F
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm text-pop-dark/70">
              <span>Sous-total</span>
              <span className="font-semibold text-pop-dark">{subtotal.toLocaleString("fr-FR")} F</span>
            </div>
            <p className="text-xs text-pop-dark/40">Frais de livraison calculés à l'étape suivante.</p>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/commande");
              }}
              className="w-full bg-pop-red text-white font-semibold py-3 rounded-full hover:bg-pop-orange transition-colors"
            >
              Passer la commande
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
