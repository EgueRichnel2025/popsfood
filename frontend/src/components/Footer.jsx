import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get("/api/settings").then(setSettings).catch(() => {});
  }, []);

  return (
    <footer className="bg-pop-dark text-white mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-display font-bold text-lg mb-2">
            Pop's <span className="text-pop-orange">FOOD</span> BENIN
          </h3>
          <p className="text-white/60 text-sm">
            Fast-food & livraison à {settings?.city || "Calavi, Bénin"}. Livraison uniquement, commandez en quelques clics.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-pop-yellow">Contact</h4>
          <ul className="text-sm text-white/70 space-y-2">
            {settings?.phone && <li>📞 {settings.phone}</li>}
            {settings?.whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-pop-orange"
                >
                  💬 WhatsApp
                </a>
              </li>
            )}
            {settings?.opening_hours && <li>🕒 {settings.opening_hours}</li>}
            <li>
              <Link to="/contact" className="hover:text-pop-orange">
                Page contact →
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-pop-yellow">Suivez-nous</h4>
          <div className="flex gap-3 text-sm">
            {settings?.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noreferrer" className="bg-white/10 px-3 py-2 rounded-full hover:bg-pop-orange transition-colors">
                TikTok
              </a>
            )}
            {settings?.facebook_url && (
              <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="bg-white/10 px-3 py-2 rounded-full hover:bg-pop-orange transition-colors">
                Facebook
              </a>
            )}
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="bg-white/10 px-3 py-2 rounded-full hover:bg-pop-orange transition-colors">
                Instagram
              </a>
            )}
            {!settings?.tiktok_url && !settings?.facebook_url && !settings?.instagram_url && (
              <span className="text-white/40">Liens à configurer dans l'administration.</span>
            )}
          </div>
          <Link to="/admin/login" className="block mt-6 text-xs text-white/30 hover:text-white/60">
            Espace administrateur
          </Link>
        </div>
      </div>
      <div className="text-center text-white/30 text-xs pb-6">
        © {new Date().getFullYear()} Pop's FOOD BENIN — Tous droits réservés.
      </div>
    </footer>
  );
}
