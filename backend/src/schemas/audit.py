from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class AuditLogResponse(BaseModel):
    """Schema for audit log entry responses."""
    id: UUID
    user_id: str
    event_type: str
    task_id: UUID
    task_data: Dict[str, Any]
    event_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log response."""
    items: List[AuditLogResponse]
    total: int
    offset: int
    limit: int
