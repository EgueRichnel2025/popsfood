import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Admin(Base):
    __tablename__ = "admins"
    id = Column(String, primary_key=True, default=gen_uuid)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="admin")  # admin | superadmin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    compare_at_price = Column(Float, nullable=True)  # ancien prix si promo
    image_url = Column(String, nullable=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    is_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    option_groups = relationship(
        "OptionGroup", back_populates="product", cascade="all, delete-orphan"
    )


class OptionGroup(Base):
    """A configurable group of choices for a product, e.g. 'Fromage', 'Sauce'."""
    __tablename__ = "option_groups"
    id = Column(String, primary_key=True, default=gen_uuid)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False)  # ex: "Accompagnement", "Sauce"
    is_required = Column(Boolean, default=False)
    allow_multiple = Column(Boolean, default=False)  # checkbox vs radio
    max_choices = Column(Integer, default=1)
    display_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="option_groups")
    choices = relationship(
        "OptionChoice", back_populates="group", cascade="all, delete-orphan"
    )


class OptionChoice(Base):
    """A single selectable choice inside an option group, with optional extra price."""
    __tablename__ = "option_choices"
    id = Column(String, primary_key=True, default=gen_uuid)
    group_id = Column(String, ForeignKey("option_groups.id"), nullable=False)
    label = Column(String, nullable=False)  # ex: "Fromage fondant"
    extra_price = Column(Float, default=0)
    is_available = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    group = relationship("OptionGroup", back_populates="choices")


class Promotion(Base):
    __tablename__ = "promotions"
    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    regular_price = Column(Float, nullable=False)
    promo_price = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    is_highlighted = Column(Boolean, default=False)  # mise en avant accueil

    product = relationship("Product")


class DeliveryZone(Base):
    __tablename__ = "delivery_zones"
    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)  # ex: "Calavi Centre", "Godomey"
    fee = Column(Float, nullable=False, default=0)
    is_active = Column(Boolean, default=True)


class OrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "en_attente_paiement"
    PAYMENT_TO_VERIFY = "paiement_a_verifier"
    PAYMENT_CONFIRMED = "paiement_confirme"
    ORDER_CONFIRMED = "commande_confirmee"
    PREPARING = "en_preparation"
    DELIVERING = "en_livraison"
    DELIVERED = "livree"
    CANCELLED = "annulee"
    PAYMENT_REJECTED = "paiement_rejete"


class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=gen_uuid)
    order_number = Column(String, unique=True, nullable=False)

    # Client info
    customer_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    whatsapp = Column(String, nullable=True)

    # Delivery info (in the spirit of the Mercerie project)
    delivery_zone_id = Column(String, ForeignKey("delivery_zones.id"), nullable=True)
    address = Column(String, nullable=False)
    quartier = Column(String, nullable=False)
    landmark = Column(String, nullable=True)  # repère
    extra_notes = Column(Text, nullable=True)  # précision supplémentaire
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)

    # Amounts (always recomputed server-side, never trusted from frontend)
    subtotal = Column(Float, nullable=False)
    delivery_fee = Column(Float, nullable=False, default=0)
    total = Column(Float, nullable=False)

    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING_PAYMENT)

    # Payment
    payment_number_used = Column(String, nullable=True)
    payment_proof_url = Column(String, nullable=True)
    payment_rejected_reason = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    delivery_zone = relationship("DeliveryZone")
    status_history = relationship(
        "OrderStatusHistory", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(String, primary_key=True, default=gen_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    product_name = Column(String, nullable=False)  # snapshot
    unit_price = Column(Float, nullable=False)  # snapshot (incl. options)
    quantity = Column(Integer, nullable=False, default=1)
    selected_options = Column(Text, nullable=True)  # JSON snapshot of chosen options
    line_total = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id = Column(String, primary_key=True, default=gen_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    status = Column(Enum(OrderStatus), nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="status_history")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(String, primary_key=True, default=gen_uuid)
    customer_name = Column(String, nullable=True, default="Client anonyme")
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    is_approved = Column(Boolean, default=False)
    is_hidden = Column(Boolean, default=False)
    ip_hash = Column(String, nullable=True)  # basic anti-spam tracking
    created_at = Column(DateTime, default=datetime.utcnow)


class RestaurantSettings(Base):
    """Singleton-style settings table (one row) editable from the admin panel."""
    __tablename__ = "restaurant_settings"
    id = Column(String, primary_key=True, default=lambda: "settings")

    restaurant_name = Column(String, default="Pop's FOOD BENIN")
    logo_url = Column(String, nullable=True)
    city = Column(String, default="Calavi, Bénin")
    phone = Column(String, default="")
    whatsapp = Column(String, default="")
    opening_hours = Column(String, nullable=True)

    # Payment configuration (never hardcoded elsewhere)
    payment_number = Column(String, default="01-69-12-19-11")
    payment_beneficiary = Column(String, default="DOSSOU-YOVO Annette")
    payment_instructions = Column(
        Text, default="Veuillez envoyer la capture après dépôt ainsi que le numéro à joindre."
    )
    payment_fee_note = Column(
        String, default="NB : Prière de ne pas oublier les frais de transaction."
    )

    # Social links
    tiktok_url = Column(String, nullable=True)
    facebook_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
