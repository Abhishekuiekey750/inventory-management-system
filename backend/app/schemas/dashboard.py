from pydantic import BaseModel, Field
from decimal import Decimal
from typing import List
from app.schemas.product import ProductResponse

class DashboardStatsResponse(BaseModel):
    total_products: int = Field(..., ge=0, description="Total number of active products")
    total_customers: int = Field(..., ge=0, description="Total number of customers")
    total_orders: int = Field(..., ge=0, description="Total number of orders")
    low_stock_count: int = Field(..., ge=0, description="Number of products with stock <= threshold")
    total_inventory_value: Decimal = Field(..., ge=Decimal("0.00"), description="Total sum of (price * quantity_in_stock) for all products")
    low_stock_products: List[ProductResponse] = Field(default=[], description="List of products currently in low-stock status")
