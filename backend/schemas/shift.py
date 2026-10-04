from pydantic import BaseModel, Field


class ShiftCreate(BaseModel):
    shift_id: str = Field(..., pattern=r"^[A-Z0-9_-]{3,20}$")
    name: str = Field(..., min_length=2, max_length=50)
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 09:00")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}$", description="HH:MM format, e.g. 17:00")
    duration_hours: float = Field(..., gt=0, le=24)


class ShiftUpdate(BaseModel):
    name: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    duration_hours: float | None = None


class ShiftAssign(BaseModel):
    employee_id: str
    shift_id: str


class ShiftResponse(BaseModel):
    shift_id: str
    name: str
    start_time: str
    end_time: str
    duration_hours: float


class EmployeeShiftResponse(BaseModel):
    employee_id: str
    employee_name: str
    department: str
    shift: ShiftResponse | None = None
