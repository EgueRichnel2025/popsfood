from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr

from .models import OrderStatus


# ---------- Auth ----------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_name: str


class AdminUpdateCredentials(BaseModel):
    current_password: str
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    new_password: Optional[str] = None


class AdminForgotPasswordRequest(BaseModel):
    email: EmailStr


class AdminResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


# ---------- Category ----------
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryOut(CategoryBase):
    id: str

    class Config:
        from_attributes = True


# ---------- Options ----------
class OptionChoiceBase(BaseModel):
    label: str
    extra_price: float = 0
    is_available: bool = True
    display_order: int = 0


class OptionChoiceCreate(OptionChoiceBase):
    pass


class OptionChoiceOut(OptionChoiceBase):
    id: str

    class Config:
        from_attributes = True


class OptionGroupBase(BaseModel):
    name: str
    is_required: bool = False
    allow_multiple: bool = False
    max_choices: int = 1
    display_order: int = 0


class OptionGroupCreate(OptionGroupBase):
    choices: List[OptionChoiceCreate] = []


class OptionGroupOut(OptionGroupBase):
    id: str
    choices: List[OptionChoiceOut] = []

    class Config:
        from_attributes = True


# ---------- Product ----------
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    image_url: Optional[str] = None
    category_id: str
    is_available: bool = True
    is_featured: bool = False


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None


class ProductOut(ProductBase):
    id: str
    created_at: datetime
    option_groups: List[OptionGroupOut] = []

    class Config:
        from_attributes = True


# ---------- Promotion ----------
class PromotionBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    product_id: Optional[str] = None
    regular_price: float
    promo_price: float
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    is_highlighted: bool = False


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    product_id: Optional[str] = None
    regular_price: Optional[float] = None
    promo_price: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_highlighted: Optional[bool] = None


class PromotionOut(PromotionBase):
    id: str

    class Config:
        from_attributes = True


# ---------- Delivery zone ----------
class DeliveryZoneBase(BaseModel):
    name: str
    fee: float
    is_active: bool = True


class DeliveryZoneCreate(DeliveryZoneBase):
    pass


class DeliveryZoneUpdate(BaseModel):
    name: Optional[str] = None
    fee: Optional[float] = None
    is_active: Optional[bool] = None


class DeliveryZoneOut(DeliveryZoneBase):
    id: str

    class Config:
        from_attributes = True


# ---------- Orders ----------
class SelectedOption(BaseModel):
    group_name: str
    choice_label: str
    extra_price: float = 0


class CartItemIn(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    selected_option_choice_ids: List[str] = []  # IDs, price is looked up server-side


class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    whatsapp: Optional[str] = None
    delivery_zone_id: Optional[str] = None
    address: str
    quartier: str
    landmark: Optional[str] = None
    extra_notes: Optional[str] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    items: List[CartItemIn]


class OrderItemOut(BaseModel):
    id: str
    product_name: str
    unit_price: float
    quantity: int
    selected_options: Optional[str] = None
    line_total: float

    class Config:
        from_attributes = True


class OrderStatusHistoryOut(BaseModel):
    status: OrderStatus
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: str
    order_number: str
    customer_name: str
    phone: str
    whatsapp: Optional[str]
    address: str
    quartier: str
    landmark: Optional[str]
    extra_notes: Optional[str]
    subtotal: float
    delivery_fee: float
    total: float
    status: OrderStatus
    payment_number_used: Optional[str]
    payment_proof_url: Optional[str]
    payment_rejected_reason: Optional[str]
    created_at: datetime
    items: List[OrderItemOut] = []
    status_history: List[OrderStatusHistoryOut] = []

    class Config:
        from_attributes = True


class PaymentProofSubmit(BaseModel):
    payment_number_used: str


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: Optional[str] = None


class PaymentDecision(BaseModel):
    approve: bool
    reason: Optional[str] = None  # required if rejecting


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    customer_name: Optional[str] = "Client anonyme"
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    customer_name: Optional[str]
    rating: int
    comment: Optional[str]
    is_approved: bool
    is_hidden: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewModerate(BaseModel):
    is_approved: Optional[bool] = None
    is_hidden: Optional[bool] = None


# ---------- Settings ----------
class RestaurantSettingsOut(BaseModel):
    restaurant_name: str
    logo_url: Optional[str]
    city: str
    phone: str
    whatsapp: str
    opening_hours: Optional[str]
    payment_number: str
    payment_beneficiary: str
    payment_instructions: str
    payment_fee_note: str
    tiktok_url: Optional[str]
    facebook_url: Optional[str]
    instagram_url: Optional[str]

    class Config:
        from_attributes = True


class RestaurantSettingsUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    opening_hours: Optional[str] = None
    payment_number: Optional[str] = None
    payment_beneficiary: Optional[str] = None
    payment_instructions: Optional[str] = None
    payment_fee_note: Optional[str] = None
    tiktok_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None


class DashboardStats(BaseModel):
    revenue_total: float
    revenue_today: float
    orders_total: int
    orders_today: int
    orders_pending: int
    orders_delivering: int
    orders_completed: int
    top_products: List[dict]
    active_promotions: int