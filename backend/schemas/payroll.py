from typing import Literal
from pydantic import BaseModel, Field

PayrollStatus = Literal["Draft", "Calculated", "Finalized"]


class PayrollCreate(BaseModel):
    employee_id: str
    pay_period: str | None = Field(default=None, description="YYYY-MM")
    month: str | None = Field(default=None, description="Alias for pay_period YYYY-MM")
    basic_salary: float | None = Field(default=None, ge=0)
    allowances: float = Field(default=0.0, ge=0)
    deductions: float = Field(default=0.0, ge=0)
    overtime_hours: float = Field(default=0.0, ge=0)
    overtime_rate: float | None = Field(default=None, ge=0)


class PayrollUpdate(BaseModel):
    basic_salary: float | None = Field(default=None, ge=0)
    allowances: float | None = Field(default=None, ge=0)
    deductions: float | None = Field(default=None, ge=0)
    overtime_hours: float | None = Field(default=None, ge=0)
    overtime_rate: float | None = Field(default=None, ge=0)
    status: PayrollStatus | None = None


class PayrollResponse(BaseModel):
    payroll_id: str
    employee_id: str
    employee_name: str | None = None
    department: str | None = None
    pay_period: str
    month: str | None = None
    basic_salary: float
    allowances: float
    deductions: float
    overtime_hours: float
    overtime_amount: float
    overtime_pay: float | None = None
    gross_salary: float
    net_salary: float
    status: PayrollStatus
    payment_status: str | None = None
    processed_at: str | None = None
