import os
import uuid

from fastapi import HTTPException, UploadFile

from .config import settings


async def save_upload_image(file: UploadFile, subfolder: str) -> str:
    """Validates and saves an uploaded image. Returns the public URL path."""
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Format non supporté. Utilisez JPG, JPEG, PNG ou WEBP.")

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(400, f"Fichier trop volumineux (max {settings.MAX_UPLOAD_SIZE_MB} Mo).")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        ext = ".jpg"

    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{subfolder}/{filename}"
