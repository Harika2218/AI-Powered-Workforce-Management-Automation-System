from pydantic import BaseModel


class NotificationResponse(BaseModel):
    notification_id: str
    user_id: str
    title: str
    message: str
    type: str  # e.g. "leave", "shift", "timesheet", "performance", "system"
    is_read: bool
    created_at: str


class NotificationUnreadCount(BaseModel):
    unread_count: int
