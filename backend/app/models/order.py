import uuid
from decimal import Decimal
import datetime
from typing import List
from sqlalchemy import String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.models.base import Base

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=2), 
        nullable=False,
        default=Decimal("0.00")
    )
    status: Mapped[str] = mapped_column(
        String(50), 
        nullable=False,
        default="PENDING" # Valid statuses: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

    # Relationships
    customer = relationship("Customer", backref="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", 
        back_populates="order", 
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Order(id={self.id}, customer_id={self.customer_id}, total={self.total_amount}, status={self.status})>"
