import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Admin, PasswordResetToken
from ..schemas import AdminLogin, Token, AdminUpdateCredentials, AdminForgotPasswordRequest, AdminResetPasswordConfirm
from ..auth import verify_password, hash_password, create_access_token, get_current_admin
from ..config import settings
from ..utils_email import send_password_reset_email, EmailNotConfiguredError

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


@router.post("/login", response_model=Token)
def login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect.")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte désactivé.")

    token = create_access_token({"sub": admin.id})
    return Token(access_token=token, admin_name=admin.full_name)


@router.get("/me")
def me(admin: Admin = Depends(get_current_admin)):
    return {"id": admin.id, "full_name": admin.full_name, "email": admin.email, "role": admin.role}


@router.put("/me")
def update_credentials(
    payload: AdminUpdateCredentials,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    """Permet à l'admin connecté de changer son nom, son email et/ou son mot de passe.
    Le mot de passe actuel est toujours requis pour confirmer l'identité."""
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Mot de passe actuel incorrect.")

    if payload.full_name:
        admin.full_name = payload.full_name

    if payload.email and payload.email != admin.email:
        existing = db.query(Admin).filter(Admin.email == payload.email, Admin.id != admin.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé par un autre compte.")
        admin.email = payload.email

    if payload.new_password:
        if len(payload.new_password) < 8:
            raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères.")
        admin.hashed_password = hash_password(payload.new_password)

    db.commit()
    db.refresh(admin)

    # Un nouveau token est renvoyé car l'email (utilisé pour se reconnecter) a pu changer
    # et pour garder une session valide après la mise à jour.
    token = create_access_token({"sub": admin.id})
    return Token(access_token=token, admin_name=admin.full_name)


@router.post("/forgot-password")
def forgot_password(payload: AdminForgotPasswordRequest, db: Session = Depends(get_db)):
    """Déclenche l'envoi d'un email de réinitialisation, en libre-service.
    Ne révèle jamais si l'email existe ou non (message générique dans tous les cas)
    pour éviter qu'un tiers ne puisse deviner les comptes admin existants."""
    generic_response = {
        "ok": True,
        "message": "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    }

    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin:
        return generic_response

    raw_token = secrets.token_urlsafe(32)
    token_row = PasswordResetToken(
        admin_id=admin.id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(token_row)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/admin/reinitialiser-mot-de-passe?token={raw_token}"

    try:
        send_password_reset_email(admin.email, admin.full_name, reset_link)
    except EmailNotConfiguredError:
        # Problème de configuration serveur (pas propre à cet utilisateur) : on peut
        # le signaler clairement, ça n'expose aucune donnée sur les comptes existants.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="L'envoi d'emails n'est pas configuré sur ce serveur. Contactez l'administrateur technique du site.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible d'envoyer l'email pour le moment. Réessayez dans quelques minutes.",
        )

    return generic_response


@router.post("/reset-password")
def reset_password(payload: AdminResetPasswordConfirm, db: Session = Depends(get_db)):
    """Finalise la réinitialisation à partir du jeton reçu par email."""
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères.")

    token_hash = _hash_token(payload.token)
    token_row = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    if not token_row or token_row.used_at is not None or token_row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Ce lien de réinitialisation est invalide ou a expiré. Refaites une demande.")

    admin = db.query(Admin).filter(Admin.id == token_row.admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Compte administrateur introuvable.")

    admin.hashed_password = hash_password(payload.new_password)
    token_row.used_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "message": "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous reconnecter."}