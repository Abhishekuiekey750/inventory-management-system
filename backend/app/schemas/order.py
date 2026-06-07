from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
import uuid
import datetime
from typing import List, Optional
from app.schemas.customer import CustomerResponse

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID = Field(..., description="ID of the product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity ordered, must be greater than zero")

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    customer_id: uuid.UUID = Field(..., description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items to include in the order")

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED")

class OrderResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    total_amount: Decimal
    status: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    limit: int


