"""
Script de peuplement de la base avec des données de démonstration réalistes
pour Pop's FOOD BENIN. Lancer avec : python -m app.seed
"""
from datetime import datetime, timedelta

from .database import SessionLocal, Base, engine
from .models import (
    Admin, Category, Product, OptionGroup, OptionChoice,
    DeliveryZone, Promotion, RestaurantSettings, Review,
)
from .auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

IMG_PLACEHOLDER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800"


def slugify(text: str) -> str:
    return (
        text.lower()
        .replace("é", "e").replace("è", "e").replace("à", "a")
        .replace("'", "").replace(" ", "-")
    )


def run():
    if db.query(Admin).first():
        print("La base contient déjà des données. Seed annulé (pour éviter les doublons).")
        return

    # ---- Admin ----
    admin = Admin(
        full_name="Administrateur Pop's FOOD",
        email="admin@popsfood.bj",
        hashed_password=hash_password("PopsFood2026!"),
        role="superadmin",
    )
    db.add(admin)

    # ---- Settings ----
    db.add(RestaurantSettings(
        id="settings",
        restaurant_name="Pop's FOOD BENIN",
        city="Calavi, Bénin",
        phone="+229 01 69 12 19 11",
        whatsapp="+229 01 69 12 19 11",
        opening_hours="Tous les jours, 10h00 - 22h30",
        payment_number="01-69-12-19-11",
        payment_beneficiary="DOSSOU-YOVO Annette",
        payment_instructions="Veuillez envoyer la capture après dépôt ainsi que le numéro à joindre.",
        payment_fee_note="NB : Prière de ne pas oublier les frais de transaction.",
        tiktok_url=None,
        facebook_url=None,
        instagram_url=None,
    ))

    # ---- Categories ----
    cat_fastfood = Category(name="Fast-food", slug="fast-food", display_order=1,
                             description="Nos classiques gourmands : shawarma, burgers et plus.")
    cat_frites = Category(name="Frites & accompagnements", slug="frites", display_order=2,
                           description="Bols de frites personnalisables.")
    cat_boissons = Category(name="Boissons", slug="boissons", display_order=3,
                             description="Pour accompagner votre repas.")
    cat_pizza = Category(name="Pizzas", slug="pizzas", display_order=4,
                          description="Pizzas généreuses, cuites avec amour.")
    for c in (cat_fastfood, cat_frites, cat_boissons, cat_pizza):
        db.add(c)
    db.flush()

    # ---- Fast-food products ----
    fastfood_items = [
        ("Shawarma Poulet", "Galette croustillante garnie de poulet mariné, crudités et sauce maison.", 1500),
        ("Burger Pop's Classic", "Pain moelleux, steak haché, cheddar, salade, tomate, sauce burger.", 2000),
        ("Hamburger Simple", "Le hamburger généreux à la sauce Pop's FOOD.", 1500),
        ("Beignets Fourrés", "Beignets moelleux fourrés, servis chauds.", 500),
        ("Pastels Fourrés au Fromage", "Pastels croustillants garnis de fromage fondant.", 700),
        ("Crêpe Revisitée au Fromage", "Crêpe salée revisitée, garnie de fromage.", 1000),
    ]
    products_by_slug = {}
    for name, desc, price in fastfood_items:
        p = Product(
            name=name, slug=slugify(name), description=desc, price=price,
            image_url=IMG_PLACEHOLDER, category_id=cat_fastfood.id,
            is_available=True, is_featured=(name in ("Shawarma Poulet", "Burger Pop's Classic")),
        )
        db.add(p)
        products_by_slug[p.slug] = p
    db.flush()

    # Sauce options for shawarma/burger
    for slug in ("shawarma-poulet", "burger-pops-classic", "hamburger-simple"):
        p = products_by_slug[slug]
        sauce_group = OptionGroup(product_id=p.id, name="Sauce", is_required=True, allow_multiple=False, max_choices=1, display_order=1)
        db.add(sauce_group)
        db.flush()
        for label, extra in [("Sauce piquante", 0), ("Sauce douce", 0), ("Sauce fromagère", 200)]:
            db.add(OptionChoice(group_id=sauce_group.id, label=label, extra_price=extra))
        supp_group = OptionGroup(product_id=p.id, name="Supplément", is_required=False, allow_multiple=True, max_choices=3, display_order=2)
        db.add(supp_group)
        db.flush()
        for label, extra in [("Fromage supplémentaire", 300), ("Œuf", 200), ("Frites en accompagnement", 500)]:
            db.add(OptionChoice(group_id=supp_group.id, label=label, extra_price=extra))

    # ---- Pizza ----
    p_pizza = Product(
        name="Pizza Pop's Spéciale", slug="pizza-pops-speciale",
        description="Pâte maison, sauce tomate, mozzarella, garniture au choix.",
        price=3000, image_url=IMG_PLACEHOLDER, category_id=cat_pizza.id, is_featured=True,
    )
    db.add(p_pizza)
    db.flush()
    taille_group = OptionGroup(product_id=p_pizza.id, name="Taille", is_required=True, allow_multiple=False, max_choices=1, display_order=1)
    db.add(taille_group)
    db.flush()
    db.add(OptionChoice(group_id=taille_group.id, label="Petite (25cm)", extra_price=0))
    db.add(OptionChoice(group_id=taille_group.id, label="Moyenne (30cm)", extra_price=1000))
    db.add(OptionChoice(group_id=taille_group.id, label="Grande (35cm)", extra_price=2000))

    # ---- Frites (bol personnalisable) ----
    p_frites = Product(
        name="Bol de Frites Personnalisé", slug="bol-de-frites-personnalise",
        description="Choisissez votre fromage, votre sauce et vos suppléments préférés.",
        price=1000, image_url=IMG_PLACEHOLDER, category_id=cat_frites.id, is_featured=True,
    )
    db.add(p_frites)
    db.flush()

    fromage_group = OptionGroup(product_id=p_frites.id, name="Fromage", is_required=False, allow_multiple=False, max_choices=1, display_order=1)
    db.add(fromage_group)
    db.flush()
    db.add(OptionChoice(group_id=fromage_group.id, label="Fromage lait de vache", extra_price=500))
    db.add(OptionChoice(group_id=fromage_group.id, label="Fromage fondant", extra_price=400))
    db.add(OptionChoice(group_id=fromage_group.id, label="Sans fromage", extra_price=0))

    sauce_frites_group = OptionGroup(product_id=p_frites.id, name="Sauce", is_required=True, allow_multiple=False, max_choices=1, display_order=2)
    db.add(sauce_frites_group)
    db.flush()
    for label in ("Sauce piquante", "Sauce ketchup", "Sauce mayo", "Sauce fromagère"):
        db.add(OptionChoice(group_id=sauce_frites_group.id, label=label, extra_price=0))

    supp_frites_group = OptionGroup(product_id=p_frites.id, name="Supplément", is_required=False, allow_multiple=True, max_choices=4, display_order=3)
    db.add(supp_frites_group)
    db.flush()
    for label, extra in [("Saucisse", 500), ("Œuf", 200), ("Poulet effiloché", 700), ("Olives", 300)]:
        db.add(OptionChoice(group_id=supp_frites_group.id, label=label, extra_price=extra))

    # ---- Boissons ----
    for name, price in [("Menthe au Lait", 800), ("Ice Coffee", 1000)]:
        db.add(Product(
            name=name, slug=slugify(name), description=f"{name}, préparé maison.",
            price=price, image_url=IMG_PLACEHOLDER, category_id=cat_boissons.id, is_available=True,
        ))

    db.flush()

    # ---- Promotion ----
    db.add(Promotion(
        title="Combo Shawarma + Boisson",
        description="Un Shawarma Poulet accompagné d'une Menthe au Lait à prix réduit.",
        image_url=IMG_PLACEHOLDER,
        product_id=products_by_slug["shawarma-poulet"].id,
        regular_price=2300,
        promo_price=1900,
        start_date=datetime.utcnow() - timedelta(days=1),
        end_date=datetime.utcnow() + timedelta(days=30),
        is_active=True,
        is_highlighted=True,
    ))

    # ---- Delivery zones ----
    for name, fee in [
        ("Calavi Centre", 500),
        ("Godomey", 700),
        ("Akassato", 800),
        ("Togba", 900),
        ("Cotonou (hors Calavi)", 1500),
    ]:
        db.add(DeliveryZone(name=name, fee=fee, is_active=True))

    # ---- Reviews (approved demo reviews) ----
    for name, rating, comment in [
        ("Fabrice A.", 5, "Le meilleur shawarma de Calavi, livraison rapide !"),
        ("Judith K.", 4, "Frites délicieuses, j'adore le fromage fondant en option."),
        ("Steve M.", 5, "Toujours au rendez-vous, service impeccable."),
    ]:
        db.add(Review(customer_name=name, rating=rating, comment=comment, is_approved=True, is_hidden=False))

    db.commit()
    print("✅ Données de démonstration créées avec succès.")
    print("   Admin : admin@popsfood.bj / PopsFood2026!  (à changer immédiatement)")


if __name__ == "__main__":
    run()
