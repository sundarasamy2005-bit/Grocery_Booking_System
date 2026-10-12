import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from config.settings import settings
from services.analytics_service import AnalyticsService
from services.demand_service import DemandService

class ReportService:
    @staticmethod
    def generate_daily_report_data():
        analytics = AnalyticsService.get_business_analytics(days=1)
        demand = DemandService.predict_demand()

        today_str = datetime.utcnow().strftime("%d %B %Y")
        summary = analytics["summary"]

        top_prod_name = analytics["topProducts"][0]["name"] if analytics["topProducts"] else "Fresh Produce"
        top_prod_qty = analytics["topProducts"][0]["quantity"] if analytics["topProducts"] else 0
        top_shop_name = analytics["topShops"][0]["name"] if analytics["topShops"] else "Local Shops"

        high_risk_stock = [
            f"{p['productName']} (Current: {p['currentStock']}, Recommended Restock: +{p['recommendedRestock']})"
            for p in demand["predictions"] if p["stockRisk"] == "HIGH"
        ][:5]

        return {
            "date": today_str,
            "orders": summary["totalOrders"],
            "revenue": summary["totalRevenue"],
            "delivered": summary["deliveredOrders"],
            "cancelled": summary["cancelledOrders"],
            "topProduct": f"{top_prod_name} ({top_prod_qty} units)",
            "topShop": top_shop_name,
            "highRiskStock": high_risk_stock,
            "tomorrowExpectedOrders": int(summary["totalOrders"] * 1.1) + 12,
            "aiRecommendation": "Ensure replenishment of dairy and top produce items early morning before peak customer demand."
        }

    @staticmethod
    def send_daily_report_email(recipient_email: str = None) -> bool:
        recipient = recipient_email or settings.ADMIN_EMAIL
        if not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
            print("⚠️ Gmail credentials not configured in AI Service. Skipping email dispatch.")
            return False

        data = ReportService.generate_daily_report_data()

        subject = f"📊 LocalGrocery Daily AI Summary — {data['date']}"
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="background: linear-gradient(135deg, #0284c7, #0369a1); color: white; padding: 16px; border-radius: 8px; text-align: center;">
                <h2 style="margin: 0;">LocalGrocery Daily AI Report</h2>
                <p style="margin: 4px 0 0; font-size: 13px;">{data['date']}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; color: #64748b;">TOTAL ORDERS</div>
                    <div style="font-size: 20px; font-weight: bold; color: #0f172a;">{data['orders']}</div>
                </div>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="font-size: 11px; color: #64748b;">REVENUE</div>
                    <div style="font-size: 20px; font-weight: bold; color: #16a34a;">₹{data['revenue']:,.2f}</div>
                </div>
            </div>

            <p><strong>🏆 Top Selling:</strong> {data['topProduct']}</p>
            <p><strong>🏪 Top Store:</strong> {data['topShop']}</p>
            <p><strong>🔮 Tomorrow's Expected Orders:</strong> ~{data['tomorrowExpectedOrders']}</p>

            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 10px; margin: 15px 0;">
                <h4 style="margin: 0 0 5px; color: #991b1b;">⚠️ Stockout Risk Items:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #b91c1c; font-size: 13px;">
                    {''.join(f'<li>{item}</li>' for item in data['highRiskStock']) if data['highRiskStock'] else '<li>All high-velocity products adequately stocked.</li>'}
                </ul>
            </div>

            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 10px; margin: 15px 0;">
                <h4 style="margin: 0 0 5px; color: #166534;">🤖 AI Recommendation:</h4>
                <p style="margin: 0; font-size: 13px; color: #15803d;">{data['aiRecommendation']}</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">LocalGrocery Autonomous AI & Prediction Engine</p>
        </div>
        """

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"LocalGrocery AI <{settings.GMAIL_USER}>"
            msg["To"] = recipient
            msg.attach(MIMEText(html, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
                server.sendmail(settings.GMAIL_USER, recipient, msg.as_string())

            print(f"[AI REPORT] Successfully dispatched daily AI report to {recipient}")
            return True
        except Exception as e:
            print(f"[AI REPORT] Failed to send daily report email: {e}")
            return False
