"""
MCP Tool Implementations

This module implements all MCP tools for task management operations.
Each tool wraps existing task_service functions and provides:
- Input validation using Pydantic schemas
- User ownership validation
- Structured response formatting
- Error handling

Architecture:
- Tools are stateless and database-backed
- All tools require user_id for ownership validation
- Tools contain NO conversational logic
- Tools return structured responses (task_id, status, data)
"""

from typing import Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError
import logging

from src.services import task_service
from src.schemas.task import TaskCreate, TaskUpdate
from src.mcp.schemas import (
    AddTaskInput,
    ListTasksInput,
    GetTaskInput,
    UpdateTaskInput,
    CompleteTaskInput,
    DeleteTaskInput,
    get_tool_parameter_schemas
)

logger = logging.getLogger(__name__)


# ============================================================================
# Helper Functions
# ============================================================================

def task_to_dict(task) -> Dict[str, Any]:
    """
    Convert Task model to dictionary for tool output.

    Args:
        task: Task SQLModel instance

    Returns:
        Dictionary with task data
    """
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat()
    }


# ============================================================================
# Tool Implementations
# ============================================================================

async def add_task_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Create a new task for the user.

    Args:
        arguments: Tool arguments (title, description, priority, due_date, remind_at)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        Structured response with task_id, status, and title
    """
    try:
        # Validate input
        input_data = AddTaskInput(**arguments, user_id=user_id)

        # Create task via service
        task_data = TaskCreate(
            title=input_data.title,
            description=input_data.description,
            priority=input_data.priority or "medium",
            due_date=input_data.due_date,
            remind_at=input_data.remind_at
        )
        task = await task_service.create_task(db, user_id, task_data)

        # Return structured response
        return {
            "task_id": str(task.id),
            "status": "created",
            "title": task.title
        }

    except ValidationError as e:
        logger.error(f"Validation error in add_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except Exception as e:
        logger.error(f"Error in add_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


async def list_tasks_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    List user's tasks with optional status filtering.

    Args:
        arguments: Tool arguments (status filter)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        List of tasks with count
    """
    try:
        # Handle None or empty arguments
        if arguments is None:
            arguments = {}

        # Validate input
        input_data = ListTasksInput(**arguments, user_id=user_id)

        # Get tasks via service
        tasks = await task_service.get_user_tasks(db, user_id)

        # Apply status filter
        if input_data.status == "pending":
            tasks = [t for t in tasks if not t.completed]
        elif input_data.status == "completed":
            tasks = [t for t in tasks if t.completed]

        # Return structured response
        return {
            "tasks": [task_to_dict(t) for t in tasks],
            "count": len(tasks)
        }

    except ValidationError as e:
        logger.error(f"Validation error in list_tasks: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except Exception as e:
        logger.error(f"Error in list_tasks: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


async def get_task_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Get a specific task by ID.

    Args:
        arguments: Tool arguments (task_id)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        Task data or error
    """
    try:
        # Validate input
        input_data = GetTaskInput(**arguments, user_id=user_id)

        # Get task via service
        task = await task_service.get_task_by_id(db, user_id, UUID(input_data.task_id))

        if not task:
            return {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }

        # Return task data
        return task_to_dict(task)

    except ValidationError as e:
        logger.error(f"Validation error in get_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except ValueError as e:
        logger.error(f"Invalid UUID in get_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": "Invalid task ID format"
            }
        }
    except Exception as e:
        logger.error(f"Error in get_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


async def update_task_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Update a task's title, description, priority, due_date, or remind_at.

    Args:
        arguments: Tool arguments (task_id, title, description, priority, due_date, remind_at)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        Structured response with task_id, status, and title
    """
    try:
        # Validate input
        input_data = UpdateTaskInput(**arguments, user_id=user_id)

        # Update task via service
        task_data = TaskUpdate(
            title=input_data.title,
            description=input_data.description,
            priority=input_data.priority,
            due_date=input_data.due_date,
            remind_at=input_data.remind_at
        )
        task = await task_service.update_task(db, user_id, UUID(input_data.task_id), task_data)

        if not task:
            return {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }

        # Return structured response
        return {
            "task_id": str(task.id),
            "status": "updated",
            "title": task.title
        }

    except ValidationError as e:
        logger.error(f"Validation error in update_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except ValueError as e:
        logger.error(f"Invalid UUID in update_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": "Invalid task ID format"
            }
        }
    except Exception as e:
        logger.error(f"Error in update_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


async def complete_task_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Mark a task as complete.

    Args:
        arguments: Tool arguments (task_id)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        Structured response with task_id, status, and title
    """
    try:
        # Validate input
        input_data = CompleteTaskInput(**arguments, user_id=user_id)

        # Get task first to check if it exists and is not already completed
        task = await task_service.get_task_by_id(db, user_id, UUID(input_data.task_id))

        if not task:
            return {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }

        # Toggle completion if not already completed
        if not task.completed:
            task = await task_service.toggle_task_completion(db, user_id, UUID(input_data.task_id))

        # Return structured response
        return {
            "task_id": str(task.id),
            "status": "completed",
            "title": task.title
        }

    except ValidationError as e:
        logger.error(f"Validation error in complete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except ValueError as e:
        logger.error(f"Invalid UUID in complete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": "Invalid task ID format"
            }
        }
    except Exception as e:
        logger.error(f"Error in complete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


async def delete_task_tool(arguments: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Delete a task permanently.

    Args:
        arguments: Tool arguments (task_id)
        user_id: Authenticated user ID
        db: Database session

    Returns:
        Structured response with task_id, status, and title
    """
    try:
        # Validate input
        input_data = DeleteTaskInput(**arguments, user_id=user_id)

        # Get task first to get the title before deletion
        task = await task_service.get_task_by_id(db, user_id, UUID(input_data.task_id))

        if not task:
            return {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }

        task_title = task.title

        # Delete task via service
        success = await task_service.delete_task(db, user_id, UUID(input_data.task_id))

        if not success:
            return {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }

        # Return structured response
        return {
            "task_id": input_data.task_id,
            "status": "deleted",
            "title": task_title
        }

    except ValidationError as e:
        logger.error(f"Validation error in delete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": str(e)
            }
        }
    except ValueError as e:
        logger.error(f"Invalid UUID in delete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "validation_error",
                "message": "Invalid task ID format"
            }
        }
    except Exception as e:
        logger.error(f"Error in delete_task: {e}")
        return {
            "status": "error",
            "error": {
                "type": "execution_error",
                "message": str(e)
            }
        }


# ============================================================================
# Tool Registration
# ============================================================================

def register_tools(mcp_server) -> Dict[str, Any]:
    """
    Register all tools with the MCP server.

    Args:
        mcp_server: MCPServer instance

    Returns:
        Dictionary of registered tools
    """
    tool_schemas = get_tool_parameter_schemas()

    # Register add_task
    mcp_server.register_tool(
        name="add_task",
        description="Create a new task with title, description, priority (low/medium/high), due_date (YYYY-MM-DD), and remind_at (ISO datetime). Use this to create brand new tasks.",
        parameters=tool_schemas["add_task"],
        handler=add_task_tool
    )

    # Register list_tasks
    mcp_server.register_tool(
        name="list_tasks",
        description="List user's tasks with optional status filtering (all/pending/completed). Use this to find existing tasks before updating them.",
        parameters=tool_schemas["list_tasks"],
        handler=list_tasks_tool
    )

    # Register get_task
    mcp_server.register_tool(
        name="get_task",
        description="Get a specific task by ID to view its current details",
        parameters=tool_schemas["get_task"],
        handler=get_task_tool
    )

    # Register update_task
    mcp_server.register_tool(
        name="update_task",
        description="Update an existing task's title, description, priority (low/medium/high), due_date (YYYY-MM-DD), or remind_at (ISO datetime). IMPORTANT: Use list_tasks first to find the task_id, then use this tool to update it. Do NOT create a new task if one already exists.",
        parameters=tool_schemas["update_task"],
        handler=update_task_tool
    )

    # Register complete_task
    mcp_server.register_tool(
        name="complete_task",
        description="Mark a task as complete",
        parameters=tool_schemas["complete_task"],
        handler=complete_task_tool
    )

    # Register delete_task
    mcp_server.register_tool(
        name="delete_task",
        description="Delete a task permanently",
        parameters=tool_schemas["delete_task"],
        handler=delete_task_tool
    )

    logger.info("All MCP tools registered successfully")

    return mcp_server.tools
