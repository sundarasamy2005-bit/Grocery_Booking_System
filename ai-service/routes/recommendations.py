from fastapi import APIRouter, Query
from typing import Optional
from services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

@router.get("/")
def get_recommendations(
    user_id: Optional[str] = Query(default=None),
    limit: int = Query(default=6, ge=1, le=20)
):
    return {
        "success": True,
        "data": RecommendationService.get_recommendations(user_id=user_id, limit=limit)
    }

@router.get("/frequently-bought-together/{product_id}")
def get_frequently_bought_together(product_id: str, limit: int = Query(default=3, ge=1, le=10)):
    return {
        "success": True,
        "data": RecommendationService.get_frequently_bought_together(product_id=product_id, limit=limit)
    }
