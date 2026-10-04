from typing import Any
from fastapi import APIRouter, Depends, Query
from pymongo import DESCENDING
from backend.database import get_db
from backend.models.base import serialize_doc
from backend.utils.permissions import require_hr

router = APIRouter(prefix="/audit-logs", tags=["Audit Logging"])


@router.get("", summary="Get System Audit Logs")
def get_audit_logs(
    action: str | None = Query(None, description="Filter by action code"),
    entity_type: str | None = Query(None, description="Filter by entity type (EMPLOYEE, LEAVE, etc.)"),
    user_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(require_hr),
):
    """
    Retrieve system audit log trail (HR only). Sensitive secrets, credentials, and passwords are never logged.
    """
    db = get_db()
    query: dict[str, Any] = {}
    if action:
        query["action"] = action
    if entity_type:
        query["entity_type"] = entity_type
    if user_id:
        query["user_id"] = user_id

    total = db["audit_logs"].count_documents(query)
    skip = (page - 1) * page_size
    cursor = db["audit_logs"].find(query).sort("timestamp", DESCENDING).skip(skip).limit(page_size)

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [serialize_doc(doc) for doc in cursor],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
