# Pop's FOOD BENIN — Site de commande en ligne

Site web complet (vitrine + panier + commande + paiement par preuve + suivi + avis) et dashboard d'administration pour **Pop's FOOD BENIN**, restaurant fast-food à Calavi, Bénin (livraison uniquement).

---

## 1. Stack technique

| Côté | Techno | Pourquoi |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router | Rapide, mobile-first, écosystème simple, cohérent avec tes autres projets (Olarèwadjou STORE). |
| Backend | FastAPI (Python) + SQLAlchemy | Typage fort, validation automatique (Pydantic), docs Swagger auto-générées, déploiement facile sur Render comme ton backend Mercerie. |
| Base de données | SQLite en local (zéro config) / PostgreSQL en production (ex: Neon, comme Mercerie) | `DATABASE_URL` change tout, aucun code à modifier. |
| Auth admin | JWT (python-jose) + bcrypt (passlib) | Sessions sécurisées, mots de passe jamais stockés en clair. |
| Upload d'images | Stockage disque local (`/uploads`), servi en statique par FastAPI | Simple pour démarrer ; migrable vers S3/Cloudinary plus tard sans changer le frontend. |

---

## 2. Arborescence

```
popsfood/
├── backend/
│   ├── app/
│   │   ├── main.py              # point d'entrée FastAPI
│   │   ├── config.py            # variables d'environnement
│   │   ├── database.py          # connexion SQLAlchemy
│   │   ├── models.py            # toutes les entités (produits, commandes, etc.)
│   │   ├── schemas.py           # validation Pydantic
│   │   ├── auth.py              # JWT + hashing mots de passe
│   │   ├── utils.py             # upload sécurisé des images
│   │   ├── seed.py              # données de démonstration
│   │   └── routers/             # un fichier par domaine (produits, commandes, avis...)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                # Accueil, Menu, Produit, Commande, Paiement, Suivi, Contact
    │   ├── pages/admin/          # Dashboard, Produits, Catégories, Commandes, Promos, Avis, Livraison, Paramètres
    │   ├── components/           # Navbar, Footer, CartDrawer, ProductCard...
    │   ├── context/               # Panier (localStorage) + Auth admin
    │   └── api/client.js          # client HTTP centralisé
    ├── package.json
    └── .env.example
```

---

## 3. Modèle de données (résumé)

- **Category** → **Product** (1-N) → **OptionGroup** → **OptionChoice** (accompagnements, sauces, suppléments — 100% configurables depuis l'admin, aucune option codée en dur).
- **Promotion** : plat spécial avec prix normal/promo, dates de début/fin, mise en avant sur l'accueil.
- **DeliveryZone** : zone → frais, activable/désactivable.
- **Order** → **OrderItem** (snapshot du prix au moment de la commande) → **OrderStatusHistory** (traçabilité complète des changements de statut).
- **Review** : avis avec modération (approuvé/masqué) avant affichage public.
- **RestaurantSettings** : ligne unique éditable depuis l'admin (nom, logo, téléphone, réseaux sociaux, **informations de paiement**).
- **Admin** : comptes avec mot de passe hashé (bcrypt).

---

## 4. Système de commande — sécurité des prix

**Le prix n'est jamais calculé côté frontend pour la commande finale.** Le frontend envoie uniquement `product_id`, `quantity` et les `option_choice_ids` sélectionnés. Le backend :
1. relit le produit et ses options en base,
2. vérifie leur disponibilité,
3. valide que les groupes d'options obligatoires sont bien renseignés,
4. recalcule le prix unitaire, le sous-total, les frais de livraison et le total.

Impossible donc de manipuler un prix depuis le navigateur.

---

## 5. Système de paiement par preuve

1. Client commande → statut `en_attente_paiement`.
2. Page Paiement affiche les infos configurées dans l'admin (numéro, bénéficiaire, instructions, note frais de transaction).
3. Client dépose lui-même l'argent, prend une capture, la téléverse avec le numéro utilisé → statut `paiement_a_verifier`.
4. Admin consulte l'image dans le dashboard (`/admin/commandes`) → **Approuver** (`paiement_confirme`) ou **Rejeter** (`paiement_rejete` + motif).
5. Admin fait progresser manuellement la commande : `commande_confirmee` → `en_preparation` → `en_livraison` → `livree`.

Toutes les infos de paiement sont dans `RestaurantSettings`, éditables uniquement via `/admin/parametres` — jamais codées en dur ailleurs.

---

## 6. Système de livraison

Zones et frais gérés dans `/admin/livraison`. Au checkout, le client choisit sa zone, précise adresse + quartier + repère + note libre, et peut **optionnellement** partager sa position GPS (jamais obligatoire), dans le même esprit que le système développé pour Mercerie.

---

## 7. Installation locale

### Prérequis
- Python 3.11+ 
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows (Git Bash) : source venv/Scripts/activate
pip install -r requirements.txt --default-timeout=1000 --no-cache-dir

cp .env.example .env            # ajuster si besoin

# Créer les données de démonstration (catégories, produits, zones, admin...)
python -m app.seed

# Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

L'API est disponible sur `http://localhost:8000`, la doc Swagger sur `http://localhost:8000/docs`.

**Identifiants admin de démo :** `admin@popsfood.bj` / `PopsFood2026!` — **à changer immédiatement** (créer un nouvel admin en base ou changer le mot de passe, puis désactiver ce compte).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL doit pointer vers le backend
npm run dev
```

Le site est disponible sur `http://localhost:5173`.

---

## 8. Lancement complet

Deux terminaux :
```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

Ouvrir `http://localhost:5173` pour le site, `http://localhost:5173/admin/login` pour l'administration.

---

## 9. Déploiement (comme tes projets Mercerie/Cotisation)

- **Backend** → Render (Web Service Python) :
  - Build command : `pip install -r requirements.txt`
  - Start command : `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Variables d'env : `DATABASE_URL` (PostgreSQL Neon), `JWT_SECRET`, `FRONTEND_ORIGIN` (URL Vercel)
  - ⚠️ Le dossier `uploads/` sur Render est éphémère (redéploiement = perte des fichiers). Pour la prod, prévoir un stockage externe (Cloudinary, S3, Render Disks) — le code est déjà organisé pour que seule `utils.py` ait besoin d'être adapté.
- **Frontend** → Vercel :
  - Build command : `npm run build`, dossier de sortie `dist`
  - Variable d'env : `VITE_API_URL` = URL du backend Render

---

## 10. Ce qui est réellement fonctionnel (testé)

✅ Catalogue avec catégories, recherche, tri, filtres
✅ Personnalisation produit (groupes d'options obligatoires/multiples, prix additionnels)
✅ Panier persistant (localStorage)
✅ Commande avec calcul serveur (**testé** : 2 × bol de frites avec fromage fondant + sauce = 2800 F + 800 F livraison = 3600 F, vérifié via API)
✅ Upload de preuve de paiement (JPG/PNG/WEBP, taille limitée, aperçu, remplacement)
✅ Suivi de commande public par numéro
✅ Avis avec modération admin
✅ Dashboard admin : stats, CRUD produits/catégories/options/promotions/zones/avis, gestion complète des commandes (voir preuve, valider/rejeter paiement, changer statut), paramètres restaurant
✅ Auth admin JWT, routes protégées
✅ Build frontend validé sans erreur (`npm run build`)
✅ Import et démarrage backend validés (`uvicorn`), seed testé

## 11. Prochaines étapes suggérées (hors périmètre MVP)

- Remplacer les images de démonstration (Unsplash) par les vraies photos du restaurant via `/admin/produits` (upload direct).
- Configurer les vrais liens réseaux sociaux dans `/admin/parametres`.
- SEO avancé : sitemap.xml et robots.txt statiques, données structurées JSON-LD (Restaurant + Product).
- Stockage externe des images en production (voir section déploiement).
- Notifications automatiques (SMS/WhatsApp) lors des changements de statut.
