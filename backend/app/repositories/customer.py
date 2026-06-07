from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from app.repositories.base import BaseRepository
from app.models.customer import Customer

class CustomerRepository(BaseRepository[Customer]):
    def __init__(self):
        super().__init__(Customer)

    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        """Get a single customer by email."""
        stmt = select(Customer).where(Customer.email == email)
        return db.scalars(stmt).first()

    def search_and_filter(
        self,
        db: Session,
        *,
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Customer], int]:
        """
        Search customers by name/email with pagination.
        Returns a tuple of (list of customers, total matching count).
        """
        stmt = select(Customer)
        
        # Apply search pattern
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Customer.full_name.ilike(search_pattern),
                    Customer.email.ilike(search_pattern)
                )
            )
            
        # Get count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = db.scalar(count_stmt) or 0
        
        # Paginate results
        stmt = stmt.order_by(Customer.full_name.asc()).offset(skip).limit(limit)
        results = list(db.scalars(stmt).all())
        
        return results, total_count

customer_repository = CustomerRepository()
