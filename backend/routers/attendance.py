from fastapi import APIRouter, Depends, Query, status
from backend.schemas.attendance import (
    CheckInRequest,
    CheckOutRequest,
    AttendanceRecordResponse,
    AttendanceAnomaly,
)
from backend.services.attendance_service import AttendanceService
from backend.utils.permissions import get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance Management"])


@router.post("/check-in", summary="Record Employee Check-In")
def check_in(payload: CheckInRequest, current_user: dict = Depends(get_current_user)):
    """
    Clock in for today. Prevents duplicate check-ins, evaluates shift start time and calculates late arrival.
    """
    return AttendanceService.check_in(current_user, payload)


@router.post("/check-out", summary="Record Employee Check-Out")
def check_out(payload: CheckOutRequest, current_user: dict = Depends(get_current_user)):
    """
    Clock out for today. Validates check-in exists and calculates actual working hours and overtime.
    """
    return AttendanceService.check_out(current_user, payload)


@router.get("/my", summary="My Attendance Records")
def get_my_attendance(
    date_from: str | None = Query(None, description="YYYY-MM-DD"),
    date_to: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve personal attendance history for the authenticated employee.
    """
    emp_id = current_user.get("employee_id")
    return AttendanceService.get_attendance(
        current_user=current_user,
        employee_id=emp_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


@router.get("/anomalies", response_model=list[AttendanceAnomaly], summary="Attendance Anomaly Detection")
def get_attendance_anomalies(
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Rule-based anomaly detection: flags excessive overtime, chronic late arrivals, and abnormally short hours.
    """
    return AttendanceService.detect_anomalies(current_user, limit=limit)


@router.get("/{employee_id}", summary="Get Employee Attendance")
def get_employee_attendance(
    employee_id: str,
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve attendance records for a specific employee (subject to RBAC: HR, Manager of team, or Self).
    """
    return AttendanceService.get_attendance(
        current_user=current_user,
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


@router.get("", summary="List Organization Attendance Records")
def list_attendance(
    employee_id: str | None = Query(None),
    department: str | None = Query(None),
    status: str | None = Query(None, alias="status"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    List attendance records with filtering by department, status, and date range.
    """
    return AttendanceService.get_attendance(
        current_user=current_user,
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
        department=department,
        status_filter=status,
        page=page,
        page_size=page_size,
    )
