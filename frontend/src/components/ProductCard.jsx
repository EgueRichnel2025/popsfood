import React from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../api/client";

export default function ProductCard({ product }) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Link
      to={`/produit/${product.slug}`}
      className="group bg-white rounded-xl2 overflow-hidden shadow-card hover:-translate-y-1 transition-transform duration-200 flex flex-col"
    >
      <div className="relative h-40 overflow-hidden bg-pop-cream">
        {product.image_url ? (
          <img
            src={imageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-pop-red text-white text-xs font-bold px-2 py-1 rounded-full">
            PROMO
          </span>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-sm">
            Indisponible
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-display font-semibold text-pop-dark leading-tight">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-pop-dark/60 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto pt-2 flex items-center gap-2">
          <span className="font-bold text-pop-red">{product.price.toLocaleString("fr-FR")} F</span>
          {hasDiscount && (
            <span className="text-xs text-pop-dark/40 line-through">
              {product.compare_at_price.toLocaleString("fr-FR")} F
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
