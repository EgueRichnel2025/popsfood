from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Admin
from ..schemas import AdminLogin, Token, AdminUpdateCredentials
from ..auth import verify_password, hash_password, create_access_token, get_current_admin

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])


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