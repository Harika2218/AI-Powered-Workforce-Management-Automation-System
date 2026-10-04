import uuid
from datetime import datetime, timezone, timedelta
from typing import Any
from backend.database import get_db


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def today_date_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def log_audit(
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Safely log important actions into the audit_logs collection without sensitive secrets."""
    db = get_db()
    safe_metadata = {}
    if metadata:
        for k, v in metadata.items():
            # Filter out sensitive fields
            if any(secret_term in k.lower() for secret_term in ["pass", "token", "secret", "hash"]):
                continue
            safe_metadata[k] = v

    log_entry = {
        "log_id": f"AUDIT-{uuid.uuid4().hex[:12].upper()}",
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "timestamp": now_iso(),
        "metadata": safe_metadata,
    }
    db["audit_logs"].insert_one(log_entry)


def create_notification(
    user_id: str,
    title: str,
    message: str,
    type: str = "system",
) -> None:
    """Create a notification in MongoDB for a specific user."""
    db = get_db()
    notif = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:12].upper()}",
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "is_read": False,
        "created_at": now_iso(),
    }
    db["notifications"].insert_one(notif)


def calculate_working_hours(
    check_in_dt: datetime,
    check_out_dt: datetime,
    shift_start_hour: int = 9,
    shift_start_minute: int = 0,
    standard_hours: float = 8.0,
) -> tuple[float, float, int]:
    """
    Calculate working hours, overtime hours, and late arrival minutes.
    Returns: (working_hours, overtime_hours, late_minutes)
    """
    duration = (check_out_dt - check_in_dt).total_seconds() / 3600.0
    working_hours = round(max(0.0, duration), 2)
    overtime_hours = round(max(0.0, working_hours - standard_hours), 2)

    # Late minutes calculation
    expected_start = check_in_dt.replace(
        hour=shift_start_hour, minute=shift_start_minute, second=0, microsecond=0
    )
    if check_in_dt > expected_start:
        late_seconds = (check_in_dt - expected_start).total_seconds()
        late_minutes = int(max(0, late_seconds // 60))
    else:
        late_minutes = 0

    return working_hours, overtime_hours, late_minutes


def count_days_inclusive(start_date_str: str, end_date_str: str) -> int:
    """Calculate the number of days between two dates inclusive."""
    start = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    end = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    delta = (end - start).days + 1
    return max(1, delta)
