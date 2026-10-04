import logging
from pymongo import MongoClient, ASCENDING, IndexModel
from pymongo.database import Database
from backend.config import get_settings

logger = logging.getLogger(__name__)

_client: MongoClient | None = None
_db: Database | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
    return _client


def get_db() -> Database:
    global _db
    if _db is None:
        settings = get_settings()
        client = get_client()
        _db = client[settings.DATABASE_NAME]
    return _db


def close_db_connection() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def init_db_indexes() -> None:
    """Ensure all required collections have optimal indexes as specified in the architecture."""
    db = get_db()

    collections_and_indexes = {
        "users": [
            IndexModel([("email", ASCENDING)], unique=True, name="idx_users_email"),
            IndexModel([("employee_id", ASCENDING)], unique=True, sparse=True, name="idx_users_employee_id"),
            IndexModel([("role", ASCENDING)], name="idx_users_role"),
            IndexModel([("status", ASCENDING)], name="idx_users_status"),
        ],
        "employees": [
            IndexModel([("employee_id", ASCENDING)], unique=True, name="idx_emp_employee_id"),
            IndexModel([("email", ASCENDING)], unique=True, name="idx_emp_email"),
            IndexModel([("department", ASCENDING)], name="idx_emp_department"),
            IndexModel([("manager_id", ASCENDING)], name="idx_emp_manager_id"),
            IndexModel([("employment_status", ASCENDING)], name="idx_emp_status"),
        ],
        "attendance": [
            IndexModel([("employee_id", ASCENDING), ("date", ASCENDING)], unique=True, name="idx_att_emp_date"),
            IndexModel([("date", ASCENDING)], name="idx_att_date"),
            IndexModel([("status", ASCENDING)], name="idx_att_status"),
        ],
        "leave_requests": [
            IndexModel([("employee_id", ASCENDING)], name="idx_leave_emp_id"),
            IndexModel([("status", ASCENDING)], name="idx_leave_status"),
            IndexModel([("start_date", ASCENDING), ("end_date", ASCENDING)], name="idx_leave_dates"),
        ],
        "shifts": [
            IndexModel([("shift_id", ASCENDING)], unique=True, name="idx_shifts_shift_id"),
            IndexModel([("name", ASCENDING)], name="idx_shifts_name"),
        ],
        "timesheets": [
            IndexModel([("employee_id", ASCENDING)], name="idx_ts_emp_id"),
            IndexModel([("date", ASCENDING)], name="idx_ts_date"),
            IndexModel([("status", ASCENDING)], name="idx_ts_status"),
        ],
        "payroll": [
            IndexModel([("employee_id", ASCENDING), ("pay_period", ASCENDING)], unique=True, name="idx_pay_emp_period"),
            IndexModel([("pay_period", ASCENDING)], name="idx_pay_period"),
        ],
        "performance": [
            IndexModel([("employee_id", ASCENDING), ("review_period", ASCENDING)], name="idx_perf_emp_period"),
            IndexModel([("employee_id", ASCENDING)], name="idx_perf_emp_id"),
        ],
        "notifications": [
            IndexModel([("user_id", ASCENDING)], name="idx_notif_user_id"),
            IndexModel([("is_read", ASCENDING)], name="idx_notif_is_read"),
            IndexModel([("created_at", ASCENDING)], name="idx_notif_created_at"),
        ],
        "audit_logs": [
            IndexModel([("user_id", ASCENDING)], name="idx_audit_user_id"),
            IndexModel([("action", ASCENDING)], name="idx_audit_action"),
            IndexModel([("entity_type", ASCENDING)], name="idx_audit_entity_type"),
            IndexModel([("timestamp", ASCENDING)], name="idx_audit_timestamp"),
        ],
        "auth_tokens": [
            IndexModel([("token", ASCENDING)], unique=True, name="idx_tok_token"),
            IndexModel([("email", ASCENDING), ("type", ASCENDING)], name="idx_tok_email_type"),
            IndexModel([("expires_at", ASCENDING)], name="idx_tok_expires_at"),
        ],
    }

    for col_name, indexes in collections_and_indexes.items():
        try:
            db[col_name].create_indexes(indexes)
        except Exception as e:
            logger.warning(f"Note creating indexes on {col_name}: {e}. Attempting index recreation.")
            # Drop old conflicting indexes if any and retry
            for idx in indexes:
                try:
                    db[col_name].create_indexes([idx])
                except Exception as inner_e:
                    logger.debug(f"Index {idx} notice: {inner_e}")

    logger.info("All MongoDB indexes initialized successfully.")
