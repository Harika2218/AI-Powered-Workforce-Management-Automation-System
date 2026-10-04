from typing import Literal
from pydantic import BaseModel, Field

TimesheetStatus = Literal["Draft", "Submitted", "Approved", "Rejected"]


class TimesheetCreate(BaseModel):
    employee_id: str | None = None
    date: str  # YYYY-MM-DD
    project_name: str = Field(..., min_length=2, max_length=100)
    task_name: str = Field(..., min_length=2, max_length=100)
    hours_worked: float = Field(..., gt=0, le=24)
    description: str = Field(..., min_length=3, max_length=500)


class TimesheetUpdate(BaseModel):
    project_name: str | None = None
    task_name: str | None = None
    hours_worked: float | None = Field(default=None, gt=0, le=24)
    description: str | None = None


class TimesheetReview(BaseModel):
    comments: str | None = None


class TimesheetResponse(BaseModel):
    timesheet_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    date: str
    project_name: str
    task_name: str
    hours_worked: float
    description: str
    status: TimesheetStatus
    approved_by: str | None = None
    reviewed_at: str | None = None
    comments: str | None = None
