import uuid
from decimal import Decimal
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.order import order_repository
from app.repositories.product import product_repository
from app.services.customer import customer_service
from app.models.order import Order
from app.models.order_item import OrderItem
from app.schemas.order import OrderCreate, OrderStatusUpdate

class OrderService:
    """
    Service layer containing business logic rules for Orders.
    Ensures transactional safety on order creation, status transitions, and cancellation.
    """
    def create_order(self, db: Session, order_in: OrderCreate) -> Order:
        # 1. Verify customer exists
        customer_service.get_customer(db, order_in.customer_id)
        
        # We wrap the operations in a manual transaction try/except block.
        # Since the session yielded by FastAPI is in a transaction, if we encounter an error,
        # we roll back the session.
        try:
            total_amount = Decimal("0.00")
            order_items = []
            
            # Process each order item
            for item in order_in.items:
                product = product_repository.get(db, item.product_id)
                if not product:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product with ID '{item.product_id}' not found."
                    )
                
                # Check stock availability
                if product.quantity_in_stock < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for product '{product.name}'. "
                               f"Available: {product.quantity_in_stock}, Requested: {item.quantity}."
                    )
                
                # Decrement product inventory
                product.quantity_in_stock -= item.quantity
                
                # Calculate costs
                item_total = product.price * Decimal(item.quantity)
                total_amount += item_total
                
                # Create OrderItem object
                order_item = OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    unit_price=product.price
                )
                order_items.append(order_item)
            
            # Create Order object
            db_order = Order(
                customer_id=order_in.customer_id,
                total_amount=total_amount,
                status="PENDING",
                items=order_items
            )
            
            db.add(db_order)
            db.commit()
            db.refresh(db_order)
            return db_order
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to place order: {str(e)}"
            )

    def get_order(self, db: Session, order_id: uuid.UUID) -> Order:
        order = order_repository.get_by_id_with_relations(db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return order

    def get_orders(
        self,
        db: Session,
        *,
        customer_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Order], int]:
        return order_repository.get_multi_with_filters(
            db,
            customer_id=customer_id,
            status=status,
            skip=skip,
            limit=limit
        )

    def update_order_status(self, db: Session, order_id: uuid.UUID, status_in: OrderStatusUpdate) -> Order:
        db_order = self.get_order(db, order_id)
        old_status = db_order.status
        new_status = status_in.status.upper()
        
        valid_statuses = {"PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"}
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{new_status}'. Allowed statuses: {', '.join(valid_statuses)}."
            )
            
        if old_status == new_status:
            return db_order
            
        try:
            # 1. State transition logic for stock restoration on cancellation
            if new_status == "CANCELLED" and old_status != "CANCELLED":
                # Restore stock for each item in the order
                for item in db_order.items:
                    product = product_repository.get(db, item.product_id)
                    if product:
                        product.quantity_in_stock += item.quantity
            
            # 2. State transition logic if moving OUT of cancelled status
            # (re-allocate stock, verifying availability)
            elif old_status == "CANCELLED" and new_status != "CANCELLED":
                for item in db_order.items:
                    product = product_repository.get(db, item.product_id)
                    if not product:
                        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="Cannot reactivate order: Associated product was deleted."
                        )
                    if product.quantity_in_stock < item.quantity:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Cannot reactivate order: Insufficient stock for product '{product.name}'. "
                                   f"Available: {product.quantity_in_stock}, Required: {item.quantity}."
                        )
                    product.quantity_in_stock -= item.quantity
            
            db_order.status = new_status
            db.commit()
            db.refresh(db_order)
            return db_order
            
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update order status: {str(e)}"
            )

    def cancel_order_soft(self, db: Session, order_id: uuid.UUID) -> Order:
        """
        Soft cancel the order (i.e. sets status to CANCELLED and restores stock, 
        without deleting the records from database). Used by DELETE /orders/{id}.
        """
        db_order = self.get_order(db, order_id)
        if db_order.status == "CANCELLED":
            # Order is already cancelled, just return it
            return db_order
            
        # Call update status to handle stock restoration and database commits
        return self.update_order_status(db, order_id=order_id, status_in=OrderStatusUpdate(status="CANCELLED"))

order_service = OrderService()
