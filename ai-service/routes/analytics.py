from fastapi import APIRouter, Query, Depends
from typing import Optional
from services.analytics_service import AnalyticsService
from schemas.models import SalesAnalyticsResponse
from utils.security import verify_internal_secret

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/sales", response_model=SalesAnalyticsResponse)
def get_sales_analytics(
    shop_id: Optional[str] = Query(default=None),
    days: int = Query(default=30, ge=1, le=365),
    _: bool = Depends(verify_internal_secret)
):
    """
    Shop-scoped or platform sales analytics with daily trend, best-sellers and slow-movers.
    """
    data = AnalyticsService.get_sales_analytics(shop_id=shop_id, days=days)
    return {
        "success": True,
        "data": data
    }

@router.get("/business")
def get_business_analytics(
    days: int = Query(default=30, ge=1, le=365),
    _: bool = Depends(verify_internal_secret)
):
    return {
        "success": True,
        "data": AnalyticsService.get_business_analytics(days=days)
    }

@router.get("/shop/{shop_id}")
def get_shop_analytics(
    shop_id: str,
    _: bool = Depends(verify_internal_secret)
):
    return {
        "success": True,
        "data": AnalyticsService.get_shop_analytics(shop_id=shop_id)
    }
