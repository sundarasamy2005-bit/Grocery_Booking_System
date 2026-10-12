from fastapi import APIRouter, Query, BackgroundTasks
from typing import Optional
from services.report_service import ReportService

router = APIRouter(prefix="/automation", tags=["automation"])

@router.get("/daily-report-summary")
def get_daily_report_summary():
    return {
        "success": True,
        "data": ReportService.generate_daily_report_data()
    }

@router.post("/trigger-daily-email")
def trigger_daily_email(
    background_tasks: BackgroundTasks,
    recipient: Optional[str] = Query(default=None)
):
    background_tasks.add_task(ReportService.send_daily_report_email, recipient)
    return {
        "success": True,
        "message": f"Daily AI report email task queued for dispatch."
    }
