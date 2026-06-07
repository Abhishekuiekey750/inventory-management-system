from app.repositories.base import BaseRepository
from app.repositories.product import product_repository, ProductRepository
from app.repositories.customer import customer_repository, CustomerRepository
from app.repositories.order import order_repository, OrderRepository

__all__ = [
    "BaseRepository",
    "product_repository",
    "ProductRepository",
    "customer_repository",
    "CustomerRepository",
    "order_repository",
    "OrderRepository"
]
