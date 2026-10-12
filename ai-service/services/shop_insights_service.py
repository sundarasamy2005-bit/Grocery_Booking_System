from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId
from utils.database import get_db
from services.analytics_service import build_shop_filter, parse_order_date

class ShopInsightsService:
    @staticmethod
    def get_shop_insights(shop_id: str) -> Dict[str, Any]:
        """
        Synthesizes complete shop performance:
        - Performance Score & classification
        - Top selling and slow-moving items
        - Anomaly detection (unusual spikes or high cancellation patterns for human review)
        - Key strategic takeaways
        """
        db = get_db()
        shop_filter = build_shop_filter(shop_id)

        # 1. Fetch shop doc
        shop_doc = db.shops.find_one(shop_filter)
        shop_name = shop_doc.get("shopName", "Grocery Shop") if shop_doc else "Grocery Shop"

        # 2. Fetch all orders for this shop
        orders = list(db.orders.find(shop_filter).sort("createdAt", -1))
        total_orders = len(orders)

        delivered = sum(1 for o in orders if o.get("orderStatus") == "delivered")
        cancelled = sum(1 for o in orders if o.get("orderStatus") in ("cancelled", "rejected"))
        valid_orders = [o for o in orders if o.get("orderStatus") not in ("cancelled", "rejected")]
        total_revenue = sum(float(o.get("totalAmount", 0.0)) for o in valid_orders)

        has_sufficient_data = total_orders >= 5
        completion_rate = round((delivered / total_orders * 100), 1) if total_orders > 0 else 100.0
        cancellation_rate = round((cancelled / total_orders * 100), 1) if total_orders > 0 else 0.0

        # Score calculation: 70% fulfillment, 30% low cancellation
        if total_orders > 0:
            raw_score = int((completion_rate * 0.7) + max(0, 30 - (cancellation_rate * 2.0)))
            perf_score = min(100, max(25, raw_score))
        else:
            perf_score = 90  # Initial baseline for newly created store

        if perf_score >= 90:
            classification = "Excellent"
        elif perf_score >= 75:
            classification = "Good"
        elif perf_score >= 50:
            classification = "Needs Attention"
        else:
            classification = "At Risk"

        # 3. Product Performance
        products = list(db.products.find(shop_filter))
        product_map = {str(p["_id"]): p for p in products}

        product_sales: Dict[str, Dict[str, Any]] = {}
        for order in valid_orders:
            for item in order.get("items", []):
                p_id = str(item.get("productId", ""))
                p_qty = int(item.get("quantity", 1))
                p_price = float(item.get("price", 0.0))
                p_name = item.get("name") or product_map.get(p_id, {}).get("name", "Product")

                if p_id not in product_sales:
                    product_sales[p_id] = {
                        "productId": p_id,
                        "name": p_name,
                        "quantitySold": 0,
                        "revenue": 0.0,
                        "currentStock": int(product_map.get(p_id, {}).get("stock", 0)),
                        "category": product_map.get(p_id, {}).get("unit", "piece")
                    }
                product_sales[p_id]["quantitySold"] += p_qty
                product_sales[p_id]["revenue"] += p_qty * p_price

        top_selling = sorted(
            product_sales.values(),
            key=lambda x: (x["quantitySold"], x["revenue"]),
            reverse=True
        )[:5]

        slow_moving = []
        for p_id, p_doc in product_map.items():
            stock = int(p_doc.get("stock", 0))
            sold = product_sales.get(p_id, {}).get("quantitySold", 0)
            if stock > 0 and sold <= 1:
                slow_moving.append({
                    "productId": p_id,
                    "name": p_doc.get("name", "Product"),
                    "quantitySold": sold,
                    "revenue": round(float(p_doc.get("price", 0.0)) * sold, 2),
                    "currentStock": stock,
                    "category": p_doc.get("unit", "piece")
                })
        slow_moving = sorted(slow_moving, key=lambda x: (x["quantitySold"], -x["currentStock"]))[:5]

        # 4. Anomaly Detection for Human Review
        anomalies: List[Dict[str, Any]] = []
        amounts = [float(o.get("totalAmount", 0.0)) for o in valid_orders]
        avg_amount = (sum(amounts) / len(amounts)) if amounts else 250.0

        for order in orders:
            o_id = str(order.get("_id", ""))
            o_num = order.get("orderNumber", f"ORD-{o_id[:6]}")
            amt = float(order.get("totalAmount", 0.0))
            status = order.get("orderStatus", "placed")
            dt_str = parse_order_date(order.get("createdAt")).strftime("%Y-%m-%d %H:%M")
            items_len = len(order.get("items", []))

            # Anomaly type 1: Unusually large order amount (> 3.5x average)
            if amt > max(1500.0, avg_amount * 3.5):
                anomalies.append({
                    "orderId": o_id,
                    "orderNumber": o_num,
                    "totalAmount": amt,
                    "itemsCount": items_len,
                    "createdAt": dt_str,
                    "anomalyType": "HIGH_AMOUNT",
                    "severity": "MEDIUM",
                    "reason": f"High value transaction (₹{amt:.2f} is >3x average order amount). Verify stock and delivery confirmation."
                })

            # Anomaly type 2: Cancellation review
            if status in ("cancelled", "rejected"):
                anomalies.append({
                    "orderId": o_id,
                    "orderNumber": o_num,
                    "totalAmount": amt,
                    "itemsCount": items_len,
                    "createdAt": dt_str,
                    "anomalyType": "ORDER_CANCELLED",
                    "severity": "HIGH" if amt > 500 else "MEDIUM",
                    "reason": f"Order #{o_num} was {status}. Review reason to prevent customer churn."
                })

        anomalies = anomalies[:6]

        # 5. Strategic AI Key Takeaways
        takeaways = []
        if cancellation_rate > 15.0:
            takeaways.append(f"⚠️ High cancellation rate ({cancellation_rate}%). Ensure stock availability and accurate inventory counts to prevent rejections.")
        elif completion_rate >= 90.0:
            takeaways.append(f"✅ Strong fulfillment track record ({completion_rate}% delivered). Fast order processing maintains your top shop ranking.")

        if slow_moving:
            takeaways.append(f"📦 Identified {len(slow_moving)} slow-moving products on your shelf. Consider small promotional discounts or bundled offers.")

        if top_selling:
            takeaways.append(f"🌟 '{top_selling[0]['name']}' is your top performer ({top_selling[0]['quantitySold']} units sold). Keep buffer stock ready for weekends.")
        else:
            takeaways.append("💡 Add more daily essentials (Milk, Rice, Fresh Veggies) to drive recurring customer grocery basket frequency.")

        return {
            "shopId": shop_id,
            "shopName": shop_name,
            "hasSufficientData": has_sufficient_data,
            "performanceScore": perf_score,
            "classification": classification,
            "totalOrders": total_orders,
            "totalRevenue": round(total_revenue, 2),
            "completionRate": completion_rate,
            "cancellationRate": cancellation_rate,
            "topSellingProducts": top_selling,
            "slowMovingProducts": slow_moving,
            "anomalies": anomalies,
            "keyTakeaways": takeaways,
            "analyzedAt": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
