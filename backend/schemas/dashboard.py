from typing import Any
from pydantic import BaseModel
from backend.schemas.attendance import AttendanceAnomaly, AttendanceRecordResponse
from backend.schemas.leave import LeaveResponse
from backend.schemas.shift import ShiftResponse


class AttendanceDistribution(BaseModel):
    present: int = 0
    absent: int = 0
    late: int = 0
    on_leave: int = 0


class HRDashboardResponse(BaseModel):
    total_employees: int
    present_today: int
    absent_today: int
    on_leave_today: int
    overtime_hours_today: float
    total_departments: int
    attendance_distribution: AttendanceDistribution
    attendance_trend: list[dict[str, Any]]
    employees_by_department: list[dict[str, Any]]
    employment_status_distribution: list[dict[str, Any]]
    leave_distribution: list[dict[str, Any]]
    overtime_distribution: list[dict[str, Any]]
    department_performance: list[dict[str, Any]]
    pending_approvals: dict[str, int]  # {"leave": int, "timesheets": int}
    recent_anomalies: list[AttendanceAnomaly]


class ManagerDashboardResponse(BaseModel):
    team_size: int
    present_today: int
    absent_today: int
    on_leave_today: int
    pending_leave_count: int
    overtime_hours_today: float
    team_attendance_distribution: AttendanceDistribution
    team_leave_distribution: list[dict[str, Any]]
    team_avg_working_hours: float
    team_avg_performance: float
    pending_timesheets_count: int


class EmployeeDashboardResponse(BaseModel):
    employee_id: str
    employee_name: str
    today_status: str
    is_checked_in: bool
    is_checked_out: bool
    check_in_time: str | None = None
    check_out_time: str | None = None
    working_hours_today: float = 0.0
    overtime_hours_this_month: float = 0.0
    leave_balances: dict[str, int]
    upcoming_shift: ShiftResponse | None = None
    recent_leave_requests: list[LeaveResponse]
    unread_notifications_count: int
    personal_attendance_trend: list[dict[str, Any]]
