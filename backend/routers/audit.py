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
    
    # Preload user mapping for fast enrichment
    user_ids = [doc.get("user_id") for doc in cursor if doc.get("user_id")]
    cursor.rewind()
    user_map = {}
    if user_ids:
        for u in db["users"].find({"user_id": {"$in": user_ids}}, {"user_id": 1, "email": 1, "role": 1}):
            user_map[u["user_id"]] = u

    items = []
    for doc in cursor:
        d = serialize_doc(doc)
        uid = d.get("user_id")
        user_info = user_map.get(uid, {})
        d["user_email"] = d.get("user_email") or user_info.get("email") or uid or "system@company.com"
        d["user_role"] = d.get("user_role") or user_info.get("role") or "SYSTEM"
        d["entity"] = d.get("entity") or d.get("entity_type") or "SYSTEM"
        
        meta = d.get("metadata") or {}
        if not d.get("details"):
            if isinstance(meta, dict) and meta:
                d["details"] = ", ".join(f"{k}: {v}" for k, v in meta.items())
            else:
                d["details"] = f"{d.get('action', 'Action')} performed on {d.get('entity_id', 'record')}"
        items.append(d)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }
