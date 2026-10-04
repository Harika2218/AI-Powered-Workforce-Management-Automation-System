from fastapi import APIRouter, Depends, Query, status
from backend.schemas.payroll import PayrollCreate, PayrollUpdate, PayrollResponse
from backend.services.payroll_service import PayrollService
from backend.utils.permissions import get_current_user, require_hr

router = APIRouter(prefix="/payroll", tags=["Payroll Input Module"])


@router.post("", response_model=PayrollResponse, status_code=status.HTTP_201_CREATED, summary="Save / Calculate Payroll Input")
def save_payroll(payload: PayrollCreate, current_user: dict = Depends(require_hr)):
    """
    Input basic salary, allowances, deductions, and overtime to calculate gross and net totals (HR only).
    """
    return PayrollService.create_or_calculate_payroll(current_user, payload)


@router.get("/my", response_model=list[PayrollResponse], summary="My Payroll Statements")
def get_my_payroll(
    pay_period: str | None = Query(None, description="YYYY-MM"),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve personal payroll records for the authenticated employee.
    """
    return PayrollService.get_my_payroll(current_user, pay_period)


@router.get("", summary="List Organization Payroll Records")
def get_payroll_list(
    pay_period: str | None = Query(None, description="YYYY-MM"),
    department: str | None = Query(None),
    employee_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_hr),
):
    """
    Retrieve payroll statements across the organization (HR only).
    """
    return PayrollService.get_payroll_list(
        current_user=current_user,
        pay_period=pay_period,
        department=department,
        employee_id=employee_id,
        page=page,
        page_size=page_size,
    )
