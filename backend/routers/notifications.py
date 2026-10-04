from fastapi import APIRouter, Depends, Query
from backend.services.notification_service import NotificationService
from backend.utils.permissions import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Get Notifications")
def get_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    """
    Retrieve notification feed and unread counter for authenticated user.
    """
    return NotificationService.get_notifications(current_user, unread_only=unread_only, limit=limit)


@router.patch("/{notification_id}/read", summary="Mark Notification as Read")
def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """
    Mark a specific notification as read.
    """
    return NotificationService.mark_as_read(current_user, notification_id)


@router.patch("/read-all", summary="Mark All Notifications as Read")
def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """
    Mark all unread notifications as read.
    """
    return NotificationService.mark_all_as_read(current_user)
