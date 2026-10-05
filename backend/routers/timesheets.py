from fastapi import APIRouter, Depends, Query, status
from backend.schemas.timesheet import TimesheetCreate, TimesheetUpdate, TimesheetReview, TimesheetResponse
from backend.services.timesheet_service import TimesheetService
from backend.utils.permissions import get_current_user, require_manager_or_hr

router = APIRouter(prefix="/timesheets", tags=["Timesheet Management"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit Timesheet")
def submit_timesheet(payload: TimesheetCreate, current_user: dict = Depends(get_current_user)):
    """
    Log and submit a timesheet entry for a given date and project task.
    """
    return TimesheetService.create_timesheet(current_user, payload)


@router.get("/my", summary="My Timesheet Submissions")
def get_my_timesheets(
    status: str | None = Query(None, alias="status"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve personal timesheet log history for authenticated employee.
    """
    return TimesheetService.get_timesheets(
        current_user=current_user,
        status_filter=status,
        employee_id=current_user.get("employee_id"),
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


@router.get("/pending", summary="Pending Timesheets for Review")
def get_pending_timesheets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Retrieve timesheets awaiting approval (Manager for direct team, HR for organization).
    """
    return TimesheetService.get_timesheets(
        current_user=current_user,
        status_filter="Submitted",
        page=page,
        page_size=page_size,
    )


@router.put("/{timesheet_id}", summary="Update Timesheet")
def update_timesheet(
    timesheet_id: str,
    payload: TimesheetUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update timesheet details prior to manager approval.
    """
    return TimesheetService.update_timesheet(current_user, timesheet_id, payload)


@router.post("/{timesheet_id}/approve", summary="Approve Timesheet (POST)")
@router.patch("/{timesheet_id}/approve", summary="Approve Timesheet")
def approve_timesheet(
    timesheet_id: str,
    review: TimesheetReview = TimesheetReview(),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Approve employee timesheet entry.
    """
    return TimesheetService.approve_timesheet(current_user, timesheet_id, review)


@router.post("/{timesheet_id}/reject", summary="Reject Timesheet (POST)")
@router.patch("/{timesheet_id}/reject", summary="Reject Timesheet")
def reject_timesheet(
    timesheet_id: str,
    review: TimesheetReview = TimesheetReview(),
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Reject employee timesheet entry with feedback.
    """
    return TimesheetService.reject_timesheet(current_user, timesheet_id, review)


@router.get("", summary="List Timesheets")
def list_timesheets(
    employee_id: str | None = Query(None),
    status: str | None = Query(None, alias="status"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    List timesheets with status and date filtering subject to RBAC.
    """
    return TimesheetService.get_timesheets(
        current_user=current_user,
        status_filter=status,
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
