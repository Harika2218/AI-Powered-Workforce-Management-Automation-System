from typing import Any
from pydantic import BaseModel


class AttendanceAnalyticsResponse(BaseModel):
    total_records: int
    attendance_rate: float
    present_count: int
    absent_count: int
    late_count: int
    half_day_count: int
    on_leave_count: int
    avg_working_hours: float
    total_overtime_hours: float
    department_attendance: list[dict[str, Any]]
    daily_trends: list[dict[str, Any]]
    daily_trend: list[dict[str, Any]] | None = None


class LeaveAnalyticsResponse(BaseModel):
    total_requests: int
    approved_count: int
    pending_count: int
    rejected_count: int
    cancelled_count: int
    leave_type_distribution: list[dict[str, Any]]
    type_breakdown: list[dict[str, Any]] | None = None
    monthly_leave_trends: list[dict[str, Any]]
    department_leave_breakdown: list[dict[str, Any]]
    department_leave_days: list[dict[str, Any]] | None = None


class WorkforceAnalyticsResponse(BaseModel):
    total_headcount: int
    active_employees: int
    inactive_employees: int
    on_leave_employees: int
    department_distribution: list[dict[str, Any]]
    department_breakdown: list[dict[str, Any]] | None = None
    employment_type_distribution: list[dict[str, Any]]
    tenure_distribution: list[dict[str, Any]]
    top_skills: list[dict[str, Any]]


class OvertimeAnalyticsResponse(BaseModel):
    total_overtime_hours: float
    employees_with_overtime: int
    department_overtime: list[dict[str, Any]]
    top_overtime_employees: list[dict[str, Any]]
    daily_overtime_trend: list[dict[str, Any]]
