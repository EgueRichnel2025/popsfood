import json
import random
import string
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import (
    Order, OrderItem, OrderStatusHistory, OrderStatus,
    Product, OptionChoice, DeliveryZone, Admin,
)
from ..schemas import (
    OrderCreate, OrderOut, PaymentDecision, OrderStatusUpdate, DashboardStats,
)
from ..auth import get_current_admin
from ..utils import save_upload_image

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _generate_order_number() -> str:
    today = datetime.utcnow().strftime("%y%m%d")
    suffix = "".join(random.choices(string.digits, k=4))
    return f"PF-{today}-{suffix}"


def _with_relations(q):
    return q.options(joinedload(Order.items), joinedload(Order.status_history))


@router.post("", response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(400, "Le panier est vide.")

    subtotal = 0.0
    order_items: List[OrderItem] = []

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(404, f"Produit introuvable ({item.product_id}).")
        if not product.is_available:
            raise HTTPException(400, f"« {product.name} » n'est plus disponible.")

        unit_price = product.price
        selected_snapshot = []

        if item.selected_option_choice_ids:
            choices = (
                db.query(OptionChoice)
                .filter(OptionChoice.id.in_(item.selected_option_choice_ids))
                .all()
            )
            found_ids = {c.id for c in choices}
            missing = set(item.selected_option_choice_ids) - found_ids
            if missing:
                raise HTTPException(400, "Une option sélectionnée n'existe plus.")
            for c in choices:
                if not c.is_available:
                    raise HTTPException(400, f"L'option « {c.label} » n'est plus disponible.")
                unit_price += c.extra_price
                selected_snapshot.append(
                    {"group_name": c.group.name, "choice_label": c.label, "extra_price": c.extra_price}
                )

        # Validate required option groups are satisfied
        selected_by_group = {}
        for sc, choice_id in zip(selected_snapshot, item.selected_option_choice_ids):
            selected_by_group.setdefault(sc["group_name"], 0)
            selected_by_group[sc["group_name"]] += 1

        for group in product.option_groups:
            count = selected_by_group.get(group.name, 0)
            if group.is_required and count == 0:
                raise HTTPException(400, f"Veuillez choisir une option pour « {group.name} » sur « {product.name} ».")
            if count > group.max_choices:
                raise HTTPException(400, f"Trop de choix sélectionnés pour « {group.name} ».")

        line_total = round(unit_price * item.quantity, 2)
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=unit_price,
                quantity=item.quantity,
                selected_options=json.dumps(selected_snapshot, ensure_ascii=False),
                line_total=line_total,
            )
        )

    delivery_fee = 0.0
    if payload.delivery_zone_id:
        zone = db.query(DeliveryZone).filter(
            DeliveryZone.id == payload.delivery_zone_id, DeliveryZone.is_active == True  # noqa: E712
        ).first()
        if not zone:
            raise HTTPException(400, "Zone de livraison invalide ou désactivée.")
        delivery_fee = zone.fee

    total = round(subtotal + delivery_fee, 2)

    order = Order(
        order_number=_generate_order_number(),
        customer_name=payload.customer_name,
        phone=payload.phone,
        whatsapp=payload.whatsapp,
        delivery_zone_id=payload.delivery_zone_id,
        address=payload.address,
        quartier=payload.quartier,
        landmark=payload.landmark,
        extra_notes=payload.extra_notes,
        gps_lat=payload.gps_lat,
        gps_lng=payload.gps_lng,
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        total=total,
        status=OrderStatus.PENDING_PAYMENT,
    )
    order.items = order_items
    db.add(order)
    db.flush()
    db.add(OrderStatusHistory(order_id=order.id, status=OrderStatus.PENDING_PAYMENT, note="Commande créée."))
    db.commit()
    db.refresh(order)
    return order


@router.get("/track/{order_number}", response_model=OrderOut)
def track_order(order_number: str, db: Session = Depends(get_db)):
    order = _with_relations(db.query(Order)).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(404, "Commande introuvable. Vérifiez le numéro de commande.")
    return order


@router.post("/{order_id}/payment-proof", response_model=OrderOut)
async def submit_payment_proof(
    order_id: str,
    payment_number_used: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable.")
    if order.status not in (OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_REJECTED):
        raise HTTPException(400, "Cette commande n'attend pas de preuve de paiement.")

    url = await save_upload_image(file, "payments")
    order.payment_proof_url = url
    order.payment_number_used = payment_number_used
    order.payment_rejected_reason = None
    order.status = OrderStatus.PAYMENT_TO_VERIFY
    db.add(OrderStatusHistory(order_id=order.id, status=OrderStatus.PAYMENT_TO_VERIFY, note="Preuve de paiement envoyée par le client."))
    db.commit()
    db.refresh(order)
    return order


# ---------- Admin ----------
@router.get("", response_model=List[OrderOut])
def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = _with_relations(db.query(Order))
    if status_filter:
        q = q.filter(Order.status == status_filter)
    return q.order_by(Order.created_at.desc()).all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    order = _with_relations(db.query(Order)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable.")
    return order


@router.post("/{order_id}/payment-decision", response_model=OrderOut)
def decide_payment(order_id: str, payload: PaymentDecision, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable.")
    if order.status != OrderStatus.PAYMENT_TO_VERIFY:
        raise HTTPException(400, "Cette commande n'a pas de paiement en attente de vérification.")

    if payload.approve:
        order.status = OrderStatus.PAYMENT_CONFIRMED
        note = "Paiement vérifié et confirmé par l'administrateur."
    else:
        if not payload.reason:
            raise HTTPException(400, "Merci d'indiquer le motif du rejet.")
        order.status = OrderStatus.PAYMENT_REJECTED
        order.payment_rejected_reason = payload.reason
        note = f"Paiement rejeté : {payload.reason}"

    db.add(OrderStatusHistory(order_id=order.id, status=order.status, note=note))
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_status(order_id: str, payload: OrderStatusUpdate, db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Commande introuvable.")
    order.status = payload.status
    db.add(OrderStatusHistory(order_id=order.id, status=payload.status, note=payload.note))
    db.commit()
    db.refresh(order)
    return order


@router.get("/stats/dashboard", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    from ..models import Promotion

    orders = db.query(Order).all()
    today = date.today()

    completed_statuses = {OrderStatus.DELIVERED}
    revenue_total = sum(o.total for o in orders if o.status in completed_statuses)
    revenue_today = sum(
        o.total for o in orders if o.status in completed_statuses and o.created_at.date() == today
    )
    orders_today = sum(1 for o in orders if o.created_at.date() == today)
    orders_pending = sum(
        1 for o in orders
        if o.status in (OrderStatus.PENDING_PAYMENT, OrderStatus.PAYMENT_TO_VERIFY, OrderStatus.ORDER_CONFIRMED, OrderStatus.PREPARING)
    )
    orders_delivering = sum(1 for o in orders if o.status == OrderStatus.DELIVERING)
    orders_completed = sum(1 for o in orders if o.status == OrderStatus.DELIVERED)

    product_counts = {}
    for o in orders:
        for it in o.items:
            product_counts[it.product_name] = product_counts.get(it.product_name, 0) + it.quantity
    top_products = sorted(
        [{"name": k, "quantity": v} for k, v in product_counts.items()],
        key=lambda x: x["quantity"], reverse=True
    )[:5]

    active_promotions = db.query(Promotion).filter(Promotion.is_active == True).count()  # noqa: E712

    return DashboardStats(
        revenue_total=round(revenue_total, 2),
        revenue_today=round(revenue_today, 2),
        orders_total=len(orders),
        orders_today=orders_today,
        orders_pending=orders_pending,
        orders_delivering=orders_delivering,
        orders_completed=orders_completed,
        top_products=top_products,
        active_promotions=active_promotions,
    )