import uuid
from decimal import Decimal
import datetime
from sqlalchemy import String, Numeric, Integer, DateTime, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.models.base import Base

class Product(Base):
    __tablename__ = "products"
    
    __table_args__ = (
        CheckConstraint("price > 0", name="check_product_price_positive"),
        CheckConstraint("quantity_in_stock >= 0", name="check_product_quantity_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255), 
        nullable=False, 
        index=True
    )
    sku: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        nullable=False, 
        index=True
    )
    price: Mapped[Decimal] = mapped_column(
        Numeric(precision=10, scale=2), 
        nullable=False
    )
    quantity_in_stock: Mapped[int] = mapped_column(
        Integer, 
        nullable=False, 
        default=0
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<Product(name={self.name}, sku={self.sku}, price={self.price}, quantity={self.quantity_in_stock})>"
