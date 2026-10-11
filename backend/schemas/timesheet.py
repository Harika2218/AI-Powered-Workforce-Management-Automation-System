from typing import Literal
from pydantic import BaseModel, Field

TimesheetStatus = Literal["Draft", "Submitted", "Approved", "Rejected"]


class TimesheetCreate(BaseModel):
    employee_id: str | None = None
    date: str | None = None  # YYYY-MM-DD
    week_start_date: str | None = None
    daily_hours: dict[str, float] | None = None
    project_name: str | None = None
    task_name: str | None = None
    hours_worked: float | None = Field(default=None, gt=0, le=24)
    description: str | None = None
    notes: str | None = None
    work_start_notes: str | None = None


class TimesheetUpdate(BaseModel):
    project_name: str | None = None
    task_name: str | None = None
    hours_worked: float | None = Field(default=None, gt=0, le=24)
    description: str | None = None
    notes: str | None = None
    work_start_notes: str | None = None


class TimesheetReview(BaseModel):
    comments: str | None = None
    reason: str | None = None


class TimesheetResponse(BaseModel):
    timesheet_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    date: str
    week_start_date: str | None = None
    project_name: str
    task_name: str
    hours_worked: float
    total_hours: float | None = None
    description: str
    notes: str | None = None
    work_start_notes: str | None = None
    status: TimesheetStatus
    approved_by: str | None = None
    reviewed_at: str | None = None
    comments: str | None = None
    manager_comments: str | None = None
    created_at: str | None = None
