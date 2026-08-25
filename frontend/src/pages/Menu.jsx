import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import ProductCard from "../components/ProductCard.jsx";
import { Loader, EmptyState } from "../components/Misc.jsx";

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryId = searchParams.get("categorie") || "";
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/categories").then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set("category_id", categoryId);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    api
      .get(`/api/products?${params.toString()}`)
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [categoryId, search, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Notre Menu</h1>
      <p className="text-pop-dark/60 mb-6">Découvrez tous nos plats, personnalisez et ajoutez au panier.</p>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher un plat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-pop-dark/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pop-orange/40"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-pop-dark/10 rounded-full px-4 py-2 text-sm"
        >
          <option value="">Trier par</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
          <option value="newest">Plus récents</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
            !categoryId ? "bg-pop-red text-white" : "bg-white text-pop-dark/70"
          }`}
        >
          Tout
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSearchParams({ categorie: c.id })}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              categoryId === c.id ? "bg-pop-red text-white" : "bg-white text-pop-dark/70"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <EmptyState title="Aucun produit trouvé" subtitle="Essayez une autre recherche ou catégorie." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
