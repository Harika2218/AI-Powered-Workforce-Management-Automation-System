from typing import Any
from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    log_id: str
    user_id: str
    action: str
    entity_type: str
    entity_id: str
    timestamp: str
    metadata: dict[str, Any] = {}
