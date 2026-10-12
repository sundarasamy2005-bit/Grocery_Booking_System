import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId
from utils.database import get_db

def build_shop_filter(shop_id: str):
    clauses = [{"shopId": str(shop_id)}]
    try:
        clauses.append({"shopId": ObjectId(shop_id)})
    except Exception:
        pass
    return {"$or": clauses}

class StockRiskService:
    @staticmethod
    def get_stock_risk(shop_id: str) -> Dict[str, Any]:
        """
        Analyzes stock levels across all catalog products for a specific shop,
        identifying products at immediate or upcoming risk of stockout with recommended restock amounts.
        """
        db = get_db()
        shop_filter = build_shop_filter(shop_id)
        products = list(db.products.find(shop_filter))

        # Recent 14-day sales velocity
        analysis_window = 14
        cutoff_date = datetime.utcnow() - timedelta(days=analysis_window)
        order_query = {
            "createdAt": {"$gte": cutoff_date},
            "orderStatus": {"$nin": ["cancelled", "rejected"]},
            "$or": shop_filter["$or"]
        }
        past_orders = list(db.orders.find(order_query))

        product_sales_count: Dict[str, int] = {}
        for order in past_orders:
            for item in order.get("items", []):
                p_id = str(item.get("productId", ""))
                product_sales_count[p_id] = product_sales_count.get(p_id, 0) + int(item.get("quantity", 1))

        risk_items: List[Dict[str, Any]] = []
        out_of_stock_count = 0
        high_risk_count = 0
        med_risk_count = 0
        adequate_count = 0
        total_restock_units = 0

        for prod in products:
            p_id = str(prod["_id"])
            p_name = prod.get("name", "Product")
            current_stock = int(prod.get("stock", 0))
            price = float(prod.get("price", 0.0))
            unit = prod.get("unit", "piece")

            units_sold = product_sales_count.get(p_id, 0)
            daily_demand = max(0.4, units_sold / float(analysis_window))

            if current_stock == 0:
                days_left = 0.0
                risk_status = "CRITICAL_OUT_OF_STOCK"
                urgency = "IMMEDIATE"
                reason = "Out of stock! Customers cannot purchase this item until replenished."
                out_of_stock_count += 1
            elif current_stock / daily_demand <= 1.5:
                days_left = round(current_stock / daily_demand, 1)
                risk_status = "HIGH_RISK"
                urgency = "IMMEDIATE"
                reason = f"Critical inventory: {current_stock} units left. Estimated to stock out in {days_left} day(s)."
                high_risk_count += 1
            elif current_stock / daily_demand <= 3.5:
                days_left = round(current_stock / daily_demand, 1)
                risk_status = "MEDIUM_RISK"
                urgency = "UPCOMING"
                reason = f"Low stock: {current_stock} units left. Stock expected to deplete within {days_left} days."
                med_risk_count += 1
            elif current_stock / daily_demand >= 30:
                days_left = round(current_stock / daily_demand, 1)
                risk_status = "OVERSTOCKED"
                urgency = "STABLE"
                reason = f"High inventory: {current_stock} units on shelf (>30 days coverage)."
                adequate_count += 1
            else:
                days_left = round(current_stock / daily_demand, 1)
                risk_status = "ADEQUATE"
                urgency = "STABLE"
                reason = f"Healthy inventory: {current_stock} units available (~{days_left} days coverage)."
                adequate_count += 1

            # Target 7-day buffer with 20% safety margin
            target_buffer = int(np.ceil(daily_demand * 7 * 1.2))
            restock_qty = max(0, target_buffer - current_stock)
            total_restock_units += restock_qty

            risk_items.append({
                "productId": p_id,
                "productName": p_name,
                "unit": unit,
                "price": price,
                "currentStock": current_stock,
                "dailyDemandRate": round(daily_demand, 2),
                "daysUntilDepletion": days_left,
                "stockRisk": risk_status,
                "recommendedRestock": restock_qty,
                "urgency": urgency,
                "reason": reason
            })

        # Sort: Immediate/Critical first, then highest restock needed
        urgency_order = {"IMMEDIATE": 0, "UPCOMING": 1, "STABLE": 2}
        risk_items.sort(key=lambda x: (urgency_order.get(x["urgency"], 2), -x["recommendedRestock"]))

        return {
            "shopId": shop_id,
            "totalProducts": len(products),
            "outOfStockCount": out_of_stock_count,
            "highRiskCount": high_risk_count,
            "mediumRiskCount": med_risk_count,
            "adequateCount": adequate_count,
            "restockRequiredTotalUnits": total_restock_units,
            "items": risk_items
        }
