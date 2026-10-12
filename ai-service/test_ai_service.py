from fastapi.testclient import TestClient
from app import app
from config.settings import settings

client = TestClient(app)
AUTH_HEADERS = {"X-Internal-Secret": settings.AI_SERVICE_SECRET}

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["service"] == "LocalGrocery AI Engine"
    assert "features" in data
    print("[PASS] Health test passed:", data["status"])

def test_unauthorized_access():
    # Attempting to call protected AI endpoint without secret should be 401
    response = client.get("/analytics/sales")
    assert response.status_code == 401
    print("[PASS] Unauthorized security rejection test passed (401)")

def test_analytics_sales():
    response = client.get("/analytics/sales?days=30", headers=AUTH_HEADERS)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "totalRevenue" in data
    assert "totalOrders" in data
    assert "salesTrend" in data
    assert "bestSellingProducts" in data
    assert "slowMovingProducts" in data
    print(f"[PASS] Sales analytics passed: {data['totalOrders']} orders, INR {data['totalRevenue']} revenue")

def test_predictions_demand():
    response = client.get("/predictions/demand?days=7", headers=AUTH_HEADERS)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "predictions" in data
    assert "methodology" in data
    print(f"[PASS] Demand prediction passed: analyzed {data['totalProductsAnalyzed']} products")

def test_predictions_sales():
    response = client.get("/predictions/sales?days=7", headers=AUTH_HEADERS)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "tomorrowEstimateRevenue" in data
    assert "next7DaysEstimateRevenue" in data
    assert len(data["dailyForecast"]) == 7
    print(f"[PASS] Sales forecast passed: tomorrow INR {data['tomorrowEstimateRevenue']}, 7-day INR {data['next7DaysEstimateRevenue']}")

def test_predictions_stock_risk():
    dummy_shop_id = "6701a55c285918732a3219aa"
    response = client.get(f"/predictions/stock-risk?shop_id={dummy_shop_id}", headers=AUTH_HEADERS)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "items" in data
    assert "outOfStockCount" in data
    assert "highRiskCount" in data
    print(f"[PASS] Stock risk passed: {data['totalProducts']} items evaluated")

def test_shop_insights():
    dummy_shop_id = "6701a55c285918732a3219aa"
    response = client.get(f"/insights/shop?shop_id={dummy_shop_id}", headers=AUTH_HEADERS)
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    data = res_json["data"]
    assert "performanceScore" in data
    assert "classification" in data
    assert "keyTakeaways" in data
    assert "anomalies" in data
    print(f"[PASS] Shop insights passed: Score {data['performanceScore']} ({data['classification']}), {len(data['keyTakeaways'])} takeaways")

if __name__ == "__main__":
    test_health()
    test_unauthorized_access()
    test_analytics_sales()
    test_predictions_demand()
    test_predictions_sales()
    test_predictions_stock_risk()
    test_shop_insights()
    print("\nALL 7 AI-SERVICE INTEGRATION TESTS PASSED SUCCESSFULLY!")
