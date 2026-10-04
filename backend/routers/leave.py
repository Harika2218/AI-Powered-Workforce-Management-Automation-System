from fastapi import APIRouter, Depends, Query, status
from backend.schemas.leave import (
    LeaveCreate,
    LeaveReview,
    LeaveResponse,
    LeaveBalanceResponse,
)
from backend.services.leave_service import LeaveService
from backend.utils.permissions import get_current_user, require_manager_or_hr

router = APIRouter(prefix="/leave", tags=["Leave Management"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit Leave Request")
def apply_leave(payload: LeaveCreate, current_user: dict = Depends(get_current_user)):
    """
    Submit a leave request. Validates dates, checks for overlapping requests, and verifies balance.
    """
    return LeaveService.apply_leave(current_user, payload)


@router.get("/my", summary="My Leave Requests")
def get_my_leave(
    status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve personal leave requests for the authenticated employee.
    """
    return LeaveService.get_leaves(
        current_user=current_user,
        status_filter=status,
        employee_id=current_user.get("employee_id"),
        page=page,
        page_size=page_size,
    )


@router.get("/pending", summary="Pending Leave Requests")
def get_pending_leave(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Retrieve pending leave requests awaiting approval (team for Manager, organization for HR).
    """
    return LeaveService.get_leaves(
        current_user=current_user,
        status_filter="Pending",
        page=page,
        page_size=page_size,
    )


@router.get("/balance/my", response_model=LeaveBalanceResponse, summary="My Leave Balance")
def get_my_leave_balance(current_user: dict = Depends(get_current_user)):
    """
    Retrieve current remaining leave entitlement balance for authenticated employee.
    """
    return LeaveService.get_leave_balance(current_user)


@router.get("/balance/{employee_id}", response_model=LeaveBalanceResponse, summary="Employee Leave Balance")
@router.get("/balances/{employee_id}", response_model=LeaveBalanceResponse, summary="Employee Leave Balance (Alias)")
def get_employee_leave_balance(employee_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve leave balance for a specific employee subject to RBAC.
    """
    return LeaveService.get_leave_balance(current_user, employee_id)


@router.post("/{leave_id}/approve", summary="Approve Leave Request (POST)")
@router.patch("/{leave_id}/approve", summary="Approve Leave Request")
def approve_leave(
    leave_id: str,
    review: LeaveReview = LeaveReview(),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Approve pending leave request and automatically deduct entitlement days from employee balance.
    """
    return LeaveService.approve_leave(current_user, leave_id, review)


@router.post("/{leave_id}/reject", summary="Reject Leave Request (POST)")
@router.patch("/{leave_id}/reject", summary="Reject Leave Request")
def reject_leave(
    leave_id: str,
    review: LeaveReview = LeaveReview(),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Reject pending leave request without deducting entitlement days.
    """
    return LeaveService.reject_leave(current_user, leave_id, review)


@router.post("/{leave_id}/cancel", summary="Cancel Leave Request (POST)")
@router.patch("/{leave_id}/cancel", summary="Cancel Leave Request")
def cancel_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    """
    Cancel an existing leave request. Restores deducted days if previously approved.
    """
    return LeaveService.cancel_leave(current_user, leave_id)


@router.get("", summary="List Leave Requests")
def list_leaves(
    status: str | None = Query(None, alias="status"),
    employee_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    List leave requests with status filtering subject to role permissions.
    """
    return LeaveService.get_leaves(
        current_user=current_user,
        status_filter=status,
        employee_id=employee_id,
        page=page,
        page_size=page_size,
    )
