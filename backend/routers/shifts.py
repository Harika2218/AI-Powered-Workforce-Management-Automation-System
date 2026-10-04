from fastapi import APIRouter, Depends, status
from backend.schemas.shift import ShiftCreate, ShiftUpdate, ShiftAssign, ShiftResponse
from backend.services.shift_service import ShiftService
from backend.utils.permissions import get_current_user, require_hr, require_manager_or_hr

router = APIRouter(prefix="/shifts", tags=["Shift Management"])


@router.get("", response_model=list[ShiftResponse], summary="List All Shift Definitions")
def list_shifts(current_user: dict = Depends(get_current_user)):
    """
    List available shift definitions (Morning, General, Evening, Night).
    """
    return ShiftService.get_all_shifts()


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ShiftResponse, summary="Create New Shift Definition")
def create_shift(payload: ShiftCreate, current_user: dict = Depends(require_hr)):
    """
    Define a new shift (HR only).
    """
    return ShiftService.create_shift(current_user, payload)


@router.put("/{shift_id}", response_model=ShiftResponse, summary="Update Shift Definition")
def update_shift(shift_id: str, payload: ShiftUpdate, current_user: dict = Depends(require_hr)):
    """
    Update shift definition parameters (HR only).
    """
    return ShiftService.update_shift(current_user, shift_id, payload)


@router.post("/assign", summary="Assign Shift to Employee")
def assign_shift(payload: ShiftAssign, current_user: dict = Depends(require_manager_or_hr)):
    """
    Assign a shift to an employee (Manager for team, HR for anyone).
    """
    return ShiftService.assign_shift(current_user, payload)


@router.get("/my", summary="My Assigned Shift")
def get_my_shift(current_user: dict = Depends(get_current_user)):
    """
    View assigned shift schedule for authenticated user.
    """
    return ShiftService.get_my_shift(current_user)


@router.get("/team", summary="Team Shift Schedule")
def get_team_shifts(current_user: dict = Depends(require_manager_or_hr)):
    """
    View shift assignments for team members (Manager / HR).
    """
    return ShiftService.get_team_shifts(current_user)
