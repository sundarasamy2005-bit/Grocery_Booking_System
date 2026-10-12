from utils.database import get_db

class AnomalyService:
    @staticmethod
    def detect_order_anomalies(threshold_factor: float = 3.0):
        """
        Calculates standard order amounts and flags orders that exceed
        average ticket size significantly for admin review.
        """
        db = get_db()
        orders = list(db.orders.find().sort("createdAt", -1).limit(100))
        if not orders:
            return {"anomaliesFound": 0, "anomalies": []}

        amounts = [float(o.get("totalAmount", 0.0)) for o in orders]
        avg_amount = sum(amounts) / len(amounts) if amounts else 350.0

        # Anomaly threshold: e.g. 3x normal average or orders > Rs. 4000
        anomalies = []
        for o in orders:
            amt = float(o.get("totalAmount", 0.0))
            if amt > max(4000.0, avg_amount * threshold_factor):
                user_id = str(o.get("userId", ""))
                user_doc = db.users.find_one({"_id": user_id}) if user_id else None
                user_name = user_doc.get("name", "Customer") if user_doc else "Customer"

                anomalies.append({
                    "orderId": str(o.get("_id")),
                    "orderNumber": o.get("orderNumber", "N/A"),
                    "amount": amt,
                    "customerName": user_name,
                    "platformAverage": round(avg_amount, 2),
                    "reason": f"Order amount ₹{amt:,.2f} is significantly higher than the normal ₹{avg_amount:,.2f} average.",
                    "status": o.get("orderStatus"),
                    "createdAt": str(o.get("createdAt"))
                })

        return {
            "platformAverageTicket": round(avg_amount, 2),
            "anomaliesFound": len(anomalies),
            "anomalies": anomalies
        }
