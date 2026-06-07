from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from app.repositories.base import BaseRepository
from app.models.product import Product

class ProductRepository(BaseRepository[Product]):
    def __init__(self):
        super().__init__(Product)

    def get_by_sku(self, db: Session, sku: str) -> Optional[Product]:
        """Get a single product by its SKU."""
        stmt = select(Product).where(Product.sku == sku)
        return db.scalars(stmt).first()

    def search_and_filter(
        self,
        db: Session,
        *,
        query: Optional[str] = None,
        low_stock: bool = False,
        low_stock_threshold: int = 10,
        skip: int = 0,
        limit: int = 10
    ) -> Tuple[List[Product], int]:
        """
        Search products by name/SKU and filter by stock status with pagination.
        Returns a tuple of (list of products, total matching count).
        """
        stmt = select(Product)
        
        # Apply search query filter (case-insensitive)
        if query:
            search_pattern = f"%{query}%"
            stmt = stmt.where(
                or_(
                    Product.name.ilike(search_pattern),
                    Product.sku.ilike(search_pattern)
                )
            )
            
        # Apply low stock filter
        if low_stock:
            stmt = stmt.where(Product.quantity_in_stock <= low_stock_threshold)
            
        # Obtain total count before limit/offset
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_count = db.scalar(count_stmt) or 0
        
        # Apply pagination
        stmt = stmt.order_by(Product.name.asc()).offset(skip).limit(limit)
        results = list(db.scalars(stmt).all())
        
        return results, total_count

product_repository = ProductRepository()
