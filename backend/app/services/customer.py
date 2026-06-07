import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.repositories.customer import customer_repository
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate

class CustomerService:
    """
    Service layer containing business logic rules for Customers.
    """
    def create_customer(self, db: Session, customer_in: CustomerCreate) -> Customer:
        # Check email uniqueness
        existing = customer_repository.get_by_email(db, customer_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Customer with email '{customer_in.email}' already exists."
            )
        return customer_repository.create(db, obj_in=customer_in)

    def get_customer(self, db: Session, customer_id: uuid.UUID) -> Customer:
        customer = customer_repository.get(db, customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        return customer

    def get_customers(
        self,
        db: Session,
        *,
        query: Optional[str] = None,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Customer], int]:
        return customer_repository.search_and_filter(
            db,
            query=query,
            skip=skip,
            limit=limit
        )

    def delete_customer(self, db: Session, customer_id: uuid.UUID) -> Customer:
        db_customer = self.get_customer(db, customer_id)
        
        # Prevent deletion if customer has placed any orders
        order_exists = db.scalar(
            select(Order.id).where(Order.customer_id == customer_id).limit(1)
        )
        if order_exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete customer: They have one or more existing orders in the system."
            )
            
        return customer_repository.remove(db, id=customer_id)

customer_service = CustomerService()
