from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HealthResponse(BaseModel):
    status: str
    service: str
    database: str
    port: int
    features: List[str]

class SalesTrendItem(BaseModel):
    date: str
    revenue: float
    orders: int

class ProductPerformanceItem(BaseModel):
    productId: str
    name: str
    quantitySold: int
    revenue: float
    currentStock: int
    category: Optional[str] = None

class SalesAnalyticsData(BaseModel):
    shopId: Optional[str] = None
    timeframeDays: int
    hasSufficientData: bool
    dataPoints: int
    totalRevenue: float
    totalOrders: int
    deliveredOrders: int
    cancelledOrders: int
    avgOrderValue: float
    completionRate: float
    cancellationRate: float
    salesTrend: List[SalesTrendItem]
    bestSellingProducts: List[ProductPerformanceItem]
    slowMovingProducts: List[ProductPerformanceItem]
    hourlyDistribution: List[Dict[str, Any]]
    explanation: str

class SalesAnalyticsResponse(BaseModel):
    success: bool
    data: SalesAnalyticsData

class DailyDemand(BaseModel):
    date: str
    dayName: str
    predictedUnits: int
    seasonalityMultiplier: float

class ProductDemandItem(BaseModel):
    productId: str
    productName: str
    unit: str
    price: float
    currentStock: int
    historicalDailyAvg: float
    confidenceLevel: str  # 'high', 'medium', 'low'
    historicalDaysAnalyzed: int
    predictedTomorrow: int
    predicted3Day: int
    predicted7Day: int
    dailyBreakdown: List[DailyDemand]
    recommendedRestock: int
    stockRisk: str
    explanation: str

class DemandPredictionData(BaseModel):
    shopId: Optional[str] = None
    hasSufficientData: bool
    totalProductsAnalyzed: int
    highRiskCount: int
    mediumRiskCount: int
    predictions: List[ProductDemandItem]
    methodology: str

class DemandPredictionResponse(BaseModel):
    success: bool
    data: DemandPredictionData

class DailyForecastItem(BaseModel):
    date: str
    dayName: str
    predictedRevenue: float
    predictedOrders: int
    confidence: str
    weekendFactor: float

class SalesForecastData(BaseModel):
    shopId: Optional[str] = None
    hasSufficientData: bool
    historicalDailyRevenueAvg: float
    tomorrowEstimateRevenue: float
    tomorrowEstimateOrders: int
    next7DaysEstimateRevenue: float
    next7DaysEstimateOrders: int
    forecastPeriod: str
    dailyForecast: List[DailyForecastItem]
    notes: str

class SalesForecastResponse(BaseModel):
    success: bool
    data: SalesForecastData

class StockRiskItem(BaseModel):
    productId: str
    productName: str
    unit: str
    price: float
    currentStock: int
    dailyDemandRate: float
    daysUntilDepletion: float
    stockRisk: str  # 'CRITICAL_OUT_OF_STOCK', 'HIGH_RISK', 'MEDIUM_RISK', 'ADEQUATE', 'OVERSTOCKED'
    recommendedRestock: int
    urgency: str  # 'IMMEDIATE', 'UPCOMING', 'STABLE'
    reason: str

class StockRiskData(BaseModel):
    shopId: str
    totalProducts: int
    outOfStockCount: int
    highRiskCount: int
    mediumRiskCount: int
    adequateCount: int
    restockRequiredTotalUnits: int
    items: List[StockRiskItem]

class StockRiskResponse(BaseModel):
    success: bool
    data: StockRiskData

class AnomalyItem(BaseModel):
    orderId: str
    orderNumber: str
    totalAmount: float
    itemsCount: int
    createdAt: str
    anomalyType: str  # 'HIGH_AMOUNT', 'REPEATED_CANCELLATION', 'VELOCITY_SPIKE'
    severity: str  # 'HIGH', 'MEDIUM'
    reason: str

class ShopInsightsData(BaseModel):
    shopId: str
    shopName: Optional[str] = None
    hasSufficientData: bool
    performanceScore: int
    classification: str
    totalOrders: int
    totalRevenue: float
    completionRate: float
    cancellationRate: float
    topSellingProducts: List[ProductPerformanceItem]
    slowMovingProducts: List[ProductPerformanceItem]
    anomalies: List[AnomalyItem]
    keyTakeaways: List[str]
    analyzedAt: str

class ShopInsightsResponse(BaseModel):
    success: bool
    data: ShopInsightsData
