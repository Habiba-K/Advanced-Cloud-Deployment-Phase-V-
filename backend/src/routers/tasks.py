from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Annotated, Optional
from uuid import UUID

from src.database import get_session
from src.schemas.task import TaskResponse, TaskCreate, TaskUpdate, TaskListParams
from src.services import task_service
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


@router.get("/{user_id}/tasks", response_model=List[TaskResponse])
async def list_user_tasks(
    user_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session),
    search: Optional[str] = Query(None, description="Search text across title and description"),
    status: Optional[str] = Query(None, pattern="^(pending|completed)$", description="Filter by status"),
    priority: Optional[str] = Query(None, pattern="^(low|medium|high)$", description="Filter by priority"),
    tag_ids: Optional[List[UUID]] = Query(None, description="Filter by tag IDs"),
    due_date_from: Optional[str] = Query(None, description="Filter tasks due on or after this date (ISO format)"),
    due_date_to: Optional[str] = Query(None, description="Filter tasks due on or before this date (ISO format)"),
    sort_by: str = Query("created_at", pattern="^(created_at|due_date|priority|title)$", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip")
):
    """
    List tasks for a specific user with search, filter, sort, and pagination.

    Requires valid JWT token. User can only access their own tasks.

    Query Parameters:
        - search: Text search across title and description (case-insensitive)
        - status: Filter by completion status (pending/completed)
        - priority: Filter by priority level (low/medium/high)
        - tag_ids: Filter by tag IDs (can specify multiple)
        - due_date_from: Filter tasks due on or after this date (ISO format)
        - due_date_to: Filter tasks due on or before this date (ISO format)
        - sort_by: Field to sort by (created_at/due_date/priority/title)
        - sort_order: Sort order (asc/desc)
        - limit: Maximum number of results (1-100, default: 50)
        - offset: Number of results to skip (default: 0)

    Args:
        user_id: User identifier from path
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        List of tasks matching the criteria

    Raises:
        HTTPException: 401 if not authenticated, 403 if accessing other user's data, 422 if validation fails
    """
    try:
        # Build TaskListParams from query parameters
        params = TaskListParams(
            search=search,
            status=status,
            priority=priority,
            tag_ids=tag_ids,
            due_date_from=due_date_from,
            due_date_to=due_date_to,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit,
            offset=offset
        )

        # Call list_tasks with parameters
        tasks = await task_service.list_tasks(db, str(authenticated_user_id), params)
        return tasks
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


@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    user_id: UUID,
    task_data: TaskCreate,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Create a new task for a specific user.

    Requires valid JWT token. User can only create tasks for themselves.

    Args:
        user_id: User identifier from path
        task_data: Task creation data (title, description)
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Created task with all fields

    Raises:
        HTTPException: 401 if not authenticated, 403 if creating for other user, 422 if validation fails
    """
    try:
        task = await task_service.create_task(db, str(authenticated_user_id), task_data)
        return task
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


@router.get("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    user_id: UUID,
    task_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Get a specific task by ID for a specific user.

    Requires valid JWT token. User can only access their own tasks.

    Args:
        user_id: User identifier from path
        task_id: Task unique identifier
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Task details if found and belongs to authenticated user

    Raises:
        HTTPException: 401 if not authenticated, 403 if accessing other user's task, 404 if task not found
    """
    task = await task_service.get_task_by_id(db, str(authenticated_user_id), task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return task


@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    user_id: UUID,
    task_id: UUID,
    task_data: TaskUpdate,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Update an existing task for a specific user.

    Requires valid JWT token. User can only update their own tasks.

    Args:
        user_id: User identifier from path
        task_id: Task unique identifier
        task_data: Task update data (title, description, completed)
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Updated task with all fields

    Raises:
        HTTPException: 401 if not authenticated, 403 if updating other user's task, 404 if task not found, 422 if validation fails
    """
    try:
        # Debug logging
        print(f"\n=== UPDATE TASK ROUTER ===")
        print(f"Task ID: {task_id}")
        print(f"Task data received: {task_data}")
        print(f"Task data dict: {task_data.model_dump()}")
        print(f"Fields set: {task_data.__pydantic_fields_set__ if hasattr(task_data, '__pydantic_fields_set__') else 'N/A'}")
        print(f"due_date value: {task_data.due_date}")
        print(f"remind_at value: {task_data.remind_at}")
        print(f"=========================\n")

        task = await task_service.update_task(db, str(authenticated_user_id), task_id, task_data)
        if not task:
            raise HTTPException(
                status_code=404,
                detail="Task not found"
            )
        return task
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


@router.delete("/{user_id}/tasks/{task_id}")
async def delete_task(
    user_id: UUID,
    task_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Delete a task for a specific user.

    Requires valid JWT token. User can only delete their own tasks.

    Args:
        user_id: User identifier from path
        task_id: Task unique identifier
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Success message

    Raises:
        HTTPException: 401 if not authenticated, 403 if deleting other user's task, 404 if task not found
    """
    success = await task_service.delete_task(db, str(authenticated_user_id), task_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_completion(
    user_id: UUID,
    task_id: UUID,
    authenticated_user_id: Annotated[UUID, Depends(verify_ownership)],
    db: AsyncSession = Depends(get_session)
):
    """
    Toggle the completion status of a task.

    Requires valid JWT token. User can only toggle their own tasks.

    Args:
        user_id: User identifier from path
        task_id: Task unique identifier
        authenticated_user_id: Authenticated user ID from JWT
        db: Database session (injected)

    Returns:
        Updated task with toggled completion status

    Raises:
        HTTPException: 401 if not authenticated, 403 if toggling other user's task, 404 if task not found
    """
    task = await task_service.toggle_task_completion(db, str(authenticated_user_id), task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )
    return task

