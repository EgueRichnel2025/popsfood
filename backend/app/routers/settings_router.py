from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RestaurantSettings, Admin
from ..schemas import RestaurantSettingsOut, RestaurantSettingsUpdate
from ..auth import get_current_admin
from ..utils import save_upload_image

router = APIRouter(prefix="/api/settings", tags=["Settings"])


def _get_or_create(db: Session) -> RestaurantSettings:
    s = db.query(RestaurantSettings).filter(RestaurantSettings.id == "settings").first()
    if not s:
        s = RestaurantSettings(id="settings")
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("", response_model=RestaurantSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _get_or_create(db)


@router.put("", response_model=RestaurantSettingsOut)
def update_settings(payload: RestaurantSettingsUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    s = _get_or_create(db)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.post("/upload-image")
async def upload_generic_image(file: UploadFile = File(...), admin: Admin = Depends(get_current_admin)):
    """Generic image upload used by the admin for product/category/promotion/logo images."""
    url = await save_upload_image(file, "products")
    return {"url": url}
