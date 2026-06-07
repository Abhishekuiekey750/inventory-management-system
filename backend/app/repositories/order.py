from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import select, func
from app.repositories.base import BaseRepository
from app.models.order import Order

class OrderRepository(BaseRepository[Order]):
    def __init__(self):
        super().__init__(Order)

    def get_by_id_with_relations(self, db: Session, order_id: uuid.UUID) -> Optional[Order]:
        """
        Fetch an order by ID and eagerly load the associated customer and line items
        to prevent N+1 query performance issues.
        """
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                joinedload(Order.customer),
                selectinload(Order.items)
            )
        )
        return db.scalars(stmt).first()

    def get_multi_with_filters(
        self,
        db: Session,
        *,
        customer_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Order], int]:
        """
        Retrieve order listing with optional customer/status filters, sorted by descending created_at.
        Returns a tuple of (list of orders, total matching count).
        """
        stmt = select(Order)
        
        # Apply filters
        if customer_id:
            stmt = stmt.where(Order.customer_id == customer_id)
        if status:
            stmt = stmt.where(Order.status == status)
            
        # Get total matching count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = db.scalar(count_stmt) or 0
        
        # Paginate and load customer relationship
        stmt = (
            stmt.order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(joinedload(Order.customer))
        )
        results = list(db.scalars(stmt).all())
        
        return results, total_count

order_repository = OrderRepository()
