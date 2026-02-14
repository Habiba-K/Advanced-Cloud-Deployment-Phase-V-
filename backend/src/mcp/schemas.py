"""
MCP Tool Schemas

This module defines Pydantic schemas for MCP tool inputs and outputs.
All tools follow a consistent schema pattern with validation rules.

Schema Design:
- Input schemas validate tool parameters before execution
- Output schemas ensure consistent response structure
- All schemas include proper validation (required fields, types, constraints)
- Error responses follow a standard format
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from uuid import UUID


# ============================================================================
# Input Schemas
# ============================================================================

class AddTaskInput(BaseModel):
    """Input schema for add_task tool."""
    user_id: str = Field(..., description="User identifier")
    title: str = Field(..., min_length=1, max_length=500, description="Task title")
    description: Optional[str] = Field(None, max_length=5000, description="Task description")
    priority: Optional[str] = Field("medium", description="Task priority: 'low', 'medium', or 'high'")
    due_date: Optional[str] = Field(None, description="Due date in ISO format (YYYY-MM-DD)")
    remind_at: Optional[str] = Field(None, description="Reminder datetime in ISO format")

    @validator('priority')
    def validate_priority(cls, v):
        if v and v not in ['low', 'medium', 'high']:
            raise ValueError("priority must be 'low', 'medium', or 'high'")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
                "priority": "medium",
                "due_date": "2026-02-15"
            }
        }


class ListTasksInput(BaseModel):
    """Input schema for list_tasks tool."""
    user_id: str = Field(..., description="User identifier")
    status: Optional[str] = Field("all", description="Filter by status: 'all', 'pending', or 'completed'")

    @validator('status')
    def validate_status(cls, v):
        if v not in ['all', 'pending', 'completed']:
            raise ValueError("status must be 'all', 'pending', or 'completed'")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "status": "pending"
            }
        }


class GetTaskInput(BaseModel):
    """Input schema for get_task tool."""
    user_id: str = Field(..., description="User identifier")
    task_id: str = Field(..., description="Task UUID")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "task_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class UpdateTaskInput(BaseModel):
    """Input schema for update_task tool."""
    user_id: str = Field(..., description="User identifier")
    task_id: str = Field(..., description="Task UUID")
    title: Optional[str] = Field(None, max_length=500, description="New task title")
    description: Optional[str] = Field(None, max_length=5000, description="New task description")
    priority: Optional[str] = Field(None, description="Task priority: 'low', 'medium', or 'high'")
    due_date: Optional[str] = Field(None, description="Due date in ISO format (YYYY-MM-DD)")
    remind_at: Optional[str] = Field(None, description="Reminder datetime in ISO format")

    @validator('priority')
    def validate_priority(cls, v):
        if v and v not in ['low', 'medium', 'high']:
            raise ValueError("priority must be 'low', 'medium', or 'high'")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "task_id": "550e8400-e29b-41d4-a716-446655440000",
                "title": "Buy groceries and fruits",
                "due_date": "2026-02-15"
            }
        }


class CompleteTaskInput(BaseModel):
    """Input schema for complete_task tool."""
    user_id: str = Field(..., description="User identifier")
    task_id: str = Field(..., description="Task UUID")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "task_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class DeleteTaskInput(BaseModel):
    """Input schema for delete_task tool."""
    user_id: str = Field(..., description="User identifier")
    task_id: str = Field(..., description="Task UUID")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "task_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


# ============================================================================
# Output Schemas
# ============================================================================

class TaskData(BaseModel):
    """Task data structure for responses."""
    id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: str
    updated_at: str


class TaskResponse(BaseModel):
    """Standard response for single task operations."""
    task_id: str = Field(..., description="Task UUID")
    status: Literal["created", "updated", "completed", "deleted"] = Field(..., description="Operation status")
    title: str = Field(..., description="Task title")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "created",
                "title": "Buy groceries"
            }
        }


class TaskListResponse(BaseModel):
    """Response for list_tasks operation."""
    tasks: List[TaskData] = Field(..., description="List of tasks")
    count: int = Field(..., description="Number of tasks returned")

    class Config:
        json_schema_extra = {
            "example": {
                "tasks": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "Buy groceries",
                        "description": "Milk, eggs, bread",
                        "completed": False,
                        "created_at": "2026-01-29T10:00:00Z",
                        "updated_at": "2026-01-29T10:00:00Z"
                    }
                ],
                "count": 1
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    status: Literal["error"] = "error"
    error: dict = Field(..., description="Error details")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "error",
                "error": {
                    "type": "not_found",
                    "message": "Task not found"
                }
            }
        }


# ============================================================================
# JSON Schema Definitions for MCP/Groq
# ============================================================================

def get_tool_parameter_schemas():
    """
    Get JSON Schema definitions for all tools.

    These schemas are used by the MCP server and Groq agent
    to understand tool parameters and validate inputs.

    NOTE: user_id is NOT included in these schemas because it's automatically
    injected by the backend from the authenticated session. The AI agent
    should not need to know or provide the user_id.

    Returns:
        Dictionary mapping tool names to their parameter schemas
    """
    return {
        "add_task": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Task title (1-500 characters)",
                    "minLength": 1,
                    "maxLength": 500
                },
                "description": {
                    "type": "string",
                    "description": "Task description (optional, max 5000 characters)",
                    "maxLength": 5000
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "Task priority level (default: medium)",
                    "default": "medium"
                },
                "due_date": {
                    "type": "string",
                    "description": "Due date in ISO format YYYY-MM-DD (optional)",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                },
                "remind_at": {
                    "type": "string",
                    "description": "Reminder datetime in ISO format (optional)",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?$"
                }
            },
            "required": ["title"]
        },
        "list_tasks": {
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                    "enum": ["all", "pending", "completed"],
                    "description": "Filter by status: 'all' shows all tasks, 'pending' shows incomplete tasks, 'completed' shows finished tasks (default: all)",
                    "default": "all"
                }
            },
            "required": []
        },
        "get_task": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "Task UUID to retrieve"
                }
            },
            "required": ["task_id"]
        },
        "update_task": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "Task UUID to update"
                },
                "title": {
                    "type": "string",
                    "description": "New task title (optional)",
                    "maxLength": 500
                },
                "description": {
                    "type": "string",
                    "description": "New task description (optional)",
                    "maxLength": 5000
                },
                "priority": {
                    "type": "string",
                    "enum": ["low", "medium", "high"],
                    "description": "New task priority level (optional)"
                },
                "due_date": {
                    "type": "string",
                    "description": "New due date in ISO format YYYY-MM-DD (optional)",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
                },
                "remind_at": {
                    "type": "string",
                    "description": "New reminder datetime in ISO format (optional)",
                    "pattern": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?$"
                }
            },
            "required": ["task_id"]
        },
        "complete_task": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "Task UUID to mark as complete"
                }
            },
            "required": ["task_id"]
        },
        "delete_task": {
            "type": "object",
            "properties": {
                "task_id": {
                    "type": "string",
                    "description": "Task UUID to delete"
                }
            },
            "required": ["task_id"]
        }
    }
