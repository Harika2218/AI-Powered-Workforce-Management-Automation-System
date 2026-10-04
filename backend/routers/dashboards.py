from fastapi import APIRouter, Depends
from backend.schemas.dashboard import (
    HRDashboardResponse,
    ManagerDashboardResponse,
    EmployeeDashboardResponse,
)
from backend.services.analytics_service import AnalyticsService
from backend.utils.permissions import get_current_user, require_hr, require_manager_or_hr

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/hr", response_model=HRDashboardResponse, summary="HR Organization Dashboard")
def get_hr_dashboard(current_user: dict = Depends(require_hr)):
    """
    Organization-wide metrics calculated dynamically from MongoDB (HR only):
    Headcount, present/absent/leave counts, overtime, trends, department performance, and anomalies.
    """
    return AnalyticsService.get_hr_dashboard(current_user)


@router.get("/manager", response_model=ManagerDashboardResponse, summary="Manager Team Dashboard")
def get_manager_dashboard(current_user: dict = Depends(require_manager_or_hr)):
    """
    Team-level metrics calculated for the manager's assigned direct reports:
    Team size, attendance distribution, pending leave requests, working hours, and reviews.
    """
    return AnalyticsService.get_manager_dashboard(current_user)


@router.get("/employee", response_model=EmployeeDashboardResponse, summary="Employee Personal Dashboard")
def get_employee_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Individual metrics calculated from MongoDB for the authenticated employee:
    Today's attendance, check-in status, leave balance, assigned shift, and personal trend.
    """
    return AnalyticsService.get_employee_dashboard(current_user)
