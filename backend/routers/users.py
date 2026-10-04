from typing import Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pymongo import ASCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.schemas.user import UserResponse, UserUpdate
from backend.utils.helpers import log_audit, now_iso
from backend.utils.permissions import get_current_user, require_hr

router = APIRouter(prefix="/users", tags=["User Administration"])


@router.get("", summary="List System Users")
def list_users(
    role: str | None = Query(None, description="Filter by role (HR, MANAGER, EMPLOYEE)"),
    status: str | None = Query(None, alias="status", description="Filter by status (invited, active, deactivated)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_hr),
):
    """
    List user accounts in the system with role and status filtering (HR only).
    """
    db = get_db()
    query: dict[str, Any] = {}
    if role:
        query["role"] = role
    if status:
        query["status"] = status

    total = db["users"].count_documents(query)
    skip = (page - 1) * page_size
    cursor = db["users"].find(query).sort("created_at", ASCENDING).skip(skip).limit(page_size)

    items = []
    for doc in cursor:
        d = serialize_doc(doc)
        d.pop("password_hash", None)
        items.append(d)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{user_id}", summary="Get User Details")
def get_user_by_id(user_id: str, current_user: dict = Depends(require_hr)):
    """
    Retrieve specific user account metadata (HR only).
    """
    db = get_db()
    doc = db["users"].find_one({"user_id": user_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found")

    d = serialize_doc(doc)
    d.pop("password_hash", None)
    return d


@router.patch("/{user_id}", summary="Update User Status or Role")
def update_user(user_id: str, payload: UserUpdate, current_user: dict = Depends(require_hr)):
    """
    Update user status (invited/active/deactivated) or role (HR only).
    """
    db = get_db()
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if updates:
        updates["updated_at"] = now_iso()
        db["users"].update_one({"user_id": user_id}, {"$set": updates})

    log_audit(
        user_id=current_user["user_id"],
        action="USER_ADMIN_UPDATED",
        entity_type="USER",
        entity_id=user_id,
        metadata=updates,
    )

    d = serialize_doc(db["users"].find_one({"user_id": user_id}))
    d.pop("password_hash", None)
    return d
