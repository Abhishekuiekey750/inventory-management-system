import uuid
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status
from app.repositories.product import product_repository
from app.models.product import Product
from app.models.order_item import OrderItem
from app.schemas.product import ProductCreate, ProductUpdate

class ProductService:
    """
    Service layer containing business logic rules for Products.
    """
    def create_product(self, db: Session, product_in: ProductCreate) -> Product:
        # Check SKU uniqueness
        existing = product_repository.get_by_sku(db, product_in.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product SKU '{product_in.sku}' already exists."
            )
        return product_repository.create(db, obj_in=product_in)

    def get_product(self, db: Session, product_id: uuid.UUID) -> Product:
        product = product_repository.get(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product

    def get_products(
        self,
        db: Session,
        *,
        query: Optional[str] = None,
        low_stock: bool = False,
        low_stock_threshold: int = 10,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Product], int]:
        return product_repository.search_and_filter(
            db,
            query=query,
            low_stock=low_stock,
            low_stock_threshold=low_stock_threshold,
            skip=skip,
            limit=limit
        )

    def update_product(self, db: Session, product_id: uuid.UUID, product_in: ProductUpdate) -> Product:
        db_product = self.get_product(db, product_id)
        
        # Verify SKU uniqueness if changed
        if product_in.sku and product_in.sku != db_product.sku:
            existing = product_repository.get_by_sku(db, product_in.sku)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Product SKU '{product_in.sku}' is already taken by another product."
                )
                
        return product_repository.update(db, db_obj=db_product, obj_in=product_in)

    def delete_product(self, db: Session, product_id: uuid.UUID) -> Product:
        db_product = self.get_product(db, product_id)
        
        # Prevent deletion if referenced by existing orders
        order_item_exists = db.scalar(
            select(OrderItem.id).where(OrderItem.product_id == product_id).limit(1)
        )
        if order_item_exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete product: It is referenced by one or more existing orders."
            )
            
        return product_repository.remove(db, id=product_id)

product_service = ProductService()
