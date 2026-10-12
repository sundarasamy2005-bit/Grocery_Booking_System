import pandas as pd
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from bson import ObjectId
from utils.database import get_db

def build_shop_filter(shop_id: Optional[str]):
    if not shop_id:
        return {}
    clauses = [{"shopId": str(shop_id)}]
    try:
        clauses.append({"shopId": ObjectId(shop_id)})
    except Exception:
        pass
    return {"$or": clauses}

def parse_order_date(created_at) -> datetime:
    if isinstance(created_at, datetime):
        return created_at
    if isinstance(created_at, str):
        try:
            return datetime.fromisoformat(created_at.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass
    return datetime.utcnow()

class AnalyticsService:
    @staticmethod
    def get_sales_analytics(shop_id: Optional[str] = None, days: int = 30) -> Dict[str, Any]:
        """
        Analyzes historical sales, revenues, order volumes, best & slow-moving products
        for a specific shop (or platform-wide) over the specified time window.
        """
        db = get_db()
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        query: Dict[str, Any] = {
            "createdAt": {"$gte": cutoff_date}
        }
        shop_filter = build_shop_filter(shop_id)
        if shop_filter:
            query.update(shop_filter)

        orders_list = list(db.orders.find(query).sort("createdAt", 1))

        # Also get all products of this shop to track inventory & slow-moving items
        prod_query: Dict[str, Any] = {}
        if shop_filter:
            prod_query.update(shop_filter)
        shop_products = list(db.products.find(prod_query))
        product_map = {str(p["_id"]): p for p in shop_products}

        total_orders = len(orders_list)
        total_revenue = 0.0
        delivered_orders = 0
        cancelled_orders = 0
        sales_by_date: Dict[str, Dict[str, Any]] = {}
        hourly_counts: Dict[str, int] = {str(h).zfill(2): 0 for h in range(24)}
        product_sales: Dict[str, Dict[str, Any]] = {}

        for order in orders_list:
            status = order.get("orderStatus", "placed")
            amount = float(order.get("totalAmount", 0.0))
            is_valid_order = status not in ("cancelled", "rejected")

            if is_valid_order:
                total_revenue += amount

            if status == "delivered":
                delivered_orders += 1
            elif status in ("cancelled", "rejected"):
                cancelled_orders += 1

            dt = parse_order_date(order.get("createdAt"))
            d_str = dt.strftime("%Y-%m-%d")
            h_str = dt.strftime("%H")

            if d_str not in sales_by_date:
                sales_by_date[d_str] = {"revenue": 0.0, "orders": 0}
            if is_valid_order:
                sales_by_date[d_str]["revenue"] += amount
            sales_by_date[d_str]["orders"] += 1

            hourly_counts[h_str] = hourly_counts.get(h_str, 0) + 1

            # Aggregate items sold
            for item in order.get("items", []):
                p_id = str(item.get("productId", "unknown"))
                p_name = item.get("name") or product_map.get(p_id, {}).get("name", "Grocery Item")
                p_qty = int(item.get("quantity", 1))
                p_price = float(item.get("price", 0.0))

                if p_id not in product_sales:
                    product_sales[p_id] = {
                        "productId": p_id,
                        "name": p_name,
                        "quantitySold": 0,
                        "revenue": 0.0,
                        "currentStock": int(product_map.get(p_id, {}).get("stock", 0)),
                        "category": product_map.get(p_id, {}).get("categoryId", "General")
                    }
                if is_valid_order:
                    product_sales[p_id]["quantitySold"] += p_qty
                    product_sales[p_id]["revenue"] += p_qty * p_price

        # Sort best selling products
        best_selling = sorted(
            product_sales.values(),
            key=lambda x: (x["quantitySold"], x["revenue"]),
            reverse=True
        )[:10]

        # Identify slow moving products (in catalog, stock > 0, but sold 0 or <= 1 in the period)
        slow_moving = []
        for p_id, p_data in product_map.items():
            stock = int(p_data.get("stock", 0))
            sold_info = product_sales.get(p_id)
            qty_sold = sold_info["quantitySold"] if sold_info else 0
            if stock > 0 and qty_sold <= 1:
                slow_moving.append({
                    "productId": p_id,
                    "name": p_data.get("name", "Product"),
                    "quantitySold": qty_sold,
                    "revenue": round(float(p_data.get("price", 0.0)) * qty_sold, 2),
                    "currentStock": stock,
                    "category": p_data.get("unit", "item")
                })
        slow_moving.sort(key=lambda x: (x["quantitySold"], -x["currentStock"]))
        slow_moving = slow_moving[:10]

        avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0
        completion_rate = round((delivered_orders / total_orders * 100), 1) if total_orders > 0 else 100.0
        cancellation_rate = round((cancelled_orders / total_orders * 100), 1) if total_orders > 0 else 0.0

        # Construct sales trend sorted by date
        sales_trend = [
            {
                "date": d,
                "revenue": round(data["revenue"], 2),
                "orders": data["orders"]
            }
            for d, data in sorted(sales_by_date.items())
        ]

        has_sufficient_data = total_orders >= 5
        explanation = (
            f"Analysis across {total_orders} orders totaling ₹{round(total_revenue, 2)} over the past {days} days."
            if has_sufficient_data
            else f"Limited historical orders recorded ({total_orders} total). Baseline metrics will automatically improve as orders occur."
        )

        return {
            "shopId": shop_id,
            "timeframeDays": days,
            "hasSufficientData": has_sufficient_data,
            "dataPoints": total_orders,
            "totalRevenue": round(total_revenue, 2),
            "totalOrders": total_orders,
            "deliveredOrders": delivered_orders,
            "cancelledOrders": cancelled_orders,
            "avgOrderValue": avg_order_value,
            "completionRate": completion_rate,
            "cancellationRate": cancellation_rate,
            "salesTrend": sales_trend,
            "bestSellingProducts": best_selling,
            "slowMovingProducts": slow_moving,
            "hourlyDistribution": [
                {"hour": f"{h}:00", "orders": count}
                for h, count in hourly_counts.items()
                if count > 0
            ],
            "explanation": explanation
        }

    @staticmethod
    def get_business_analytics(days: int = 30):
        # Platform-wide legacy helper for admin
        return AnalyticsService.get_sales_analytics(shop_id=None, days=days)

    @staticmethod
    def get_shop_analytics(shop_id: str):
        # Legacy shop analytics wrapper
        data = AnalyticsService.get_sales_analytics(shop_id=shop_id, days=30)
        perf_score = int(min(100, max(20, (data["completionRate"] * 0.7) + (30 - data["cancellationRate"] * 2))))
        if perf_score >= 90:
            classification = "Excellent"
        elif perf_score >= 75:
            classification = "Good"
        elif perf_score >= 50:
            classification = "Needs Improvement"
        else:
            classification = "Poor"

        return {
            "shopId": shop_id,
            "totalOrders": data["totalOrders"],
            "totalRevenue": data["totalRevenue"],
            "completionRate": data["completionRate"],
            "cancellationRate": data["cancellationRate"],
            "performanceScore": perf_score,
            "classification": classification,
            "avgPreparationTimeMinutes": 20,
        }
