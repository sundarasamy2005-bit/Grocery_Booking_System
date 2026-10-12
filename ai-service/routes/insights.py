from fastapi import APIRouter, Query, Depends
from services.shop_insights_service import ShopInsightsService
from schemas.models import ShopInsightsResponse
from utils.security import verify_internal_secret

router = APIRouter(prefix="/insights", tags=["insights"])

@router.get("/shop", response_model=ShopInsightsResponse)
def get_shop_insights_query(
    shop_id: str = Query(..., description="Target shop ID"),
    _: bool = Depends(verify_internal_secret)
):
    """
    Synthesizes shop performance summaries, best/slow-moving products,
    unusual sales or cancellation patterns for human review.
    """
    data = ShopInsightsService.get_shop_insights(shop_id=shop_id)
    return {
        "success": True,
        "data": data
    }

@router.get("/shop/{shop_id}", response_model=ShopInsightsResponse)
def get_shop_insights_path(
    shop_id: str,
    _: bool = Depends(verify_internal_secret)
):
    data = ShopInsightsService.get_shop_insights(shop_id=shop_id)
    return {
        "success": True,
        "data": data
    }
