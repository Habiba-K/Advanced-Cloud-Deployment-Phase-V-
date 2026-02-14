from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from src.models.tag import Tag
from src.models.todo_tag import TodoTag
from src.schemas.tag import TagCreate, TagUpdate, TagResponse


async def list_tags(db: AsyncSession, user_id: str) -> List[TagResponse]:
    """
    Retrieve all tags for a specific user with task counts.

    Args:
        db: Database session
        user_id: User identifier to filter tags

    Returns:
        List of TagResponse objects with task_count
    """
    # Query tags with task counts
    query = (
        select(
            Tag,
            func.count(TodoTag.todo_id).label("task_count")
        )
        .outerjoin(TodoTag, Tag.id == TodoTag.tag_id)
        .where(Tag.user_id == user_id)
        .group_by(Tag.id)
    )

    result = await db.execute(query)
    rows = result.all()

    # Convert to TagResponse objects
    tags = []
    for tag, task_count in rows:
        tag_response = TagResponse(
            id=tag.id,
            user_id=tag.user_id,
            name=tag.name,
            color=tag.color,
            created_at=tag.created_at,
            task_count=task_count or 0
        )
        tags.append(tag_response)

    return tags


async def create_tag(db: AsyncSession, user_id: str, tag_data: TagCreate) -> Tag:
    """
    Create a new tag for a specific user.

    Args:
        db: Database session
        user_id: User identifier to assign tag to
        tag_data: Tag creation data (name, color)

    Returns:
        Created Tag object

    Raises:
        HTTPException: 409 if tag with same name already exists for user
    """
    tag = Tag(
        user_id=user_id,
        name=tag_data.name,
        color=tag_data.color
    )

    db.add(tag)

    try:
        await db.commit()
        await db.refresh(tag)
        return tag
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{tag_data.name}' already exists"
        )


async def get_tag_by_id(db: AsyncSession, user_id: str, tag_id: UUID) -> Optional[Tag]:
    """
    Retrieve a specific tag by ID for a specific user.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        tag_id: Tag unique identifier

    Returns:
        Tag object if found and belongs to user, None otherwise
    """
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
    )
    tag = result.scalar_one_or_none()
    return tag


async def update_tag(db: AsyncSession, user_id: str, tag_id: UUID, tag_data: TagUpdate) -> Optional[Tag]:
    """
    Update an existing tag for a specific user.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        tag_id: Tag unique identifier
        tag_data: Tag update data (name, color)

    Returns:
        Updated Tag object if found and belongs to user, None otherwise

    Raises:
        HTTPException: 409 if another tag with same name already exists for user
    """
    tag = await get_tag_by_id(db, user_id, tag_id)
    if not tag:
        return None

    # Update only provided fields
    if tag_data.name is not None:
        tag.name = tag_data.name
    if tag_data.color is not None:
        tag.color = tag_data.color

    try:
        await db.commit()
        await db.refresh(tag)
        return tag
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tag '{tag_data.name}' already exists"
        )


async def delete_tag(db: AsyncSession, user_id: str, tag_id: UUID) -> bool:
    """
    Delete a tag for a specific user.
    Cascade deletes all task-tag associations.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        tag_id: Tag unique identifier

    Returns:
        True if tag was deleted, False if not found or doesn't belong to user
    """
    tag = await get_tag_by_id(db, user_id, tag_id)
    if not tag:
        return False

    await db.delete(tag)
    await db.commit()
    return True
