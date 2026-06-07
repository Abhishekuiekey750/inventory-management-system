# AGENTS.md

## Project Overview

This repository contains a production-ready Inventory & Order Management System.

The system allows businesses to manage:

* Products
* Customers
* Orders
* Inventory Tracking

The application consists of:

* React Frontend
* FastAPI Backend
* PostgreSQL Database
* Dockerized Infrastructure

---

## Engineering Principles

Follow these principles when generating code:

1. Production-ready code only.
2. Maintain separation of concerns.
3. Avoid monolithic files.
4. Favor readability over cleverness.
5. Use meaningful names.
6. Follow REST API conventions.
7. Keep business logic outside route handlers.
8. Validate all external inputs.
9. Use environment variables for configuration.
10. Never hardcode secrets or credentials.

---

## Architecture Rules

### Backend Layers

Request Flow:

Router → Service → Repository → Database

Responsibilities:

#### Router Layer

* Handle HTTP requests and responses.
* Perform dependency injection.
* Delegate business logic to services.

#### Service Layer

* Implement business rules.
* Validate domain-specific behavior.
* Coordinate repositories.

#### Repository Layer

* Interact with the database.
* Perform CRUD operations.
* No business logic.

#### Models

Contain SQLAlchemy ORM entities.

#### Schemas

Contain Pydantic request and response models.

---

## Folder Structure

backend/

app/
├── main.py
├── config.py
├── database.py
├── models/
├── schemas/
├── repositories/
├── services/
├── routers/
├── middleware/
├── utils/

frontend/

src/
├── components/
├── pages/
├── services/
├── hooks/
├── routes/
├── layouts/
├── context/

---

## Database Rules

### Product

Fields:

* id
* name
* sku
* price
* quantity_in_stock
* created_at
* updated_at

Constraints:

* SKU must be unique.
* Quantity cannot be negative.

### Customer

Fields:

* id
* full_name
* email
* phone
* created_at

Constraints:

* Email must be unique.

### Order

Fields:

* id
* customer_id
* total_amount
* status
* created_at

### OrderItem

Fields:

* id
* order_id
* product_id
* quantity
* unit_price

---

## Business Rules

### Product Rules

* Quantity cannot be negative.
* Price must be positive.
* SKU must be unique.

### Customer Rules

* Email must be unique.
* Email format must be validated.

### Order Rules

* Customer must exist.
* Product must exist.
* Quantity must be greater than zero.
* Available inventory must be checked before order creation.
* Stock must automatically decrease after successful order creation.
* Order total must be calculated on the backend.
* Order creation must be transactional.

---

## API Standards

Use REST conventions.

### Success Responses

Use:

* 200 OK
* 201 Created
* 204 No Content

### Error Responses

Use:

* 400 Bad Request
* 404 Not Found
* 409 Conflict
* 422 Validation Error
* 500 Internal Server Error

Return consistent JSON responses.

Example:

{
"success": false,
"message": "Product not found"
}

---

## Frontend Guidelines

Requirements:

* Responsive UI.
* Reusable components.
* Centralized API service layer.
* Loading indicators.
* Error boundaries.
* Form validation.
* Toast notifications.

Avoid:

* Direct API calls inside components.
* Duplicate logic.
* Large page components.

---

## State Management

Use:

* React Context
* React Hooks

Avoid unnecessary global state.

---

## UI Requirements

Dashboard should display:

* Total Products
* Total Customers
* Total Orders
* Low Stock Products
* Total Inventory Value

Design goals:

* Clean
* Professional
* Responsive
* Accessible

---

## Docker Guidelines

Requirements:

* Lightweight images.
* Multi-stage builds when appropriate.
* Environment variables.
* Named PostgreSQL volumes.

Services:

* frontend
* backend
* postgres

Use Docker Compose for orchestration.

---

## Code Quality Standards

Python:

* Type hints required.
* Docstrings for public functions.
* Follow PEP8.

React:

* Functional components only.
* Hooks over class components.
* Reusable UI patterns.

General:

* Avoid dead code.
* Avoid duplication.
* Keep functions focused.

---

## Testing Expectations

Backend:

* Unit tests for services.
* API tests for critical endpoints.

Frontend:

* Component tests for reusable components.

---

## Documentation

Maintain:

* README.md
* API setup instructions
* Deployment instructions
* Environment variable documentation

---

## Deployment Targets

Backend:

* Render

Frontend:

* Vercel

Database:

* PostgreSQL

Ensure environment variables are configurable for all deployment targets.

---

## Agent Instructions

When generating code:

1. Build incrementally.
2. Explain architectural decisions.
3. Prefer maintainability over shortcuts.
4. Follow the folder structure exactly.
5. Do not generate placeholder implementations.
6. Do not skip validation.
7. Do not bypass business rules.
8. Keep all code production-ready.
9. Generate complete files.
10. Ensure the application can run using Docker Compose with minimal setup.
