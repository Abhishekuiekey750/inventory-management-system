from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.database import get_db
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerListResponse
from app.services.customer import customer_service

router = APIRouter()

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create a new customer profile. Email must be unique.
    """
    return customer_service.create_customer(db, customer_in)

@router.get("/", response_model=CustomerListResponse)
def read_customers(
    query: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(10, ge=1, le=100, description="Pagination limit"),
    db: Session = Depends(get_db)
):
    """
    Retrieve customers list with pagination and search.
    """
    items, total = customer_service.get_customers(
        db,
        query=query,
        skip=skip,
        limit=limit
    )
    page = (skip // limit) + 1
    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{id}", response_model=CustomerResponse)
def read_customer(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a customer profile details by ID.
    """
    return customer_service.get_customer(db, id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a customer profile. Fails with 409 Conflict if they have placed orders.
    """
    customer_service.delete_customer(db, id)
    return None
