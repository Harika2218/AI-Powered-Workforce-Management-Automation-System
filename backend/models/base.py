from datetime import datetime, timezone
from typing import Any


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    """Helper to convert MongoDB _id to string or remove it."""
    if doc is None:
        return None
    res = dict(doc)
    if "_id" in res:
        res["id"] = str(res.pop("_id"))
    return res


def now_utc_iso() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()
