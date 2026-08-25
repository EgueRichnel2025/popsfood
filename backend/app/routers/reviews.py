import hashlib
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Review, Admin
from ..schemas import ReviewCreate, ReviewOut, ReviewModerate
from ..auth import get_current_admin

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.get("", response_model=List[ReviewOut])
def list_public_reviews(db: Session = Depends(get_db)):
    return (
        db.query(Review)
        .filter(Review.is_approved == True, Review.is_hidden == False)  # noqa: E712
        .order_by(Review.created_at.desc())
        .all()
    )


@router.get("/summary")
def reviews_summary(db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.is_approved == True, Review.is_hidden == False).all()  # noqa: E712
    if not reviews:
        return {"average": 0, "count": 0}
    avg = sum(r.rating for r in reviews) / len(reviews)
    return {"average": round(avg, 1), "count": len(reviews)}


@router.post("", response_model=ReviewOut)
def submit_review(payload: ReviewCreate, request: Request, db: Session = Depends(get_db)):
    # Basic anti-spam: hash the client IP, limit obviously abusive content length.
    client_ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()

    if payload.comment and len(payload.comment) > 1000:
        raise HTTPException(400, "Commentaire trop long.")

    review = Review(
        customer_name=payload.customer_name or "Client anonyme",
        rating=payload.rating,
        comment=payload.comment,
        ip_hash=ip_hash,
        is_approved=False,  # requires admin moderation before showing publicly
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


# ---------- Admin moderation ----------
@router.get("/admin/all", response_model=List[ReviewOut])
def list_all_reviews(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    return db.query(Review).order_by(Review.created_at.desc()).all()


@router.put("/{review_id}/moderate", response_model=ReviewOut)
def moderate_review(review_id: str, payload: ReviewModerate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Avis introuvable.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(review, k, v)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}")
def delete_review(review_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Avis introuvable.")
    db.delete(review)
    db.commit()
    return {"ok": True}
