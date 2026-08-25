from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Promotion, Admin
from ..schemas import PromotionOut, PromotionCreate, PromotionUpdate
from ..auth import get_current_admin

router = APIRouter(prefix="/api/promotions", tags=["Promotions"])


@router.get("", response_model=List[PromotionOut])
def list_active_promotions(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return (
        db.query(Promotion)
        .filter(Promotion.is_active == True, Promotion.start_date <= now, Promotion.end_date >= now)  # noqa: E712
        .all()
    )


@router.get("/highlighted", response_model=List[PromotionOut])
def highlighted_promotions(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return (
        db.query(Promotion)
        .filter(
            Promotion.is_active == True,  # noqa: E712
            Promotion.is_highlighted == True,  # noqa: E712
            Promotion.start_date <= now,
            Promotion.end_date >= now,
        )
        .all()
    )


# ---------- Admin ----------
@router.get("/admin/all", response_model=List[PromotionOut])
def list_all_promotions(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return db.query(Promotion).order_by(Promotion.start_date.desc()).all()


@router.post("", response_model=PromotionOut)
def create_promotion(payload: PromotionCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if payload.end_date <= payload.start_date:
        raise HTTPException(400, "La date de fin doit être après la date de début.")
    promo = Promotion(**payload.model_dump())
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo


@router.put("/{promotion_id}", response_model=PromotionOut)
def update_promotion(promotion_id: str, payload: PromotionUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(404, "Promotion introuvable.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(promo, k, v)
    db.commit()
    db.refresh(promo)
    return promo


@router.delete("/{promotion_id}")
def delete_promotion(promotion_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    promo = db.query(Promotion).filter(Promotion.id == promotion_id).first()
    if not promo:
        raise HTTPException(404, "Promotion introuvable.")
    db.delete(promo)
    db.commit()
    return {"ok": True}
