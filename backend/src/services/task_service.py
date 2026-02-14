from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_, func
from sqlalchemy.orm import selectinload
from src.models.task import Task, TaskPriority, TaskStatus
from src.models.tag import Tag
from src.models.todo_tag import TodoTag
from src.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TagSummary, TaskListParams
from src.services.event_publisher import publish_reminder_event
import logging

logger = logging.getLogger(__name__)


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
        select(Task).where(Task.user_id == user_id)
    )
    tasks = result.scalars().all()

    # Load tags for each task
    task_responses = []
    for task in tasks:
        tags = await get_task_tags(db, task.id)
        task_response = TaskResponse(
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
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
        task_responses.append(task_response)

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
    # Start with base query
    query = select(Task).where(Task.user_id == user_id)

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

    # Load tags for each task
    task_responses = []
    for task in tasks:
        tags = await get_task_tags(db, task.id)
        task_response = TaskResponse(
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
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
        task_responses.append(task_response)

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

    # Create task
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        completed=False,
        status=TaskStatus.PENDING,
        priority=TaskPriority(task_data.priority),
        due_date=due_date_obj,
        remind_at=remind_at_obj
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

    # Load tags and return TaskResponse
    tags = await get_task_tags(db, task.id)
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
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


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
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    # Load tags
    tags = await get_task_tags(db, task.id)
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
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


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
    # Get the raw task object for updates
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    # Track if due_date or remind_at changed
    due_date_changed = False
    remind_at_changed = False

    # Debug logging
    logger.info(f"\n=== UPDATE TASK SERVICE ===")
    logger.info(f"Task ID: {task_id}")
    logger.info(f"Current task.due_date: {task.due_date}")
    logger.info(f"Current task.remind_at: {task.remind_at}")
    logger.info(f"Incoming task_data.due_date: {task_data.due_date}")
    logger.info(f"Incoming task_data.remind_at: {task_data.remind_at}")
    logger.info(f"Has __pydantic_fields_set__: {hasattr(task_data, '__pydantic_fields_set__')}")
    if hasattr(task_data, '__pydantic_fields_set__'):
        logger.info(f"Fields set: {task_data.__pydantic_fields_set__}")
        logger.info(f"'due_date' in fields_set: {'due_date' in task_data.__pydantic_fields_set__}")
        logger.info(f"'remind_at' in fields_set: {'remind_at' in task_data.__pydantic_fields_set__}")

    # Get all fields including those set to None
    update_data = task_data.model_dump(exclude_unset=False)

    # Update only provided fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed
        # Sync status field with completed field
        task.status = TaskStatus.COMPLETED if task_data.completed else TaskStatus.PENDING
        # Set completed_at timestamp when marking as complete
        if task_data.completed and not task.completed_at:
            task.completed_at = datetime.utcnow()
        elif not task_data.completed:
            task.completed_at = None
    if task_data.priority is not None:
        task.priority = TaskPriority(task_data.priority)

    # Handle due_date - check if field was explicitly provided
    # In Pydantic v2, we need to check if the field was set, even if it's None
    if hasattr(task_data, '__pydantic_fields_set__') and 'due_date' in task_data.__pydantic_fields_set__:
        logger.info(f"Processing due_date field...")
        if task_data.due_date is None:
            # Clear the due_date
            logger.info(f"due_date is None, clearing field. Current value: {task.due_date}")
            if task.due_date is not None:
                task.due_date = None
                due_date_changed = True
                logger.info(f"due_date cleared! Changed flag: {due_date_changed}")
            else:
                logger.info(f"due_date was already None, no change needed")
        else:
            try:
                new_due_date = date.fromisoformat(task_data.due_date)
                if task.due_date != new_due_date:
                    task.due_date = new_due_date
                    due_date_changed = True
                    logger.info(f"due_date updated to: {new_due_date}")
            except ValueError:
                logger.warning(f"Invalid due_date format: {task_data.due_date}")
    else:
        logger.info(f"due_date field NOT in __pydantic_fields_set__, skipping")

    # Handle remind_at - check if field was explicitly provided
    if hasattr(task_data, '__pydantic_fields_set__') and 'remind_at' in task_data.__pydantic_fields_set__:
        logger.info(f"Processing remind_at field...")
        if task_data.remind_at is None:
            # Clear the remind_at
            logger.info(f"remind_at is None, clearing field. Current value: {task.remind_at}")
            if task.remind_at is not None:
                task.remind_at = None
                remind_at_changed = True
                logger.info(f"remind_at cleared! Changed flag: {remind_at_changed}")
            else:
                logger.info(f"remind_at was already None, no change needed")
        else:
            try:
                new_remind_at = datetime.fromisoformat(task_data.remind_at)
                if task.remind_at != new_remind_at:
                    task.remind_at = new_remind_at
                    remind_at_changed = True
                    logger.info(f"remind_at updated to: {new_remind_at}")
            except ValueError:
                logger.warning(f"Invalid remind_at format: {task_data.remind_at}")
    else:
        logger.info(f"remind_at field NOT in __pydantic_fields_set__, skipping")

    task.updated_at = datetime.utcnow()
    await db.commit()

    # Update tag associations if provided
    if task_data.tag_ids is not None:
        # Delete existing associations
        await db.execute(
            delete(TodoTag).where(TodoTag.todo_id == task_id)
        )

        # Create new associations
        for tag_id in task_data.tag_ids:
            # Verify tag belongs to user
            tag_result = await db.execute(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
            )
            tag = tag_result.scalar_one_or_none()
            if tag:
                todo_tag = TodoTag(todo_id=task_id, tag_id=tag_id)
                db.add(todo_tag)

        await db.commit()

    # Publish reminder event if due_date or remind_at changed and both are set
    if (due_date_changed or remind_at_changed) and task.due_date and task.remind_at:
        try:
            await publish_reminder_event(task, user_id)
            logger.info(f"Published updated reminder event for task {task.id}")
        except Exception as e:
            logger.error(f"Failed to publish reminder event for task {task.id}: {str(e)}")
            # Don't fail task update if event publishing fails

    await db.refresh(task)

    # Load tags and return TaskResponse
    tags = await get_task_tags(db, task.id)
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
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at
    )


async def delete_task(db: AsyncSession, user_id: str, task_id: UUID) -> bool:
    """
    Delete a task for a specific user.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        task_id: Task unique identifier

    Returns:
        True if task was deleted, False if not found or doesn't belong to user
    """
    # Get the raw Task object (not TaskResponse) for deletion
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        return False

    await db.delete(task)
    await db.commit()
    return True


async def toggle_task_completion(db: AsyncSession, user_id: str, task_id: UUID) -> Optional[TaskResponse]:
    """
    Toggle the completion status of a task.

    Args:
        db: Database session
        user_id: User identifier to enforce ownership
        task_id: Task unique identifier

    Returns:
        Updated TaskResponse object if found and belongs to user, None otherwise
    """
    # Get the raw task object for updates
    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        return None

    # Toggle both completed and status fields in sync
    task.completed = not task.completed
    task.status = TaskStatus.COMPLETED if task.completed else TaskStatus.PENDING

    # Set or clear completed_at timestamp
    if task.completed and not task.completed_at:
        task.completed_at = datetime.utcnow()
    elif not task.completed:
        task.completed_at = None

    task.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    # Load tags and return TaskResponse
    tags = await get_task_tags(db, task.id)
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
        completed_at=task.completed_at,
        created_at=task.created_at,
        updated_at=task.updated_at
    )

