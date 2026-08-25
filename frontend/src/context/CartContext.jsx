import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "popsfood_cart_v1";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function lineKey(item) {
    return `${item.productId}::${[...item.optionIds].sort().join(",")}`;
  }

  function addItem(newItem) {
    setItems((prev) => {
      const key = lineKey(newItem);
      const existingIdx = prev.findIndex((it) => lineKey(it) === key);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: copy[existingIdx].quantity + newItem.quantity,
        };
        return copy;
      }
      return [...prev, { ...newItem, lineId: key + "::" + Date.now() }];
    });
    setIsOpen(true);
  }

  function updateQuantity(lineId, quantity) {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    setItems((prev) => prev.map((it) => (it.lineId === lineId ? { ...it, quantity } : it)));
  }

  function removeItem(lineId) {
    setItems((prev) => prev.filter((it) => it.lineId !== lineId));
  }

  function clearCart() {
    setItems([]);
  }

  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        totalQuantity,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
