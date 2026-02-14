from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from src.models.audit_log import AuditLog
from src.schemas.audit import AuditLogResponse
import logging

logger = logging.getLogger(__name__)


async def list_audit_logs(
    db: AsyncSession,
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    event_type: Optional[str] = None,
    task_id: Optional[UUID] = None
) -> Tuple[List[AuditLogResponse], int]:
    """
    List audit log entries for a user with optional filters and pagination.

    Returns:
        Tuple of (list of audit entries, total count)
    """
    # Build base query
    query = select(AuditLog).where(AuditLog.user_id == user_id)
    count_query = select(func.count()).select_from(AuditLog).where(AuditLog.user_id == user_id)

    if event_type:
        query = query.where(AuditLog.event_type == event_type)
        count_query = count_query.where(AuditLog.event_type == event_type)

    if task_id:
        query = query.where(AuditLog.task_id == task_id)
        count_query = count_query.where(AuditLog.task_id == task_id)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply sorting and pagination
    query = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            event_type=log.event_type,
            task_id=log.task_id,
            task_data=log.task_data,
            event_id=log.event_id,
            timestamp=log.timestamp,
        )
        for log in logs
    ], total
