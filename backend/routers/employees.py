from fastapi import APIRouter, Depends, Query, status
from backend.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeProfilePatch,
    EmployeeStatusUpdate,
)
from backend.services.employee_service import EmployeeService
from backend.utils.permissions import get_current_user, require_hr

router = APIRouter(prefix="/employees", tags=["Employee Management"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create / Provision Employee")
def create_employee(payload: EmployeeCreate, current_user: dict = Depends(require_hr)):
    """
    HR provisions a new employee profile and user account.
    Generates a one-time activation token for first-time login setup.
    """
    return EmployeeService.create_employee(current_user, payload)


@router.get("", summary="List / Search Employees")
def get_employees(
    search: str | None = Query(None, description="Search by name, email, designation, or ID"),
    department: str | None = Query(None, description="Filter by department"),
    status: str | None = Query(None, alias="status", description="Filter by employment status (Active/Inactive/On Leave)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("employee_id"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve paginated employee directory.
    - HR: Organization-wide access with full details.
    - MANAGER: Authorized team members.
    - EMPLOYEE: General directory with sensitive fields masked.
    """
    return EmployeeService.get_employees(
        current_user=current_user,
        search=search,
        department=department,
        status_filter=status,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.patch("/profile/me", summary="Update Own Profile")
def update_own_profile(payload: EmployeeProfilePatch, current_user: dict = Depends(get_current_user)):
    """
    Allow authenticated employees to update non-sensitive personal fields (phone, location, skills).
    """
    return EmployeeService.patch_own_profile(current_user, payload)


@router.get("/{employee_id}", summary="Get Employee Details")
def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve specific employee profile details subject to RBAC.
    """
    return EmployeeService.get_employee_by_id(current_user, employee_id)


@router.put("/{employee_id}", summary="Update Full Employee Profile")
def update_employee(employee_id: str, payload: EmployeeUpdate, current_user: dict = Depends(require_hr)):
    """
    Full employee profile update (HR only).
    """
    return EmployeeService.update_employee(current_user, employee_id, payload)


@router.patch("/{employee_id}", summary="Partial Update Employee Profile")
def patch_employee(employee_id: str, payload: EmployeeUpdate, current_user: dict = Depends(require_hr)):
    """
    Partial employee profile update (HR only).
    """
    return EmployeeService.update_employee(current_user, employee_id, payload)


@router.patch("/{employee_id}/status", summary="Change Employee Employment Status")
def update_employee_status(
    employee_id: str,
    payload: EmployeeStatusUpdate,
    current_user: dict = Depends(require_hr),
):
    """
    Change employee employment status (Active, Inactive, On Leave).
    Synchronizes user account active/deactivated state (HR only).
    """
    return EmployeeService.update_status(current_user, employee_id, payload)
