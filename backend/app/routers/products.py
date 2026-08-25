from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Product, OptionGroup, OptionChoice, Admin
from ..schemas import (
    ProductOut, ProductCreate, ProductUpdate,
    OptionGroupOut, OptionGroupCreate, OptionChoiceOut, OptionChoiceCreate,
)
from ..auth import get_current_admin

router = APIRouter(prefix="/api/products", tags=["Products"])


def _with_options(q):
    return q.options(joinedload(Product.option_groups).joinedload(OptionGroup.choices))


@router.get("", response_model=List[ProductOut])
def list_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    available_only: bool = True,
    sort: Optional[str] = Query(None, description="price_asc | price_desc | newest"),
    db: Session = Depends(get_db),
):
    q = _with_options(db.query(Product))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if available_only:
        q = q.filter(Product.is_available == True)  # noqa: E712
    if search:
        like = f"%{search}%"
        q = q.filter(Product.name.ilike(like))
    if sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    else:
        q = q.order_by(Product.created_at.desc())
    return q.all()


@router.get("/featured", response_model=List[ProductOut])
def featured_products(db: Session = Depends(get_db)):
    return _with_options(db.query(Product)).filter(
        Product.is_featured == True, Product.is_available == True  # noqa: E712
    ).all()


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = _with_options(db.query(Product)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit introuvable.")
    return product


@router.get("/slug/{slug}", response_model=ProductOut)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = _with_options(db.query(Product)).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(404, "Produit introuvable.")
    return product


# ---------- Admin CRUD ----------
@router.post("", response_model=ProductOut)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    if db.query(Product).filter(Product.slug == payload.slug).first():
        raise HTTPException(400, "Ce slug existe déjà.")
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: str, payload: ProductUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit introuvable.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(product_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit introuvable.")
    db.delete(product)
    db.commit()
    return {"ok": True}


# ---------- Option groups (accompagnements, sauces, suppléments...) ----------
@router.post("/{product_id}/option-groups", response_model=OptionGroupOut)
def add_option_group(product_id: str, payload: OptionGroupCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit introuvable.")
    group = OptionGroup(
        product_id=product_id,
        name=payload.name,
        is_required=payload.is_required,
        allow_multiple=payload.allow_multiple,
        max_choices=payload.max_choices,
        display_order=payload.display_order,
    )
    db.add(group)
    db.flush()
    for c in payload.choices:
        db.add(OptionChoice(group_id=group.id, **c.model_dump()))
    db.commit()
    db.refresh(group)
    return group


@router.delete("/option-groups/{group_id}")
def delete_option_group(group_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    group = db.query(OptionGroup).filter(OptionGroup.id == group_id).first()
    if not group:
        raise HTTPException(404, "Groupe d'options introuvable.")
    db.delete(group)
    db.commit()
    return {"ok": True}


@router.post("/option-groups/{group_id}/choices", response_model=OptionChoiceOut)
def add_option_choice(group_id: str, payload: OptionChoiceCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    group = db.query(OptionGroup).filter(OptionGroup.id == group_id).first()
    if not group:
        raise HTTPException(404, "Groupe d'options introuvable.")
    choice = OptionChoice(group_id=group_id, **payload.model_dump())
    db.add(choice)
    db.commit()
    db.refresh(choice)
    return choice


@router.delete("/option-choices/{choice_id}")
def delete_option_choice(choice_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    choice = db.query(OptionChoice).filter(OptionChoice.id == choice_id).first()
    if not choice:
        raise HTTPException(404, "Option introuvable.")
    db.delete(choice)
    db.commit()
    return {"ok": True}
