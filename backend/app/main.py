from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health
from app.routers.api import api_router
from app.utils.exceptions import setup_exception_handlers

# Configure Swagger UI and ReDoc to sit at root level paths (/docs, /redoc)
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-ready Inventory & Order Management System API",
    version="1.0.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup consistent JSON error formatting for all validation and database integrity issues
setup_exception_handlers(app)

# Register CORS middleware
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Mount root health check (GET /health)
app.include_router(health.router)

# Mount master router under /api/v1 (e.g. /api/v1/products, /api/v1/customers, etc.)
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Root endpoint returning basic information.
    """
    return {
        "message": "Welcome to the Inventory & Order Management System API",
        "docs_url": "/docs"
    }
