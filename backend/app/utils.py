import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

from .config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def save_upload_image(file: UploadFile, subfolder: str) -> str:
    """Valide et téléverse une image vers Cloudinary (stockage permanent).
    Retourne l'URL publique et durable de l'image."""
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(400, f"Fichier trop volumineux (max {settings.MAX_UPLOAD_SIZE_MB} Mo).")

    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(
            503,
            "Le stockage d'images n'est pas configuré sur ce serveur (variables CLOUDINARY_* manquantes).",
        )

    try:
        result = cloudinary.uploader.upload(contents, folder=f"popsfood/{subfolder}")
    except Exception as e:
        raise HTTPException(502, f"Échec de l'envoi vers le stockage d'images : {e}")

    return result["secure_url"]