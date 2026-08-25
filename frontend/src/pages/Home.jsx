import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, imageUrl } from "../api/client";
import ProductCard from "../components/ProductCard.jsx";
import StarRating from "../components/StarRating.jsx";
import { Loader } from "../components/Misc.jsx";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [promos, setPromos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/products/featured"),
      api.get("/api/categories"),
      api.get("/api/promotions/highlighted"),
      api.get("/api/reviews"),
      api.get("/api/reviews/summary"),
    ])
      .then(([f, c, p, r, s]) => {
        setFeatured(f);
        setCategories(c);
        setPromos(p);
        setReviews(r.slice(0, 3));
        setSummary(s);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-pop-orange via-pop-red to-pop-red overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center relative z-10">
          <div className="text-white">
            <span className="inline-block bg-white/15 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              📍 Livraison à Calavi, Bénin
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              La faim appelle,<br /> Pop's répond. 🍔🔥
            </h1>
            <p className="text-white/85 mb-8 max-w-md">
              Shawarma, burgers, pizzas et frites personnalisées, livrés chauds directement chez vous.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="bg-pop-yellow text-pop-dark font-bold px-6 py-3 rounded-full shadow-card hover:scale-105 transition-transform"
              >
                Commander maintenant
              </Link>
              <Link
                to="/menu"
                className="bg-white/15 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/25 transition-colors"
              >
                Voir le menu
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-72 h-72 rounded-full bg-white/10 flex items-center justify-center text-[10rem]">
              🍔
            </div>
          </div>
        </div>
      </section>

      {/* PRESENTATION */}
      <section className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-6 text-center">
        {[
          ["🚚", "Livraison rapide", "Vos plats livrés chauds à Calavi et ses environs."],
          ["🧾", "Paiement simple", "Payez par mobile money et envoyez votre preuve de paiement."],
          ["⭐", "Qualité garantie", "Des ingrédients frais et des recettes gourmandes."],
        ].map(([icon, title, text]) => (
          <div key={title} className="bg-white rounded-xl2 p-6 shadow-card">
            <div className="text-3xl mb-2">{icon}</div>
            <h3 className="font-display font-semibold mb-1">{title}</h3>
            <p className="text-sm text-pop-dark/60">{text}</p>
          </div>
        ))}
      </section>

      {loading ? (
        <Loader />
      ) : (
        <>
          {/* PROMOTIONS */}
          {promos.length > 0 && (
            <section className="max-w-6xl mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold mb-6">🔥 Promotions du moment</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {promos.map((promo) => (
                  <div key={promo.id} className="bg-white rounded-xl2 overflow-hidden shadow-card flex">
                    {promo.image_url && (
                      <img src={imageUrl(promo.image_url)} alt={promo.title} className="w-32 object-cover" />
                    )}
                    <div className="p-4 flex-1">
                      <span className="bg-pop-red text-white text-xs font-bold px-2 py-1 rounded-full">PROMO</span>
                      <h3 className="font-display font-semibold mt-2">{promo.title}</h3>
                      <p className="text-xs text-pop-dark/60 mb-2">{promo.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-pop-red">{promo.promo_price.toLocaleString("fr-FR")} F</span>
                        <span className="text-xs line-through text-pop-dark/40">
                          {promo.regular_price.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORIES */}
          <section className="max-w-6xl mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Nos catégories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/menu?categorie=${cat.id}`}
                  className="bg-white rounded-xl2 p-5 text-center shadow-card hover:-translate-y-1 transition-transform"
                >
                  <div className="font-display font-semibold">{cat.name}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* FEATURED PRODUCTS */}
          <section className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Produits populaires</h2>
              <Link to="/menu" className="text-pop-red text-sm font-semibold">
                Voir tout le menu →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="bg-white py-12 mt-8">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8 text-center">Comment ça marche ?</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  ["1️⃣", "Choisissez vos plats", "Parcourez le menu et personnalisez vos options."],
                  ["2️⃣", "Renseignez la livraison", "Indiquez votre quartier et un repère précis."],
                  ["3️⃣", "Payez & envoyez la preuve", "Effectuez le paiement et téléversez la capture."],
                  ["4️⃣", "Suivez votre commande", "Recevez vos plats chauds et suivez le statut en direct."],
                ].map(([n, title, text]) => (
                  <div key={title} className="text-center">
                    <div className="text-3xl mb-2">{n}</div>
                    <h3 className="font-semibold mb-1">{title}</h3>
                    <p className="text-sm text-pop-dark/60">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* REVIEWS */}
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Avis clients</h2>
              {summary.count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <StarRating value={Math.round(summary.average)} />
                  <span className="text-pop-dark/60">
                    {summary.average} / 5 ({summary.count} avis)
                  </span>
                </div>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-pop-dark/50 text-sm">Soyez le premier à laisser un avis !</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl2 p-5 shadow-card">
                    <StarRating value={r.rating} size="text-sm" />
                    <p className="text-sm text-pop-dark/70 mt-2">"{r.comment}"</p>
                    <p className="text-xs text-pop-dark/40 mt-2 font-semibold">— {r.customer_name}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="bg-pop-dark py-16">
            <div className="max-w-4xl mx-auto px-4 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">Une envie de fast-food ?</h2>
              <p className="text-white/60 mb-8">Commandez maintenant, on s'occupe du reste.</p>
              <Link
                to="/menu"
                className="inline-block bg-pop-orange font-bold px-8 py-4 rounded-full shadow-card hover:bg-pop-red transition-colors"
              >
                Commander maintenant
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
