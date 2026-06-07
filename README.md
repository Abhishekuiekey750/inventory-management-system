# Inventory & Order Management System

A production-ready Inventory and Order Management System built with a **FastAPI** backend, **React + Vite** frontend, and **PostgreSQL** database. Engineered following clean architectural separation of concerns, repository design patterns, database transaction safety controls, and multi-stage container deployments.

---

## 🚀 Deployment Status

| Service | Platform | URL / Link |
| :--- | :--- | :--- |
| **Frontend UI** | Vercel | [Live App Link](https://inventory-management-system-nu-khaki.vercel.app/) |
| **Backend REST API** | Render | [API Service URL](https://inventory-management-backend-50ah.onrender.com) |
| **API Swagger UI** | Render | [Swagger Docs](/docs) / [Swagger URL](https://inventory-management-backend-50ah.onrender.com/docs) |
| **API ReDoc** | Render | [ReDoc Docs](/redoc) / [ReDoc URL](https://inventory-management-backend-50ah.onrender.com/redoc) |
| **Docker Hub Backend** | Docker Hub | [inventory-backend Image](https://hub.docker.com/r/abhishekuiekey750/inventory-backend) |
| **Docker Hub Frontend** | Docker Hub | [inventory-frontend Image](https://hub.docker.com/r/abhishekuiekey750/inventory-frontend) |

---

## 🛠️ Tech Stack

* **Backend Framework:** FastAPI (Python 3.10+)
* **Database & ORM:** PostgreSQL, SQLAlchemy Core/ORM, Alembic Migrations
* **Frontend App:** React 18, Vite, React Router DOM, Axios, Tailwind & Vanilla CSS, React-Toastify
* **Containerization:** Docker, Docker Compose, Multi-stage Nginx builds
* **Deployments:** Render (Backend + Postgres Blueprint), Vercel (Frontend Single Page App config)

---

## 🎯 Assessment Requirements Coverage

This codebase fulfills all design guidelines and engineering principles specified in the evaluation matrix:

* **UUID Primary Keys:** All tables use UUIDv4 identifier primary keys rather than auto-incrementing integers, securing resources from scanning.
* **Database Constraints:** High-precision `Numeric(10, 2)` decimal data types are used for currency fields. Quantities are validated in PostgreSQL via `CheckConstraint('quantity_in_stock >= 0')` and prices via `CheckConstraint('price > 0')`.
* **Atomic Transaction Safety:** Order creation coordinates product updates and inventory verification inside a single transaction. If any product exceeds available stock, the database transaction is fully rolled back, and the client receives a detailed `400 Bad Request` explaining which SKU failed.
* **Soft Order Cancellation:** Orders are never deleted from the database. A `DELETE /api/v1/orders/{id}` endpoint triggers a soft cancellation: updating the status to `CANCELLED` and restoring the order item stock allocations back to active inventory.
* **Referential Integrity Blocks:** Products and Customers are protected from hard deletion. Trying to delete a customer or product that has orders results in a `409 Conflict` database exception.
* **Health Check Suite:** Zero-dependency Python health check endpoints verify backend and Postgres availability (`pg_isready`) before launching frontend assets in Docker Compose.

---

## 📋 Business Rules

### Product Rules
* Quantity in stock cannot be negative.
* Price must be positive.
* SKU must be unique across all products.

### Customer Rules
* Email must be unique.
* Email format must be validated before database persistence.

### Order & Inventory Rules
* Customer and Product must exist in the database.
* Ordered quantities must be greater than zero.
* Available inventory must be checked before order confirmation.
* Stock automatically decreases after successful order placement.
* Cancelled orders automatically return product stock quantities to the inventory.
* Order totals are calculated securely on the backend.

---

## 📐 Architecture Overview

```mermaid
graph TD
    subgraph Client ["Frontend (React + Vite)"]
        UI["UI Pages (Dashboard, Products, etc.)"]
        Services["API Service Modules (Axios)"]
    end

    subgraph Server ["Backend (FastAPI)"]
        Router["Router Layer (API Endpoints)"]
        Service["Service Layer (Business Rules)"]
        Repo["Repository Layer (CRUD / SQL)"]
        DB_Session["Database Session Helper"]
    end

    subgraph Storage ["Database (PostgreSQL)"]
        DB[(PostgreSQL Database)]
        Migrate[Alembic Migrations]
    end

    UI -->|Uses| Services
    Services -->|HTTP Requests| Router
    Router -->|Depends on DB| DB_Session
    Router -->|Calls| Service
    Service -->|Coordinates| Repo
    Repo -->|Executes Queries| DB
    Migrate -->|Creates Tables| DB
```

### Folder Structures

```text
├── backend/
│   ├── app/
│   │   ├── config.py         # App configuration & environments
│   │   ├── database.py       # DB connection session maker
│   │   ├── main.py           # FastAPI app configurations
│   │   ├── models/           # SQLAlchemy ORM declarations
│   │   ├── schemas/          # Pydantic data schemas
│   │   ├── repositories/     # Database queries isolation
│   │   ├── services/         # Transaction & inventory business rules
│   │   ├── routers/          # Endpoint path mappings
│   │   └── utils/            # Consistent JSON error handlers
│   └── alembic/              # Database migration records
└── frontend/
    ├── src/
    │   ├── api/              # Axios unified request modules
    │   ├── components/       # Skeletons, Modals, Badges, DataTables
    │   ├── context/          # Toast Alert configurations
    │   ├── layouts/          # Responsive navigation sidebar
    │   ├── pages/            # Dashboard, Products, Customers, Orders
    │   └── routes/           # React Router mappings
```

---

## 🖼️ Application Screenshots

### 1. Dashboard Overview
Dashboard displaying real-time business metrics (Total Products, Customers, Orders, Low Stock Products, and Total Inventory Value).
![Dashboard](screenshots/dashboard.png)

### 2. Product Inventory Management
Product inventory table listing items, SKUs, pricing, stock levels, and actions to create, edit, or delete products.
![Products](screenshots/products.png)

### 3. Customer Directory
Customer records view displaying full names, emails, phones, and registrations.
![Customers](screenshots/customers.png)

### 4. Order Placements & Status Tracking
Order placement dashboard and shopping cart checkout panel. Enforces real-time stock validations, transactional rollbacks, and includes options to view details or perform soft cancellations.
![Orders](screenshots/orders.png)

---

## 🗄️ Database Design & Entity Relationships

The schema consists of 4 main tables: **Customer**, **Product**, **Order**, and **OrderItem** using UUID primary keys, Decimal price formats, and timestamps.

For a detailed constraint list and visual schema flowchart, refer to the [ER Diagram Document](er_diagram.md).

---

## ⚡ Getting Started

### Local Setup (Without Docker)

#### 1. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   # Update variables including DATABASE_URL pointing to a running PostgreSQL
   ```
3. Initialize python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
4. Install pip requirements:
   ```bash
   pip install -r requirements.txt
   ```
5. Apply Alembic database migrations:
   ```bash
   alembic upgrade head
   ```
6. Run the FastAPI dev server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### 2. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Create and configure your `.env` file:
   ```bash
   cp .env.example .env
   # Update VITE_API_BASE_URL to point to http://localhost:8000/api/v1
   ```
3. Install npm packages:
   ```bash
   npm install
   ```
4. Run Vite development server:
   ```bash
   npm run dev
   ```

---

## 🐳 Docker Compose Setup

Run the entire PostgreSQL, FastAPI, and Nginx-compiled Frontend stack using a single command.

1. Ensure Docker and Docker Compose are running.
2. In the project root, copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Spin up all containers in build-detached mode:
   ```bash
   docker compose up --build -d
   ```
4. This starts three services:
   * **inventory_db (PostgreSQL 16):** Exposes port `5432` with volume mapping.
   * **inventory_backend (FastAPI):** Exposes port `8000` with self-urllib health check.
   * **inventory_frontend (Nginx):** Exposes port `5173` mapping compiled static assets.
5. Inspect container health:
   ```bash
   docker compose ps
   ```

---

## 🌐 Deployment Instructions

### Backend (Render Deployment)
This repository is configured for Render via the [render.yaml](render.yaml) blueprint.
1. Connect this repository to your Render Account.
2. Render will automatically read `render.yaml` and provision a PostgreSQL database alongside your FastAPI web service.
3. The build script installs requirements, and the start command is configured to run `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT` which guarantees migrations apply before boot.

### Frontend (Vercel Deployment)
The React frontend includes [vercel.json](frontend/vercel.json) to handle SPA URL rewrites.
1. Connect the repository to your Vercel Account.
2. Select the `frontend` folder as the root directory.
3. Add the environment variable `VITE_API_BASE_URL` pointing to your deployed Render API (e.g. `https://your-api.onrender.com/api/v1`).
4. Vercel compiles the build and hosts your frontend assets, serving pages seamlessly.

---

## 📡 API Documentation Catalog

Open `/docs` (or `/redoc`) on your backend URL to view the interactive OpenAPI catalog.

### Critical Endpoints Summary:
* **POST `/api/v1/orders/`**
  * Places a multi-item order. Enforces atomic transaction safety. If product quantities requested exceed available stock, the entire transaction is rolled back and returns `400 Bad Request`.
* **DELETE `/api/v1/orders/{id}`**
  * Soft cancels order. Sets status to `CANCELLED` and restores stock levels to products, keeping the order record for bookkeeping history.
* **DELETE `/api/v1/products/{id}` & DELETE `/api/v1/customers/{id}`**
  * Prevents deletion (returning `409 Conflict`) if the entities are referenced in active orders.
