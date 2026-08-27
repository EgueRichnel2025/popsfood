import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./popsfood.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production-please")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "5"))
    ALLOWED_IMAGE_TYPES: set = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    # URL publique du frontend, utilisée pour construire le lien de réinitialisation
    # de mot de passe envoyé par email (peut être identique à FRONTEND_ORIGIN).
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # Envoi d'emails (réinitialisation de mot de passe en libre-service).
    # Compatible avec n'importe quel fournisseur SMTP (Gmail, Outlook, Brevo, etc.).
    # Chaque déploiement (chaque restaurant) configure ses propres identifiants.
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Pop's FOOD BENIN")
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()