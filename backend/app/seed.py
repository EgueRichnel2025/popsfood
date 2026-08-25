"""
Script de peuplement de la base avec les VRAIES données du menu Pop's FOOD BENIN
(Calavi - Zoca), transmises par le restaurant.

Lancer avec : python -m app.seed
Pour re-générer après une première exécution : supprimez popsfood.db puis relancez.
"""
from datetime import datetime, timedelta

from .database import SessionLocal, Base, engine
from .models import (
    Admin, Category, Product, OptionGroup, OptionChoice,
    DeliveryZone, RestaurantSettings, Review,
)
from .auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

IMG_PLACEHOLDER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800"


def slugify(text: str) -> str:
    return (
        text.lower()
        .replace("é", "e").replace("è", "e").replace("ê", "e").replace("à", "a")
        .replace("'", "").replace("œ", "oe").replace("/", "-")
        .replace(" ", "-")
    )


def run():
    if db.query(Admin).first():
        print("La base contient déjà des données. Seed annulé (pour éviter les doublons).")
        print("Pour re-seed : supprimez popsfood.db puis relancez cette commande.")
        return

    # ---- Admin ----
    admin = Admin(
        full_name="Administrateur Pop's FOOD",
        email="admin@popsfood.bj",
        hashed_password=hash_password("PopsFood2026!"),
        role="superadmin",
    )
    db.add(admin)

    # ---- Settings (infos réelles transmises par le restaurant) ----
    db.add(RestaurantSettings(
        id="settings",
        restaurant_name="Pop's FOOD BENIN",
        city="Calavi - Zoca, Bénin",
        phone="69 12 19 11",
        whatsapp="69 12 19 11",
        opening_hours="Tous les jours de 9h à 19h, sauf dimanche",
        payment_number="01-69-12-19-11",
        payment_beneficiary="DOSSOU-YOVO Annette",
        payment_instructions="Veuillez envoyer la capture après dépôt ainsi que le numéro à joindre.",
        payment_fee_note="NB : Prière de ne pas oublier les frais de transaction.",
        tiktok_url=None,
        facebook_url=None,
        instagram_url=None,
    ))

    # ---- Catégories ----
    cat_tacos = Category(name="Tacos", slug="tacos", display_order=1)
    cat_chawarma = Category(name="Chawarma", slug="chawarma", display_order=2,
                             description="Chawarmas généreux, garnis à la demande.")
    cat_packs = Category(name="Packs", slug="packs", display_order=3,
                          description="Nos formules complètes à prix avantageux.")
    cat_burgers = Category(name="Burgers & Paninis", slug="burgers-paninis", display_order=4)
    cat_snacks = Category(name="Snacks & Grignotage", slug="snacks", display_order=5,
                           description="Mini pizzas, pastels et beignets fourrés.")
    cat_crepes = Category(name="Crêpes", slug="crepes", display_order=6)
    cat_pizza = Category(name="Pizzas", slug="pizzas", display_order=7)
    cat_frites = Category(name="Bol de frites", slug="bol-de-frites", display_order=8)
    cat_salades = Category(name="Salades", slug="salades", display_order=9)
    cat_boissons = Category(name="Boissons & Jus", slug="boissons", display_order=10)

    categories = [
        cat_tacos, cat_chawarma, cat_packs, cat_burgers, cat_snacks,
        cat_crepes, cat_pizza, cat_frites, cat_salades, cat_boissons,
    ]
    for c in categories:
        db.add(c)
    db.flush()

    def add_product(name, desc, price, category, featured=False, compare_at=None):
        p = Product(
            name=name, slug=slugify(name), description=desc, price=price,
            compare_at_price=compare_at, image_url=IMG_PLACEHOLDER,
            category_id=category.id, is_available=True, is_featured=featured,
        )
        db.add(p)
        db.flush()
        return p

    def add_option_group(product, name, is_required=False, allow_multiple=False, max_choices=1, order=1):
        g = OptionGroup(
            product_id=product.id, name=name, is_required=is_required,
            allow_multiple=allow_multiple, max_choices=max_choices, display_order=order,
        )
        db.add(g)
        db.flush()
        return g

    def add_choice(group, label, extra_price=0):
        db.add(OptionChoice(group_id=group.id, label=label, extra_price=extra_price))

    # ============ TACOS ============
    t1 = add_product("Tacos Bœuf / Poulet", "Tacos généreux garni de viande, frites et sauce fromagère.", 4000, cat_tacos, featured=True)
    viande_g = add_option_group(t1, "Viande", is_required=True)
    add_choice(viande_g, "Bœuf")
    add_choice(viande_g, "Poulet")

    t2 = add_product("Tacos Bœuf / Poulet Fromage", "Le grand classique, garni de fromage fondant en plus.", 5000, cat_tacos)
    viande_g2 = add_option_group(t2, "Viande", is_required=True)
    add_choice(viande_g2, "Bœuf")
    add_choice(viande_g2, "Poulet")

    add_product("Tacos Pommes Viande", "Tacos garni de pommes de terre sautées et de viande.", 3500, cat_tacos)
    add_product("Tacos Viande Pommes Fromage", "Tacos garni de viande, pommes de terre et fromage fondant.", 4500, cat_tacos)

    # ============ CHAWARMA ============
    def chawarma_supplements(product):
        g = add_option_group(product, "Supplément", is_required=False, allow_multiple=True, max_choices=4, order=2)
        add_choice(g, "Sauce", 500)
        add_choice(g, "Fromage", 1000)
        add_choice(g, "Jambon", 1000)
        add_choice(g, "Viande / Poulet", 1000)

    add_product("Chawarma Sans Viande", "Chawarma végétarien garni de crudités et sauce maison.", 1500, cat_chawarma)
    c_sv = add_product("Chawarma Sans Viande Fromage", "Chawarma végétarien garni de fromage fondant.", 2500, cat_chawarma)
    chawarma_supplements(c_sv)

    c_boeuf = add_product("Chawarma Bœuf", "Galette garnie de bœuf mariné, crudités et sauce maison.", 2500, cat_chawarma, featured=True)
    taille_boeuf = add_option_group(c_boeuf, "Taille", is_required=True, order=1)
    add_choice(taille_boeuf, "Normal", 0)
    add_choice(taille_boeuf, "Grand", 500)
    chawarma_supplements(c_boeuf)

    c_poulet = add_product("Chawarma Poulet", "Galette garnie de poulet mariné, crudités et sauce maison.", 2500, cat_chawarma, featured=True)
    taille_poulet = add_option_group(c_poulet, "Taille", is_required=True, order=1)
    add_choice(taille_poulet, "Normal", 0)
    add_choice(taille_poulet, "Grand", 500)
    chawarma_supplements(c_poulet)

    c_boeuf_from = add_product("Chawarma Bœuf Fromage", "Chawarma bœuf garni de fromage fondant.", 3500, cat_chawarma)
    chawarma_supplements(c_boeuf_from)

    c_poulet_from = add_product("Chawarma Poulet Fromage", "Chawarma poulet garni de fromage fondant.", 4000, cat_chawarma)
    chawarma_supplements(c_poulet_from)

    # ============ PACKS ============
    add_product(
        "Pack 4500", "1 Chawarma bœuf + 1 portion de frites + 1 Bissap.", 4500, cat_packs, featured=True,
    )
    add_product(
        "Pack 5500", "1 Chawarma bœuf + 1 portion de frites + 1 salade verte + 1 Ice Coffee.", 5500, cat_packs,
    )
    add_product(
        "Pack 10 000", "4 minis chawarma + 4 minis pastels + 4 minis pizzas + 1 portion de frites. Idéal pour partager.", 10000, cat_packs,
    )
    add_product(
        "Pack Pop's 1", "1 Burger + 1 Chawarma + 1 Ice Coffee.", 5000, cat_packs, featured=True,
    )
    # Prix non communiqué par le restaurant pour ce pack — valeur provisoire, à confirmer/modifier via /admin/produits.
    add_product(
        "Pack Pop's 2", "1 Panini + 1 Burger + 1 Menthe au Lait. (Prix à confirmer)", 5500, cat_packs,
    )

    # ============ BURGERS & PANINIS ============
    add_product("Panini Viande Hachée Fromage", "Panini croustillant garni de viande hachée et fromage fondant.", 2000, cat_burgers)
    add_product("Panini Brochette", "Panini garni de brochettes de viande grillée.", 3500, cat_burgers)
    add_product("Burger", "Pain moelleux, steak haché, crudités, sauce burger.", 3000, cat_burgers, featured=True)
    add_product("Cheeseburger", "Burger garni de cheddar fondant.", 4000, cat_burgers)
    add_product("Double Cheeseburger", "Double steak, double fromage, pour les grosses faims.", 5000, cat_burgers)

    # ============ SNACKS & GRIGNOTAGE ============
    add_product("Mini Pizza", "Mini pizzas généreuses. Commande minimum : 10 pièces.", 300, cat_snacks)
    add_product("Mini Pastel", "Mini pastels croustillants. Commande minimum : 10 pièces.", 300, cat_snacks)
    add_product("Pastel", "Pastels croustillants faits maison. Commande minimum : 3 pièces.", 1000, cat_snacks)
    add_product("Beignet Fourré", "Pack de 2 beignets moelleux fourrés, servis chauds.", 3000, cat_snacks)

    # ============ CRÊPES ============
    add_product("Crêpe Farcie", "Crêpe salée généreusement farcie.", 2000, cat_crepes)
    add_product("Crêpe Gratinée", "Crêpe salée gratinée au fromage.", 2500, cat_crepes)
    add_product("Crêpe Pizza Poulet", "Crêpe revisitée façon pizza, garnie de poulet et fromage.", 5000, cat_crepes)

    # ============ PIZZAS ============
    add_product("Pizza Reine", "Sauce tomate, jambon, champignon, olive.", 6500, cat_pizza, featured=True)
    add_product("Pizza Mexicaine", "Sauce tomate, viande hachée, fromage, poivron.", 6000, cat_pizza)
    add_product("Pizza Poulet", "Sauce tomate, poulet, fromage, poivron.", 6000, cat_pizza)
    add_product("Margherita", "Sauce tomate, fromage, olives.", 5000, cat_pizza)

    # ============ BOL DE FRITES ============
    add_product("Bol de Frite Viande de Bœuf Fromage", "Bol de frites garni de bœuf et fromage. Accompagnement : sauce blanche.", 5000, cat_frites, featured=True)
    add_product("Bol de Frite Poulet Fromage", "Bol de frites garni de poulet et fromage. Accompagnement : sauce blanche.", 5000, cat_frites)
    add_product("Bol de Frite Poulet Mayo", "Bol de frites garni de poulet et mayonnaise.", 5000, cat_frites)

    portions = add_product("Portion Frites", "Frites croustillantes, portion au choix.", 1000, cat_frites)
    taille_frites = add_option_group(portions, "Taille", is_required=True)
    add_choice(taille_frites, "Petite portion", 0)
    add_choice(taille_frites, "Grande portion", 500)

    # ============ SALADES ============
    add_product(
        "Salade Niçoise",
        "Feuille de laitue, petit pois, maïs doux, œuf, thon, oignon, tomate.",
        3000, cat_salades,
    )
    add_product(
        "Salade César",
        "Feuille de laitue, poulet, croûtons, fromage, olive.",
        3500, cat_salades, featured=True,
    )
    add_product(
        "Salade Nova",
        "Feuille de laitue, pomme de terre, petit pois, maïs doux, saucisson, boulette de viande, oignon, tomate.",
        3500, cat_salades,
    )
    add_product(
        "Salade Pop's",
        "Feuille de laitue, pomme de terre, petit pois, maïs doux, poulet, œuf, thon, oignon, tomate.",
        3500, cat_salades, featured=True,
    )

    # ============ BOISSONS & JUS ============
    add_product("Bissap Suprême", "Jus de bissap maison, bien frais.", 1000, cat_boissons)
    add_product("Menthe au Lait", "Boisson rafraîchissante à la menthe et au lait.", 1000, cat_boissons)
    add_product("Ice Coffee", "Café glacé onctueux.", 1000, cat_boissons)

    # ---- Zones de livraison (valeurs de départ, modifiables depuis l'admin) ----
    for name, fee in [
        ("Calavi Centre", 500),
        ("Zoca", 500),
        ("Godomey", 700),
        ("Akassato", 800),
        ("Togba", 900),
        ("Cotonou (hors Calavi)", 1500),
    ]:
        db.add(DeliveryZone(name=name, fee=fee, is_active=True))

    # ---- Avis de démonstration ----
    for name, rating, comment in [
        ("Fabrice A.", 5, "Le meilleur chawarma de Calavi-Zoca, livraison rapide !"),
        ("Judith K.", 4, "Tacos généreux, j'adore la version fromage."),
        ("Steve M.", 5, "Toujours au rendez-vous, service impeccable."),
    ]:
        db.add(Review(customer_name=name, rating=rating, comment=comment, is_approved=True, is_hidden=False))

    db.commit()
    print("✅ Menu réel Pop's FOOD BENIN chargé avec succès.")
    print("   Admin : admin@popsfood.bj / PopsFood2026!  (à changer immédiatement)")
    print("   ⚠️  Le prix du 'Pack Pop's 2' est une valeur provisoire (non communiquée) — à corriger dans /admin/produits.")
    print("   ⚠️  Vérifiez le numéro de téléphone dans /admin/parametres : deux numéros différents figurent")
    print("       sur les flyers (69 12 19 11 et 691 21 91 11) — j'ai gardé celui qui correspond au numéro de paiement.")


if __name__ == "__main__":
    run()