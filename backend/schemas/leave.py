from typing import Literal
from pydantic import BaseModel, Field, field_validator
from datetime import datetime

LeaveType = Literal["Annual", "Sick", "Casual"]
LeaveStatus = Literal["Pending", "Approved", "Rejected", "Cancelled"]


class LeaveCreate(BaseModel):
    employee_id: str | None = None  # HR or employee
    leave_type: LeaveType
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    reason: str = Field(..., min_length=3, max_length=500)

    @field_validator("leave_type", mode="before")
    def normalize_leave_type(cls, v):
        if isinstance(v, str):
            v_cap = v.strip().capitalize()
            if v_cap in ["Annual", "Sick", "Casual"]:
                return v_cap
        return v

    @field_validator("end_date")
    def validate_dates(cls, v, info):
        if "start_date" in info.data and info.data["start_date"]:
            try:
                start = datetime.strptime(info.data["start_date"], "%Y-%m-%d").date()
                end = datetime.strptime(v, "%Y-%m-%d").date()
                if end < start:
                    raise ValueError("End date cannot be earlier than start date")
            except ValueError as e:
                if "End date cannot be earlier" in str(e):
                    raise
                raise ValueError("Invalid date format, expected YYYY-MM-DD")
        return v


class LeaveReview(BaseModel):
    comments: str | None = None
    reason: str | None = None

    @property
    def comment_text(self) -> str:
        return self.comments or self.reason or ""


class LeaveResponse(BaseModel):
    leave_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    leave_type: LeaveType
    start_date: str
    end_date: str
    total_days: int
    reason: str
    status: LeaveStatus
    applied_at: str
    reviewed_by: str | None = None
    reviewed_at: str | None = None
    comments: str | None = None


class LeaveBalanceResponse(BaseModel):
    employee_id: str
    annual: int
    sick: int
    casual: int
