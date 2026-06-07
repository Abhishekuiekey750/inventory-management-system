import sys
import os
import uuid
from decimal import Decimal
from fastapi.testclient import TestClient

# Add current directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database import SessionLocal
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem

client = TestClient(app)

def cleanup_db():
    """Helper to wipe test data from PostgreSQL tables to ensure clean test runs."""
    db = SessionLocal()
    try:
        # Delete order items, orders, customers, and products
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(Customer).delete()
        db.query(Product).delete()
        db.commit()
        print("Test database cleaned up successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during database cleanup: {e}")
    finally:
        db.close()

def test_flow():
    print("Starting integration test flow on PostgreSQL...")
    
    # 1. Clean database before test
    cleanup_db()

    # 2. Test Product Creation
    product_data_1 = {
        "name": "Sony PlayStation 5",
        "sku": "SONY-PS5-001",
        "price": "499.99",
        "quantity_in_stock": 10
    }
    response = client.post("/api/v1/products/", json=product_data_1)
    assert response.status_code == 201, f"Failed product 1: {response.json()}"
    p1 = response.json()
    assert p1["name"] == "Sony PlayStation 5"
    assert p1["sku"] == "SONY-PS5-001"
    assert p1["price"] == "499.99"
    assert p1["quantity_in_stock"] == 10
    print("[PASS] Product 1 created.")

    # Test Duplicate SKU constraint (409 Conflict)
    response = client.post("/api/v1/products/", json=product_data_1)
    assert response.status_code == 409
    assert response.json()["success"] is False
    assert "already exists" in response.json()["message"]
    print("[PASS] Duplicate SKU blocked with 409 Conflict.")

    # Create Product 2
    product_data_2 = {
        "name": "DualSense Controller",
        "sku": "SONY-DS-002",
        "price": "69.99",
        "quantity_in_stock": 25
    }
    response = client.post("/api/v1/products/", json=product_data_2)
    assert response.status_code == 201
    p2 = response.json()
    print("[PASS] Product 2 created.")

    # 3. Test Customer Creation
    customer_data = {
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890"
    }
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 201
    c1 = response.json()
    assert c1["full_name"] == "John Doe"
    assert c1["email"] == "john.doe@example.com"
    print("[PASS] Customer created.")

    # Test Duplicate Email constraint (409 Conflict)
    response = client.post("/api/v1/customers/", json=customer_data)
    assert response.status_code == 409
    assert response.json()["success"] is False
    assert "already exists" in response.json()["message"]
    print("[PASS] Duplicate email blocked with 409 Conflict.")

    # 4. Test Transactional Order Creation (Success Flow)
    order_data = {
        "customer_id": c1["id"],
        "items": [
            {"product_id": p1["id"], "quantity": 2},
            {"product_id": p2["id"], "quantity": 5}
        ]
    }
    response = client.post("/api/v1/orders/", json=order_data)
    assert response.status_code == 201, f"Order creation failed: {response.json()}"
    o1 = response.json()
    # 2 * 499.99 + 5 * 69.99 = 999.98 + 349.95 = 1349.93
    assert Decimal(o1["total_amount"]) == Decimal("1349.93")
    assert o1["status"] == "PENDING"
    print("[PASS] Order placed successfully. Total amount calculated correctly.")

    # Verify inventory was decremented
    response = client.get(f"/api/v1/products/{p1['id']}")
    assert response.json()["quantity_in_stock"] == 8  # 10 - 2
    response = client.get(f"/api/v1/products/{p2['id']}")
    assert response.json()["quantity_in_stock"] == 20  # 25 - 5
    print("[PASS] Inventory decremented correctly after order.")

    # 5. Test Transactional Order Creation (Rollback Flow)
    # Tries to buy 9 PS5s (only 8 available in stock)
    bad_order_data = {
        "customer_id": c1["id"],
        "items": [
            {"product_id": p1["id"], "quantity": 9},  # Exceeds stock (8)
            {"product_id": p2["id"], "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders/", json=bad_order_data)
    assert response.status_code == 400
    assert "Insufficient stock" in response.json()["message"]
    print("[PASS] Order creation failed due to stock check.")

    # Verify atomic rollback: Product 2 stock should still be 20 (not decremented by 1)
    response = client.get(f"/api/v1/products/{p2['id']}")
    assert response.json()["quantity_in_stock"] == 20
    print("[PASS] Atomic rollback succeeded. Product 2 stock was not decremented.")

    # 6. Test Referential Deletion Checks (409 Conflicts)
    # Try deleting product 1 which is in order 1
    response = client.delete(f"/api/v1/products/{p1['id']}")
    assert response.status_code == 409
    assert "referenced by" in response.json()["message"]
    print("[PASS] Deleting product in active orders blocked with 409 Conflict.")

    # Try deleting customer 1 who has order 1
    response = client.delete(f"/api/v1/customers/{c1['id']}")
    assert response.status_code == 409
    assert "existing orders" in response.json()["message"]
    print("[PASS] Deleting customer with active orders blocked with 409 Conflict.")

    # 7. Test Soft Order Cancellation (DELETE /orders/{id})
    response = client.delete(f"/api/v1/orders/{o1['id']}")
    assert response.status_code == 200, f"Failed soft cancel: {response.json()}"
    o1_cancelled = response.json()
    assert o1_cancelled["status"] == "CANCELLED"
    print("[PASS] Order status updated to CANCELLED on soft deletion.")

    # Verify order record was NOT physically removed from DB
    response = client.get(f"/api/v1/orders/{o1['id']}")
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"
    print("[PASS] Order records retained in DB (no physical delete).")

    # Verify stock was restored
    response = client.get(f"/api/v1/products/{p1['id']}")
    assert response.json()["quantity_in_stock"] == 10  # 8 + 2
    response = client.get(f"/api/v1/products/{p2['id']}")
    assert response.json()["quantity_in_stock"] == 25  # 20 + 5
    print("[PASS] Product stock restored successfully after cancellation.")

    # 8. Test Dashboard Stats Response
    response = client.get("/api/v1/dashboard/stats?low_stock_threshold=15")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_products"] == 2
    assert stats["total_customers"] == 1
    assert stats["total_orders"] == 1
    assert stats["low_stock_count"] == 1  # Product 1 has 10 stock, <= 15
    assert Decimal(stats["total_inventory_value"]) == Decimal("6749.65") # 10 * 499.99 + 25 * 69.99 = 4999.9 + 1749.75 = 6749.65
    assert len(stats["low_stock_products"]) == 1
    assert stats["low_stock_products"][0]["sku"] == "SONY-PS5-001"
    print("[PASS] Dashboard statistics returned correctly, including low stock products.")

    # Cleanup at end
    cleanup_db()
    print("ALL MIGRATED POSTGRES INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_flow()
