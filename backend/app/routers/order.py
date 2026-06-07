from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.database import get_db
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, OrderListResponse
from app.services.order import order_service

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    """
    Place a new order. Inventory checks are done and product quantities reduced transactionally.
    """
    return order_service.create_order(db, order_in)

@router.get("/", response_model=OrderListResponse)
def read_orders(
    customer_id: Optional[uuid.UUID] = Query(None, description="Filter orders by Customer ID"),
    status: Optional[str] = Query(None, description="Filter orders by status (PENDING, CONFIRMED, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve orders with optional filter by customer or status and pagination.
    """
    items, total = order_service.get_orders(
        db,
        customer_id=customer_id,
        status=status,
        skip=skip,
        limit=limit
    )
    page = (skip // limit) + 1
    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{id}", response_model=OrderResponse)
def read_order(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get detailed order history and ordered items by Order ID.
    """
    return order_service.get_order(db, id)

@router.put("/{id}/status", response_model=OrderResponse)
def update_order_status(id: uuid.UUID, status_in: OrderStatusUpdate, db: Session = Depends(get_db)):
    """
    Update the status of an order. Transitions out of/into CANCELLED trigger stock modifications.
    """
    return order_service.update_order_status(db, id, status_in)

@router.delete("/{id}", response_model=OrderResponse)
def cancel_order(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Soft cancels the order, setting status to CANCELLED and returning quantities to inventory.
    """
    return order_service.cancel_order_soft(db, id)
