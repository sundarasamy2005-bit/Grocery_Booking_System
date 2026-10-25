import asyncio
import threading
import time
import schedule
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings
from utils.database import check_db_connection
from routes.analytics import router as analytics_router
from routes.predictions import router as predictions_router
from routes.recommendations import router as recommendations_router
from routes.automation import router as automation_router
from routes.insights import router as insights_router
from schemas.models import HealthResponse
from services.report_service import ReportService

# Background Scheduler Thread
def run_scheduler():
    def safe_email_job():
        try:
            ReportService.send_daily_report_email()
        except Exception as e:
            print(f"[AI REPORT] Exception during daily report job: {e}")

    # Schedule automated daily report at 23:00 (11 PM)
    schedule.every().day.at("23:00").do(safe_email_job)
    while True:
        try:
            schedule.run_pending()
        except Exception as sched_err:
            print(f"[AI SCHEDULER] Exception in scheduler loop: {sched_err}")
        time.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: test MongoDB connection & start scheduler
    db_ok = check_db_connection()
    if db_ok:
        print("[AI SERVICE] Successfully connected to MongoDB Atlas.")
    else:
        print("[AI SERVICE] MongoDB Atlas ping pending or offline.")

    # Start background scheduler thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    print("[AI SERVICE] Daily AI report scheduler started (runs daily at 11:00 PM).")

    yield

app = FastAPI(
    title="LocalGrocery AI & Analytics Service",
    description="Python microservice for Business Analytics, Demand Prediction, Stock Forecasting, Recommendations, and Automation.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Node.js / React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(analytics_router)
app.include_router(predictions_router)
app.include_router(recommendations_router)
app.include_router(automation_router)
app.include_router(insights_router)

@app.get("/health", response_model=HealthResponse)
def health_check():
    db_connected = check_db_connection()
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": "LocalGrocery AI Engine",
        "database": "connected" if db_connected else "disconnected",
        "port": settings.PORT,
        "features": [
            "Admin Business Analytics",
            "Shop Owner AI Insights",
            "7-Day Demand Prediction & Seasonality",
            "Sales Forecasting (Tomorrow & 7-Day)",
            "Intelligent Stockout Risk Alerts",
            "Recommended Restock Quantities",
            "Shop Performance Scoring",
            "Order Anomaly & Cancellation Reviews",
            "Personalized Recommendations",
            "Automated Scheduled Email Dispatch"
        ]
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=settings.PORT, reload=True)
