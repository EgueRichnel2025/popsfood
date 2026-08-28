"""
Script de remise à zéro AVANT LA VENTE DU SITE.

Supprime toutes les commandes de test (et les avis de démonstration),
SANS toucher aux produits, catégories, promotions, zones de livraison,
ni aux paramètres du restaurant.

⚠️ ATTENTION : ce script agit sur la base pointée par DATABASE_URL.
Vérifiez bien laquelle avant de lancer (locale ou production/Neon) !

Utilisation (depuis le dossier backend, avec le venv activé) :

  - Sur la base LOCALE (SQLite, par défaut) :
      python -m app.reset_orders

  - Sur la base de PRODUCTION (Neon), en une seule commande, sans toucher
    à votre .env local — copiez la valeur de DATABASE_URL depuis Render
    (Environment) puis :
      DATABASE_URL="postgresql://...la-vraie-url-neon..." python -m app.reset_orders
"""
from .database import SessionLocal
from .models import Order, OrderItem, OrderStatusHistory, Review
from .config import settings

db = SessionLocal()

nb_orders = db.query(Order).count()
nb_reviews = db.query(Review).count()

print(f"Base ciblée : {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
print(f"Commandes actuelles : {nb_orders}")
print(f"Avis actuels : {nb_reviews}")
print()

if nb_orders == 0 and nb_reviews == 0:
    print("Rien à supprimer, tout est déjà à 0.")
else:
    confirm = input("Tapez OUI en majuscules pour confirmer la suppression DÉFINITIVE de tout ça : ")
    if confirm != "OUI":
        print("Annulé, rien n'a été supprimé.")
    else:
        db.query(OrderStatusHistory).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Review).delete()
        db.commit()
        print("✅ Commandes et avis supprimés. Le dashboard repart à 0.")
        print("   Le menu, les catégories, les paramètres et les zones de livraison sont intacts.")