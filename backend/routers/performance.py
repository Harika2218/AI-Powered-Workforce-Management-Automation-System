from fastapi import APIRouter, Depends, Query, status
from backend.schemas.performance import (
    PerformanceCreate,
    PerformanceUpdate,
    PerformanceResponse,
    PerformanceAnalytics,
)
from backend.services.performance_service import PerformanceService
from backend.utils.permissions import get_current_user, require_hr, require_manager_or_hr

router = APIRouter(prefix="/performance", tags=["Performance Module"])


@router.post("", response_model=PerformanceResponse, status_code=status.HTTP_201_CREATED, summary="Create Performance Review")
def create_review(payload: PerformanceCreate, current_user: dict = Depends(require_manager_or_hr)):
    """
    Submit employee performance review evaluation with goals, strengths, and areas for improvement.
    """
    return PerformanceService.create_review(current_user, payload)


@router.put("/{review_id}", response_model=PerformanceResponse, summary="Update Performance Review")
def update_review(
    review_id: str,
    payload: PerformanceUpdate,
    current_user: dict = Depends(require_manager_or_hr),
):
    """
    Update performance review comments or scoring.
    """
    return PerformanceService.update_review(current_user, review_id, payload)


@router.get("/my", response_model=list[PerformanceResponse], summary="My Performance Reviews")
def get_my_reviews(current_user: dict = Depends(get_current_user)):
    """
    Retrieve personal completed performance evaluations for the authenticated employee.
    """
    return PerformanceService.get_my_reviews(current_user)


@router.get("/team", response_model=list[PerformanceResponse], summary="Team Performance Reviews")
def get_team_reviews(current_user: dict = Depends(require_manager_or_hr)):
    """
    Retrieve performance reviews for direct team members (Manager / HR).
    """
    return PerformanceService.get_team_reviews(current_user)


@router.get("/analytics", response_model=PerformanceAnalytics, summary="Performance Analytics")
@router.get("/summary", response_model=PerformanceAnalytics, summary="Performance Analytics Summary (Alias)")
def get_performance_analytics(current_user: dict = Depends(require_hr)):
    """
    Calculate organization-wide performance score averages, department metrics, and distribution (HR only).
    """
    return PerformanceService.get_analytics()


@router.get("", summary="List All Performance Reviews")
@router.get("/reviews", summary="List All Performance Reviews (Alias)")
def list_all_reviews(
    department: str | None = Query(None),
    review_period: str | None = Query(None),
    period: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_hr),
):
    """
    Retrieve organization-wide performance reviews with filtering (HR only).
    """
    return PerformanceService.get_all_reviews(
        current_user=current_user,
        department=department,
        review_period=review_period,
        period=period,
        status=status,
        page=page,
        page_size=page_size,
    )
