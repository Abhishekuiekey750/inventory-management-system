from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.dashboard import DashboardStatsResponse
from decimal import Decimal

class DashboardService:
    """
    Service layer providing metrics for the admin dashboard.
    Performs optimized database-level aggregation to fetch counts and inventory valuation.
    """
    def get_stats(self, db: Session, low_stock_threshold: int = 10) -> DashboardStatsResponse:
        # 1. Total counts
        total_products = db.scalar(select(func.count(Product.id))) or 0
        total_customers = db.scalar(select(func.count(Customer.id))) or 0
        total_orders = db.scalar(select(func.count(Order.id))) or 0

        # 2. Low stock count
        low_stock_count = db.scalar(
            select(func.count(Product.id)).where(Product.quantity_in_stock <= low_stock_threshold)
        ) or 0

        # 3. Total inventory value: SUM(price * quantity_in_stock)
        # Using coalesce/or to fallback to Decimal("0.00") if database returns None (empty table)
        total_value = db.scalar(
            select(func.sum(Product.price * Product.quantity_in_stock))
        )
        total_inventory_value = Decimal(str(total_value)) if total_value is not None else Decimal("0.00")

        # 4. Fetch list of low-stock products
        low_stock_stmt = (
            select(Product)
            .where(Product.quantity_in_stock <= low_stock_threshold)
            .order_by(Product.quantity_in_stock.asc())
        )
        low_stock_products = list(db.scalars(low_stock_stmt).all())

        return DashboardStatsResponse(
            total_products=total_products,
            total_customers=total_customers,
            total_orders=total_orders,
            low_stock_count=low_stock_count,
            total_inventory_value=total_inventory_value,
            low_stock_products=low_stock_products
        )

dashboard_service = DashboardService()
