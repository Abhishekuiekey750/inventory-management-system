from fastapi import APIRouter
from app.routers import product, customer, order, dashboard

api_router = APIRouter()

# Register sub-routers under their respective endpoint prefixes
api_router.include_router(product.router, prefix="/products", tags=["Products"])
api_router.include_router(customer.router, prefix="/customers", tags=["Customers"])
api_router.include_router(order.router, prefix="/orders", tags=["Orders"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
