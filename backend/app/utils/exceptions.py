import logging
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from sqlalchemy.exc import IntegrityError, DBAPIError

logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handles standard HTTPExceptions raised inside the service or routing layer.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "message": exc.detail},
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handles request input validation errors, transforming them into a readable error message list.
    """
    errors = []
    for err in exc.errors():
        # Clean path locator
        loc = ".".join(str(x) for x in err.get("loc", []) if x != "body")
        msg = err.get("msg", "Invalid value")
        errors.append(f"Field '{loc}': {msg}" if loc else msg)
    
    error_message = "; ".join(errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "message": f"Validation Error - {error_message}"},
    )

async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """
    Catches database integrity constraints (Unique constraints, Check constraints, Foreign Keys).
    Maps them to clean user-facing conflicts.
    """
    db_err_msg = str(exc.orig).lower() if exc.orig else str(exc).lower()
    
    # Analyze common postgres/sqlite violations
    if "unique constraint" in db_err_msg or "duplicate key" in db_err_msg:
        # Check specific table columns
        if "sku" in db_err_msg:
            message = "A product with this SKU already exists."
        elif "email" in db_err_msg:
            message = "A customer with this email already exists."
        else:
            message = "A record with this unique field value already exists."
        status_code = status.HTTP_409_CONFLICT
    elif "foreign key" in db_err_msg:
        message = "Database conflict: This record cannot be deleted or updated because it is referenced by another entity."
        status_code = status.HTTP_409_CONFLICT
    elif "check constraint" in db_err_msg:
        if "check_product_price" in db_err_msg:
            message = "Validation conflict: Price must be positive."
        elif "check_product_quantity" in db_err_msg:
            message = "Validation conflict: Stock quantity cannot be negative."
        elif "check_order_item_quantity" in db_err_msg:
            message = "Validation conflict: Ordered quantity must be greater than zero."
        else:
            message = "Validation conflict: Field violates database schema constraint rules."
        status_code = status.HTTP_400_BAD_REQUEST
    else:
        message = "A database integrity error occurred."
        status_code = status.HTTP_409_CONFLICT

    logger.warning(f"IntegrityError handled: {db_err_msg}")
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message},
    )

async def db_error_handler(request: Request, exc: DBAPIError) -> JSONResponse:
    """
    Catches general database driver execution failures.
    """
    logger.exception("Database driver error occurred")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "Internal database error, operation failed."},
    )

def setup_exception_handlers(app) -> None:
    """
    Registers handlers with the FastAPI application instance.
    """
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(DBAPIError, db_error_handler)
