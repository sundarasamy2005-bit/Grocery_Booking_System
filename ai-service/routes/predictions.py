from fastapi import APIRouter, Query, Depends
from typing import Optional
from services.demand_service import DemandService
from services.stock_risk_service import StockRiskService
from services.anomaly_service import AnomalyService
from schemas.models import (
    DemandPredictionResponse,
    SalesForecastResponse,
    StockRiskResponse
)
from utils.security import verify_internal_secret

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/demand", response_model=DemandPredictionResponse)
def predict_demand(
    shop_id: Optional[str] = Query(default=None),
    product_id: Optional[str] = Query(default=None),
    days: int = Query(default=7, ge=1, le=30),
    _: bool = Depends(verify_internal_secret)
):
    """
    Shop-scoped 7-day predicted demand per product with seasonal weekend weighting.
    """
    data = DemandService.predict_demand(shop_id=shop_id, product_id=product_id, days=days)
    return {
        "success": True,
        "data": data
    }

@router.get("/sales", response_model=SalesForecastResponse)
def predict_sales(
    shop_id: Optional[str] = Query(default=None),
    days: int = Query(default=7, ge=1, le=30),
    _: bool = Depends(verify_internal_secret)
):
    """
    Shop-scoped estimated sales revenue & orders for tomorrow and next 7 days.
    """
    data = DemandService.forecast_sales(shop_id=shop_id, days=days)
    return {
        "success": True,
        "data": data
    }

@router.get("/stock-risk", response_model=StockRiskResponse)
def get_stock_risk(
    shop_id: str = Query(...),
    _: bool = Depends(verify_internal_secret)
):
    """
    Products at risk of running out of stock and recommended restock quantities.
    """
    data = StockRiskService.get_stock_risk(shop_id=shop_id)
    return {
        "success": True,
        "data": data
    }

@router.get("/forecast")
def forecast_sales_legacy(
    days: int = Query(default=7, ge=1, le=30),
    _: bool = Depends(verify_internal_secret)
):
    return {
        "success": True,
        "data": DemandService.forecast_sales(shop_id=None, days=days)
    }

@router.get("/anomalies")
def detect_anomalies(
    threshold_factor: float = Query(default=3.0, ge=1.5, le=10.0),
    _: bool = Depends(verify_internal_secret)
):
    return {
        "success": True,
        "data": AnomalyService.detect_order_anomalies(threshold_factor=threshold_factor)
    }
