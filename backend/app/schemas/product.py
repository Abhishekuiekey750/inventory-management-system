from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
import uuid
import datetime
from typing import Optional, List

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product name")
    sku: str = Field(..., min_length=1, max_length=100, description="Unique Stock Keeping Unit (SKU)")
    price: Decimal = Field(..., gt=Decimal("0.00"), decimal_places=2, description="Product unit price, must be positive")
    quantity_in_stock: int = Field(..., ge=0, description="Available inventory, must be non-negative")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=Decimal("0.00"), decimal_places=2)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductResponse(ProductBase):
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    limit: int


