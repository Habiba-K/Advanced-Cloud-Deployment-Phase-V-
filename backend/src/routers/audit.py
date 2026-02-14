from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional
from uuid import UUID

from src.database import get_session
from src.schemas.audit import AuditLogListResponse
from src.services import audit_service
from src.auth.dependencies import get_current_user_id

router = APIRouter()


@router.get("/{user_id}/audit", response_model=AuditLogListResponse)
async def list_audit_logs(
    user_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_session),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    event_type: Optional[str] = Query(None, pattern="^(created|updated|completed|deleted)$"),
    task_id: Optional[UUID] = Query(None),
):
    """
    List audit log entries for the authenticated user.
    Supports filtering by event_type and task_id, with pagination.
    """
    if str(user_id) != str(current_user_id):
        raise HTTPException(status_code=403, detail="Access forbidden")

    items, total = await audit_service.list_audit_logs(
        db, str(current_user_id), limit=limit, offset=offset,
        event_type=event_type, task_id=task_id
    )

    return AuditLogListResponse(
        items=items, total=total, offset=offset, limit=limit
    )
