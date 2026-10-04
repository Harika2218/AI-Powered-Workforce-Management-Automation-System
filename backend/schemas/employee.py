from typing import Literal
from pydantic import BaseModel, EmailStr, Field


EmploymentType = Literal["Full-Time", "Part-Time", "Contract"]
EmploymentStatus = Literal["Active", "Inactive", "On Leave"]


class LeaveEntitlement(BaseModel):
    annual: int = 18
    sick: int = 10
    casual: int = 7


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    department: str
    designation: str
    manager_id: str | None = None
    date_of_joining: str  # YYYY-MM-DD
    employment_type: EmploymentType = "Full-Time"
    employment_status: EmploymentStatus = "Active"
    location: str
    skills: list[str] = []


class EmployeeCreate(EmployeeBase):
    employee_id: str = Field(..., pattern=r"^[A-Z0-9_-]{3,20}$", description="Unique employee identifier")
    salary: float = Field(..., ge=0, description="Monthly basic salary")
    allowances: float = Field(default=0.0, ge=0)
    leave_entitlement: LeaveEntitlement = Field(default_factory=LeaveEntitlement)
    role: Literal["HR", "MANAGER", "EMPLOYEE"] = "EMPLOYEE"
    shift_id: str = "SHIFT-GEN"


class EmployeeUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    department: str | None = None
    designation: str | None = None
    manager_id: str | None = None
    date_of_joining: str | None = None
    employment_type: EmploymentType | None = None
    employment_status: EmploymentStatus | None = None
    location: str | None = None
    skills: list[str] | None = None
    salary: float | None = Field(default=None, ge=0)
    allowances: float | None = Field(default=None, ge=0)
    shift_id: str | None = None


class EmployeeProfilePatch(BaseModel):
    """Fields employees are allowed to update on their own profile."""
    phone: str | None = None
    location: str | None = None
    skills: list[str] | None = None


class EmployeeStatusUpdate(BaseModel):
    employment_status: EmploymentStatus


class EmployeeResponse(EmployeeBase):
    employee_id: str
    full_name: str
    salary: float | None = None  # Populated only for HR or the employee themselves
    allowances: float | None = None
    leave_balances: dict[str, int]
    shift_id: str = "SHIFT-GEN"
    created_at: str | None = None
    updated_at: str | None = None
