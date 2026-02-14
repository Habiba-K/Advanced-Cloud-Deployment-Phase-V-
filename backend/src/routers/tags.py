from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Annotated
from uuid import UUID

from src.database import get_session
from src.schemas.tag import TagResponse, TagCreate, TagUpdate
from src.services import tag_service
from src.auth.dependencies import get_current_user_id
from src.auth.utils import validate_ownership

router = APIRouter()


async def verify_ownership(
    user_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)]
) -> UUID:
    """
    Verify that the authenticated user matches the path parameter user_id.

    Args:
        user_id: User ID from path parameter
        current_user_id: User ID from JWT token

    Returns:
        Authenticated user ID if validation passes

    Raises:
        HTTPException: 403 if user IDs don't match
    """
    if not validate_ownership(user_id, current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden"
        )
    return current_user_id


@router.get("/{user_id}/tags", response_model=List[TagResponse])
async def list_user_tags(
    user_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    List all tags for a specific user with task counts.

    Requires valid JWT token. User can only access their own tags.

    Args:
        user_id: User identifier from path
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        List of tags with task counts belonging to the authenticated user

    Raises:
        HTTPException: 401 if not authenticated, 403 if accessing other user's data
    """
    try:
        tags = await tag_service.list_tags(db, str(authenticated_user_id))
        return tags
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.post("/{user_id}/tags", response_model=TagResponse, status_code=201)
async def create_tag(
    user_id: UUID,
    tag_data: TagCreate,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new tag for a specific user.

    Requires valid JWT token. User can only create tags for themselves.
    Tag names must be unique per user.

    Args:
        user_id: User identifier from path
        tag_data: Tag creation data (name, color)
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Created tag with all fields

    Raises:
        HTTPException: 401 if not authenticated, 403 if creating for other user,
                      409 if tag name already exists, 422 if validation fails
    """
    try:
        tag = await tag_service.create_tag(db, str(authenticated_user_id), tag_data)
        # Convert to TagResponse with task_count
        return TagResponse(
            id=tag.id,
            user_id=tag.user_id,
            name=tag.name,
            color=tag.color,
            created_at=tag.created_at,
            task_count=0
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.put("/{user_id}/tags/{tag_id}", response_model=TagResponse)
async def update_tag(
    user_id: UUID,
    tag_id: UUID,
    tag_data: TagUpdate,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Update an existing tag for a specific user.

    Requires valid JWT token. User can only update their own tags.

    Args:
        user_id: User identifier from path
        tag_id: Tag unique identifier
        tag_data: Tag update data (name, color)
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Updated tag with all fields

    Raises:
        HTTPException: 401 if not authenticated, 403 if updating other user's tag,
                      404 if tag not found, 409 if new name conflicts, 422 if validation fails
    """
    try:
        tag = await tag_service.update_tag(db, str(authenticated_user_id), tag_id, tag_data)
        if not tag:
            raise HTTPException(
                status_code=404,
                detail="Tag not found"
            )
        # Convert to TagResponse with task_count (will be recalculated on next list)
        return TagResponse(
            id=tag.id,
            user_id=tag.user_id,
            name=tag.name,
            color=tag.color,
            created_at=tag.created_at,
            task_count=0
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.delete("/{user_id}/tags/{tag_id}")
async def delete_tag(
    user_id: UUID,
    tag_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Delete a tag for a specific user.
    Cascade deletes all task-tag associations.

    Requires valid JWT token. User can only delete their own tags.

    Args:
        user_id: User identifier from path
        tag_id: Tag unique identifier
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException: 401 if not authenticated, 403 if deleting other user's tag, 404 if tag not found
    """
    success = await tag_service.delete_tag(db, str(authenticated_user_id), tag_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Tag not found"
        )
    return {"message": "Tag deleted"}
