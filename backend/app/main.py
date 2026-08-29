import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .routers import (
    admin_auth, categories, products, orders, reviews, promotions, delivery, settings_router,
)

Base.metadata.create_all(bind=engine)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Charge automatiquement le menu de démonstration au premier démarrage
# (utile sur les plans gratuits d'hébergement sans accès Shell).
# Sans effet si la base contient déjà des données (voir la vérification dans seed.py).
try:
    from . import seed as _seed
    _seed.run()
except Exception as e:  # ne doit jamais empêcher le serveur de démarrer
    print(f"⚠️  Seed automatique non exécuté : {e}")

app = FastAPI(
    title="Pop's FOOD BENIN API",
    description="API du site de commande en ligne Pop's FOOD BENIN (Calavi, Bénin).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(admin_auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(promotions.router)
app.include_router(delivery.router)
app.include_router(settings_router.router)


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    """Vérifie aussi la base de données pour réveiller Neon en même temps que Render
    quand ce endpoint est appelé régulièrement par un service de ping (cron-job.org)."""
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "unreachable"
    return {"status": "ok", "service": "popsfood-api", "database": db_status}