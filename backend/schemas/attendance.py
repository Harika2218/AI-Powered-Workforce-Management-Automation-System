from typing import Literal
from pydantic import BaseModel, Field

AttendanceStatus = Literal["Present", "Absent", "Late", "Half Day", "On Leave"]


class CheckInRequest(BaseModel):
    employee_id: str | None = None
    timestamp: str | None = None  # ISO format string, defaults to current time if omitted


class CheckOutRequest(BaseModel):
    employee_id: str | None = None
    timestamp: str | None = None  # ISO format string, defaults to current time if omitted


class AttendanceRecordResponse(BaseModel):
    attendance_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    date: str  # YYYY-MM-DD
    check_in: str | None = None
    check_out: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    working_hours: float = 0.0
    status: AttendanceStatus
    late_minutes: int = 0
    overtime_hours: float = 0.0


class AttendanceAnomaly(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    anomaly_type: str  # e.g. "Excessive Overtime", "Chronic Late Arrival", "Abnormally Low Hours"
    severity: Literal["Low", "Medium", "High"]
    reason: str
    date: str
