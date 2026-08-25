from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Category, Admin
from ..schemas import CategoryOut, CategoryCreate, CategoryUpdate
from ..auth import get_current_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut])
def list_categories(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(Category)
    if not include_inactive:
        q = q.filter(Category.is_active == True)  # noqa: E712
    return q.order_by(Category.display_order).all()


@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if db.query(Category).filter(Category.slug == payload.slug).first():
        raise HTTPException(400, "Ce slug existe déjà.")
    cat = Category(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(category_id: str, payload: CategoryUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(404, "Catégorie introuvable.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{category_id}")
def delete_category(category_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(404, "Catégorie introuvable.")
    if cat.products:
        raise HTTPException(400, "Impossible de supprimer : des produits utilisent cette catégorie. Désactivez-la plutôt.")
    db.delete(cat)
    db.commit()
    return {"ok": True}
