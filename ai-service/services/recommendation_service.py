from utils.database import get_db

class RecommendationService:
    @staticmethod
    def get_recommendations(user_id: str = None, limit: int = 6):
        """
        Calculates personalized recommendations if user has purchase history;
        otherwise provides trending / frequently bought together products.
        """
        db = get_db()
        recommended = []
        user_categories = set()

        if user_id:
            # Check user past orders
            user_orders = list(db.orders.find({"userId": user_id}).sort("createdAt", -1).limit(10))
            if user_orders:
                for o in user_orders:
                    for item in o.get("items", []):
                        p_id = str(item.get("productId"))
                        prod = db.products.find_one({"_id": p_id})
                        if prod and "categoryId" in prod:
                            user_categories.add(str(prod["categoryId"]))

        # If user has past category preferences, query products in those categories
        if user_categories:
            cursor = db.products.find({
                "categoryId": {"$in": list(user_categories)},
                "isAvailable": True
            }).limit(limit)
            recommended = list(cursor)

        # Fallback to general popular / in-stock products
        if len(recommended) < limit:
            remaining = limit - len(recommended)
            already_ids = [r["_id"] for r in recommended]
            fallback = list(db.products.find({
                "_id": {"$nin": already_ids},
                "isAvailable": True
            }).sort("stock", -1).limit(remaining))
            recommended.extend(fallback)

        results = []
        for p in recommended:
            shop_doc = db.shops.find_one({"_id": p.get("shopId")}) if "shopId" in p else None
            shop_name = shop_doc.get("shopName", "Local Shop") if shop_doc else "Local Shop"

            results.append({
                "_id": str(p.get("_id")),
                "name": p.get("name"),
                "price": float(p.get("price", 0.0)),
                "unit": p.get("unit", "piece"),
                "imageUrl": p.get("imageUrl"),
                "stock": int(p.get("stock", 0)),
                "isAvailable": p.get("isAvailable", True),
                "shopId": str(p.get("shopId", "")),
                "shopName": shop_name,
                "reason": "Based on your frequent purchases" if user_categories else "Popular with customers in your area"
            })

        return {
            "isPersonalized": bool(user_categories),
            "recommendations": results
        }

    @staticmethod
    def get_frequently_bought_together(product_id: str, limit: int = 3):
        """
        Market basket analysis: finds items appearing in same orders as product_id.
        """
        db = get_db()
        orders_with_product = list(db.orders.find({"items.productId": product_id}))
        co_counts = {}

        for o in orders_with_product:
            for item in o.get("items", []):
                other_id = str(item.get("productId"))
                if other_id != product_id:
                    co_counts[other_id] = co_counts.get(other_id, 0) + 1

        top_co_ids = sorted(co_counts.keys(), key=lambda k: co_counts[k], reverse=True)[:limit]
        items = []
        if top_co_ids:
            found_prods = list(db.products.find({"_id": {"$in": top_co_ids}}))
            for p in found_prods:
                items.append({
                    "_id": str(p["_id"]),
                    "name": p.get("name"),
                    "price": float(p.get("price", 0.0)),
                    "unit": p.get("unit"),
                    "imageUrl": p.get("imageUrl")
                })

        return {
            "productId": product_id,
            "frequentlyBoughtTogether": items
        }
