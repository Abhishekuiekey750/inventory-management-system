from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard import dashboard_service

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
def read_dashboard_stats(
    low_stock_threshold: int = Query(10, ge=0, description="Quantity threshold defining low stock"),
    db: Session = Depends(get_db)
):
    """
    Retrieve admin dashboard metrics including total counters, total asset values, 
    and a complete list of low-stock products.
    """
    return dashboard_service.get_stats(db, low_stock_threshold=low_stock_threshold)
