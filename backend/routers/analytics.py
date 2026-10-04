from fastapi import APIRouter, Depends, Query
from backend.schemas.analytics import (
    AttendanceAnalyticsResponse,
    LeaveAnalyticsResponse,
    WorkforceAnalyticsResponse,
    OvertimeAnalyticsResponse,
)
from backend.schemas.performance import PerformanceAnalytics
from backend.services.analytics_service import AnalyticsService
from backend.services.performance_service import PerformanceService
from backend.utils.permissions import require_hr

router = APIRouter(prefix="/analytics", tags=["Workforce Analytics"])


@router.get("/attendance", response_model=AttendanceAnalyticsResponse, summary="Attendance Analytics")
def get_attendance_analytics(
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
    department: str | None = Query(None),
    current_user: dict = Depends(require_hr),
):
    """
    Real-time attendance analytics calculated from MongoDB records.
    """
    return AnalyticsService.get_attendance_analytics(
        current_user=current_user,
        date_from=date_from,
        date_to=date_to,
        department=department,
    )


@router.get("/leave", response_model=LeaveAnalyticsResponse, summary="Leave Analytics")
def get_leave_analytics(current_user: dict = Depends(require_hr)):
    """
    Leave application distribution, monthly trends, and department breakdowns.
    """
    return AnalyticsService.get_leave_analytics(current_user)


@router.get("/workforce", response_model=WorkforceAnalyticsResponse, summary="Workforce Demographics & Skills")
def get_workforce_analytics(current_user: dict = Depends(require_hr)):
    """
    Workforce headcount demographics, employment types, tenure, and top skills.
    """
    return AnalyticsService.get_workforce_analytics(current_user)


@router.get("/overtime", response_model=OvertimeAnalyticsResponse, summary="Overtime Analytics")
def get_overtime_analytics(current_user: dict = Depends(require_hr)):
    """
    Overtime volume, department distributions, and top overtime contributors.
    """
    return AnalyticsService.get_overtime_analytics(current_user)


@router.get("/performance", response_model=PerformanceAnalytics, summary="Performance Analytics")
def get_performance_analytics(current_user: dict = Depends(require_hr)):
    """
    Performance score distributions and department performance averages.
    """
    return PerformanceService.get_analytics()
