from typing import List, Optional
from uuid import UUID
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_, func
from sqlalchemy.orm import selectinload
from src.models.task import Task, TaskPriority, TaskStatus, RecurrencePattern
from src.models.tag import Tag
from src.models.todo_tag import TodoTag
from src.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TagSummary, TaskListParams
from src.services.event_publisher import publish_reminder_event, publish_task_event, publish_task_update_event
import logging

logger = logging.getLogger(__name__)


def _build_task_response(task: Task, tags: List[TagSummary]) -> TaskResponse:
    """Build a TaskResponse from a Task model and tags list."""
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        completed=task.completed,
        status=task.status.value,
        priority=task.priority.value,
        tags=tags,
        due_date=task.due_date,
        remind_at=task.remind_at,
        recurrence_pattern=task.recurrence_pattern.value if task.recurrence_pattern else "none",
        recurrence_interval=task.recurrence_interval or 1,
        next_occurrence=task.next_occurrence,
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


def _calculate_next_occurrence(base_date: date, pattern: RecurrencePattern, interval: int) -> date:
    """Calculate the next occurrence date based on recurrence pattern and interval."""
    if pattern == RecurrencePattern.DAILY:
        return base_date + timedelta(days=interval)
    elif pattern == RecurrencePattern.WEEKLY:
        return base_date + timedelta(weeks=interval)
    elif pattern == RecurrencePattern.MONTHLY:
        return base_date + relativedelta(months=interval)
    return base_date


async def get_user_tasks(db: AsyncSession, user_id: str) -> List[TaskResponse]:
    """
    Retrieve all tasks for a specific user with their tags.

    Args:
        db: Database session
        user_id: User identifier to filter tasks

    Returns:
        List of TaskResponse objects with tags populated
    """
    result = await db.execute(
        select(Task).where(Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    tasks = result.scalars().all()

    task_responses = []
    for task in tasks:
        tags = await get_task_tags(db, task.id)
        task_responses.append(_build_task_response(task, tags))

    return task_responses


async def list_tasks(
    db: AsyncSession,
    user_id: str,
    params: TaskListParams
) -> List[TaskResponse]:
    """
    Retrieve tasks with search, filter, sort, and pagination.

    Args:
        db: Database session
        user_id: User identifier to filter tasks
        params: Query parameters (search, filters, sort, pagination)

    Returns:
        List of TaskResponse objects matching the criteria
    """
    # Start with base query (exclude soft-deleted)
    query = select(Task).where(Task.user_id == user_id, Task.deleted_at.is_(None))

    # Apply search filter (case-insensitive across title and description)
    if params.search:
        search_term = f"%{params.search}%"
        query = query.where(
            or_(
                Task.title.ilike(search_term),
                Task.description.ilike(search_term)
            )
        )

    # Apply status filter
    if params.status:
        if params.status == 'pending':
            query = query.where(Task.status == TaskStatus.PENDING)
        elif params.status == 'completed':
            query = query.where(Task.status == TaskStatus.COMPLETED)

    # Apply priority filter
    if params.priority:
        query = query.where(Task.priority == TaskPriority(params.priority))

    # Apply tag filter (tasks that have any of the specified tags)
    if params.tag_ids and len(params.tag_ids) > 0:
        # Subquery to find tasks with matching tags
        tag_subquery = (
            select(TodoTag.todo_id)
            .where(TodoTag.tag_id.in_(params.tag_ids))
            .distinct()
        )
        query = query.where(Task.id.in_(tag_subquery))

    # Apply due date range filters (if due_date field exists)
    # Note: These filters will be used when due_date is added in Phase 5
    # For now, they're prepared but won't match anything
    if params.due_date_from:
        try:
            due_from = datetime.fromisoformat(params.due_date_from).date()
            # This will work once due_date field is added to Task model
            if hasattr(Task, 'due_date'):
                query = query.where(Task.due_date >= due_from)
        except ValueError:
            pass  # Invalid date format, skip filter

    if params.due_date_to:
        try:
            due_to = datetime.fromisoformat(params.due_date_to).date()
            # This will work once due_date field is added to Task model
            if hasattr(Task, 'due_date'):
                query = query.where(Task.due_date <= due_to)
        except ValueError:
            pass  # Invalid date format, skip filter

    # Apply sorting
    if params.sort_by == 'created_at':
        sort_column = Task.created_at
    elif params.sort_by == 'title':
        sort_column = Task.title
    elif params.sort_by == 'priority':
        sort_column = Task.priority
    elif params.sort_by == 'due_date':
        # This will work once due_date field is added to Task model
        if hasattr(Task, 'due_date'):
            sort_column = Task.due_date
        else:
            sort_column = Task.created_at  # Fallback
    else:
        sort_column = Task.created_at

    if params.sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    # Apply pagination
    query = query.offset(params.offset).limit(params.limit)

    # Execute query
    result = await db.execute(query)
    tasks = result.scalars().all()

    task_responses = []
    for task in tasks:
        tags = await get_task_tags(db, task.id)
        task_responses.append(_build_task_response(task, tags))

    return task_responses


async def get_task_tags(db: AsyncSession, task_id: UUID) -> List[TagSummary]:
    """
    Retrieve all tags associated with a task.

    Args:
        db: Database session
        task_id: Task unique identifier

    Returns:
        List of TagSummary objects
    """
    result = await db.execute(
        select(Tag)
        .join(TodoTag, Tag.id == TodoTag.tag_id)
        .where(TodoTag.todo_id == task_id)
    )
    tags = result.scalars().all()

    return [
        TagSummary(id=tag.id, name=tag.name, color=tag.color)
        for tag in tags
    ]


async def create_task(db: AsyncSession, user_id: str, task_data: TaskCreate) -> TaskResponse:
    """
    Create a new task for a specific user with tags and optional due date/reminder.

    Args:
        db: Database session
        user_id: User identifier to assign task to
        task_data: Task creation data (title, description, priority, tag_ids, due_date, remind_at)

    Returns:
        Created TaskResponse object with tags populated
    """
    # Parse due_date and remind_at if provided
    due_date_obj = None
    remind_at_obj = None

    if task_data.due_date:
        try:
            due_date_obj = date.fromisoformat(task_data.due_date)
        except ValueError:
            logger.warning(f"Invalid due_date format: {task_data.due_date}")

    if task_data.remind_at:
        try:
            remind_at_obj = datetime.fromisoformat(task_data.remind_at)
        except ValueError:
            logger.warning(f"Invalid remind_at format: {task_data.remind_at}")

    # Create task with recurrence fields
    recurrence_pattern = RecurrencePattern(task_data.recurrence_pattern) if task_data.recurrence_pattern else RecurrencePattern.NONE
    recurrence_interval = task_data.recurrence_interval if task_data.recurrence_interval else 1

    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        completed=False,
        status=TaskStatus.PENDING,
        priority=TaskPriority(task_data.priority),
        due_date=due_date_obj,
        remind_at=remind_at_obj,
        recurrence_pattern=recurrence_pattern,
        recurrence_interval=recurrence_interval,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Associate tags
    if task_data.tag_ids:
        for tag_id in task_data.tag_ids:
            # Verify tag belongs to user
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
            )
            tag = tag_result.scalar_one_or_none()
            if tag:
                todo_tag = TodoTag(todo_id=task.id, tag_id=tag_id)
                db.add(todo_tag)

        await db.commit()

    # Publish reminder event if due_date and remind_at are set
    if task.due_date and task.remind_at:
        try:
            await publish_reminder_event(task, user_id)
            logger.info(f"Published reminder event for task {task.id}")
        except Exception as e:
            logger.error(f"Failed to publish reminder event for task {task.id}: {str(e)}")
            # Don't fail task creation if event publishing fails

    # Publish task event and task update event
    try:
        await publish_task_event("created", task, user_id)
        await publish_task_update_event("created", task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish events for new task {task.id}: {str(e)}")

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)


async def get_task_by_id(db: AsyncSession, user_id: str, task_id: UUID) -> Optional[TaskResponse]:
    """
    Retrieve a specific task by ID for a specific user with tags.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        task_id: Task unique identifier

    Returns:
        TaskResponse object if found and belongs to user, None otherwise
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)


async def update_task(db: AsyncSession, user_id: str, task_id: UUID, task_data: TaskUpdate) -> Optional[TaskResponse]:
    """
    Update an existing task for a specific user with tag associations and due date/reminder.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        task_id: Task unique identifier
        task_data: Task update data (title, description, completed, priority, tag_ids, due_date, remind_at)

    Returns:
        Updated TaskResponse object if found and belongs to user, None otherwise
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    due_date_changed = False
    remind_at_changed = False
    fields_set = getattr(task_data, '__pydantic_fields_set__', set())

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed
        task.status = TaskStatus.COMPLETED if task_data.completed else TaskStatus.PENDING
        if task_data.completed and not task.completed_at:
            task.completed_at = datetime.utcnow()
        elif not task_data.completed:
            task.completed_at = None
    if task_data.priority is not None:
        task.priority = TaskPriority(task_data.priority)

    # Handle due_date
    if 'due_date' in fields_set:
        if task_data.due_date is None:
            if task.due_date is not None:
                task.due_date = None
                due_date_changed = True
        else:
            try:
                new_due_date = date.fromisoformat(task_data.due_date)
                if task.due_date != new_due_date:
                    task.due_date = new_due_date
                    due_date_changed = True
            except ValueError:
                logger.warning(f"Invalid due_date format: {task_data.due_date}")

    # Handle remind_at
    if 'remind_at' in fields_set:
        if task_data.remind_at is None:
            if task.remind_at is not None:
                task.remind_at = None
                remind_at_changed = True
        else:
            try:
                new_remind_at = datetime.fromisoformat(task_data.remind_at)
                if task.remind_at != new_remind_at:
                    task.remind_at = new_remind_at
                    remind_at_changed = True
            except ValueError:
                logger.warning(f"Invalid remind_at format: {task_data.remind_at}")

    # Handle recurrence fields
    if task_data.recurrence_pattern is not None:
        task.recurrence_pattern = RecurrencePattern(task_data.recurrence_pattern)
    if task_data.recurrence_interval is not None:
        task.recurrence_interval = task_data.recurrence_interval

    task.updated_at = datetime.utcnow()
    await db.commit()

    # Update tag associations if provided
    if task_data.tag_ids is not None:
        await db.execute(delete(TodoTag).where(TodoTag.todo_id == task_id))
        for tag_id in task_data.tag_ids:
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
            )
            tag = tag_result.scalar_one_or_none()
            if tag:
                db.add(TodoTag(todo_id=task_id, tag_id=tag_id))
        await db.commit()

    # Publish reminder event if due_date or remind_at changed and both are set
    if (due_date_changed or remind_at_changed) and task.due_date and task.remind_at:
        try:
            await publish_reminder_event(task, user_id)
        except Exception as e:
            logger.error(f"Failed to publish reminder event for task {task.id}: {str(e)}")

    await db.refresh(task)

    # Publish update events
    try:
        await publish_task_event("updated", task, user_id)
        await publish_task_update_event("updated", task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish update events for task {task.id}: {str(e)}")

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)


async def delete_task(db: AsyncSession, user_id: str, task_id: UUID) -> bool:
    """
    Soft-delete a task for a specific user by setting deleted_at.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        task_id: Task unique identifier

    Returns:
        True if task was deleted, False if not found or doesn't belong to user
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return False

    task.deleted_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()
    await db.commit()

    # Publish delete events
    try:
        await publish_task_event("deleted", task, user_id)
        await publish_task_update_event("deleted", task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish delete events for task {task.id}: {str(e)}")

    return True


async def toggle_task_completion(db: AsyncSession, user_id: str, task_id: UUID) -> Optional[TaskResponse]:
    """Toggle the completion status of a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    task.completed = not task.completed
    task.status = TaskStatus.COMPLETED if task.completed else TaskStatus.PENDING

    if task.completed and not task.completed_at:
        task.completed_at = datetime.utcnow()
    elif not task.completed:
        task.completed_at = None

    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    event_type = "completed" if task.completed else "updated"
    try:
        await publish_task_event(event_type, task, user_id)
        await publish_task_update_event(event_type, task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish completion events for task {task.id}: {str(e)}")

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)


async def complete_task(db: AsyncSession, user_id: str, task_id: UUID) -> Optional[TaskResponse]:
    """
    Mark a task as complete. Publishes a 'completed' TaskEvent which triggers
    the Recurring Task Service to create the next occurrence if applicable.
    """
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    task.completed = True
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.utcnow()

    # Calculate next_occurrence for recurring tasks
    if task.recurrence_pattern != RecurrencePattern.NONE:
        base = task.due_date or date.today()
        task.next_occurrence = _calculate_next_occurrence(
            base, task.recurrence_pattern, task.recurrence_interval or 1
        )

    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    # Publish completed event (consumed by Recurring Task Service and Audit Service)
    try:
        await publish_task_event("completed", task, user_id)
        await publish_task_update_event("completed", task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish completed events for task {task.id}: {str(e)}")

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)


async def incomplete_task(db: AsyncSession, user_id: str, task_id: UUID) -> Optional[TaskResponse]:
    """Mark a task as incomplete (revert completion)."""
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id, Task.deleted_at.is_(None))
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    task.completed = False
    task.status = TaskStatus.PENDING
    task.completed_at = None
    task.next_occurrence = None
    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    try:
        await publish_task_event("updated", task, user_id)
        await publish_task_update_event("updated", task, user_id)
    except Exception as e:
        logger.error(f"Failed to publish incomplete events for task {task.id}: {str(e)}")

    tags = await get_task_tags(db, task.id)
    return _build_task_response(task, tags)

