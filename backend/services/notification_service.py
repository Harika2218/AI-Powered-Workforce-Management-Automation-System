from typing import Any
from fastapi import HTTPException, status
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc


class NotificationService:
    @staticmethod
    def get_notifications(current_user: dict, unread_only: bool = False, limit: int = 50) -> dict[str, Any]:
        db = get_db()
        user_id = current_user.get("user_id")

        query: dict[str, Any] = {"user_id": user_id}
        if unread_only:
            query["is_read"] = False

        total_unread = db["notifications"].count_documents({"user_id": user_id, "is_read": False})
        cursor = db["notifications"].find(query).sort("created_at", DESCENDING).limit(limit)

        return {
            "unread_count": total_unread,
            "items": [serialize_doc(doc) for doc in cursor],
        }

    @staticmethod
    def mark_as_read(current_user: dict, notification_id: str) -> dict:
        db = get_db()
        user_id = current_user.get("user_id")
        notif = db["notifications"].find_one({"notification_id": notification_id, "user_id": user_id})
        if not notif:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

        db["notifications"].update_one({"_id": notif["_id"]}, {"$set": {"is_read": True}})
        return {"message": "Notification marked as read"}

    @staticmethod
    def mark_all_as_read(current_user: dict) -> dict:
        db = get_db()
        user_id = current_user.get("user_id")
        result = db["notifications"].update_many({"user_id": user_id, "is_read": False}, {"$set": {"is_read": True}})
        return {"message": f"Marked {result.modified_count} notifications as read"}
