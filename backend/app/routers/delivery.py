from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DeliveryZone, Admin
from ..schemas import DeliveryZoneOut, DeliveryZoneCreate, DeliveryZoneUpdate
from ..auth import get_current_admin

router = APIRouter(prefix="/api/delivery-zones", tags=["Delivery"])


@router.get("", response_model=List[DeliveryZoneOut])
def list_zones(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(DeliveryZone)
    if not include_inactive:
        q = q.filter(DeliveryZone.is_active == True)  # noqa: E712
    return q.order_by(DeliveryZone.name).all()


@router.post("", response_model=DeliveryZoneOut)
def create_zone(payload: DeliveryZoneCreate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    zone = DeliveryZone(**payload.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@router.put("/{zone_id}", response_model=DeliveryZoneOut)
def update_zone(zone_id: str, payload: DeliveryZoneUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone introuvable.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(zone, k, v)
    db.commit()
    db.refresh(zone)
    return zone


@router.delete("/{zone_id}")
def delete_zone(zone_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    zone = db.query(DeliveryZone).filter(DeliveryZone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone introuvable.")
    db.delete(zone)
    db.commit()
    return {"ok": True}
