from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
import uuid
from typing import Optional

from app.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services.product import product_service

router = APIRouter()

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product. SKU must be unique.
    """
    return product_service.create_product(db, product_in)

@router.get("/", response_model=ProductListResponse)
def read_products(
    query: Optional[str] = Query(None, description="Search by product name or SKU"),
    low_stock: bool = Query(False, description="Filter products in low stock state"),
    low_stock_threshold: int = Query(10, description="Quantity threshold defining low stock"),
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(10, ge=1, le=100, description="Pagination page size"),
    db: Session = Depends(get_db)
):
    """
    Retrieve products list with pagination, search, and stock level filtering.
    """
    items, total = product_service.get_products(
        db,
        query=query,
        low_stock=low_stock,
        low_stock_threshold=low_stock_threshold,
        skip=skip,
        limit=limit
    )
    page = (skip // limit) + 1
    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{id}", response_model=ProductResponse)
def read_product(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a single product details by ID.
    """
    return product_service.get_product(db, id)

@router.put("/{id}", response_model=ProductResponse)
def update_product(id: uuid.UUID, product_in: ProductUpdate, db: Session = Depends(get_db)):
    """
    Update an existing product details. SKU changes are validated for uniqueness.
    """
    return product_service.update_product(db, id, product_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Delete a product by ID. Fails with 409 Conflict if referencing order items exist.
    """
    product_service.delete_product(db, id)
    return None
