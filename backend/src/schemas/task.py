from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, validator, model_validator


class TagSummary(BaseModel):
    """
    Summary schema for tags in task responses.

    Attributes:
        id: Tag unique identifier
        name: Tag name
        color: Hex color code
    """
    id: UUID
    name: str
    color: str

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    """
    Schema for creating a new task.

    Attributes:
        title: Task title (required, 1-500 chars)
        description: Optional task description (max 5000 chars)
        priority: Task priority (low, medium, high, default: medium)
        tag_ids: List of tag IDs to associate with the task
        due_date: Optional due date for the task (ISO date string)
        remind_at: Optional reminder datetime (ISO datetime string)
    """
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    tag_ids: List[UUID] = Field(default_factory=list)
    due_date: Optional[str] = Field(None, description="Due date in ISO format (YYYY-MM-DD)")
    remind_at: Optional[str] = Field(None, description="Reminder datetime in ISO format")

    @validator('title')
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty or only whitespace')
        return v.strip()

    @validator('priority')
    def validate_priority(cls, v):
        if v not in ['low', 'medium', 'high']:
            raise ValueError('Priority must be one of: low, medium, high')
        return v

    @validator('due_date')
    def validate_due_date(cls, v):
        if v is not None:
            try:
                date.fromisoformat(v)
            except ValueError:
                raise ValueError('due_date must be in ISO format (YYYY-MM-DD)')
        return v

    @validator('remind_at')
    def validate_remind_at(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('remind_at must be in ISO datetime format')
        return v

    @model_validator(mode='after')
    def validate_reminder_before_due(self):
        if self.due_date and self.remind_at:
            try:
                due_date_obj = date.fromisoformat(self.due_date)
                remind_at_obj = datetime.fromisoformat(self.remind_at)

                # Convert due_date to datetime at end of day for comparison
                due_datetime = datetime.combine(due_date_obj, datetime.max.time())

                if remind_at_obj >= due_datetime:
                    raise ValueError('remind_at must be before due_date')
            except ValueError as e:
                if 'remind_at must be before due_date' in str(e):
                    raise

        return self


class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task.
    All fields are optional for partial updates.

    Attributes:
        title: Updated task title (1-500 chars)
        description: Updated task description (max 5000 chars)
        completed: Updated completion status
        priority: Updated task priority (low, medium, high)
        tag_ids: Updated list of tag IDs
        due_date: Updated due date (ISO date string)
        remind_at: Updated reminder datetime (ISO datetime string)
    """
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, max_length=5000)
    completed: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    tag_ids: Optional[List[UUID]] = None
    due_date: Optional[str] = Field(None, description="Due date in ISO format (YYYY-MM-DD)")
    remind_at: Optional[str] = Field(None, description="Reminder datetime in ISO format")

    @validator('title')
    def title_not_empty(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Title cannot be empty or only whitespace')
        return v.strip() if v else v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None and v not in ['low', 'medium', 'high']:
            raise ValueError('Priority must be one of: low, medium, high')
        return v

    @validator('due_date')
    def validate_due_date(cls, v):
        if v is not None:
            try:
                date.fromisoformat(v)
            except ValueError:
                raise ValueError('due_date must be in ISO format (YYYY-MM-DD)')
        return v

    @validator('remind_at')
    def validate_remind_at(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('remind_at must be in ISO datetime format')
        return v

    @model_validator(mode='after')
    def validate_reminder_before_due(self):
        if self.due_date and self.remind_at:
            try:
                due_date_obj = date.fromisoformat(self.due_date)
                remind_at_obj = datetime.fromisoformat(self.remind_at)

                # Convert due_date to datetime at end of day for comparison
                due_datetime = datetime.combine(due_date_obj, datetime.max.time())

                if remind_at_obj >= due_datetime:
                    raise ValueError('remind_at must be before due_date')
            except ValueError as e:
                if 'remind_at must be before due_date' in str(e):
                    raise

        return self


class TaskResponse(BaseModel):
    """
    Schema for task responses (read operations).
    Includes all fields including read-only ones.

    Attributes:
        id: Task unique identifier
        user_id: Task owner identifier
        title: Task title
        description: Task description (optional)
        completed: Completion status (boolean)
        status: Task status enum (pending, completed)
        priority: Task priority (low, medium, high)
        tags: List of associated tags
        due_date: Optional due date
        remind_at: Optional reminder datetime
        completed_at: Optional completion timestamp
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """
    id: UUID
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    status: str  # 'pending' or 'completed'
    priority: str
    tags: List[TagSummary] = Field(default_factory=list)
    due_date: Optional[date] = None
    remind_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allow conversion from SQLModel objects


class TaskListParams(BaseModel):
    """
    Schema for task list query parameters (search, filter, sort, pagination).

    Attributes:
        search: Text search across title and description (optional)
        status: Filter by completion status (optional)
        priority: Filter by priority level (optional)
        tag_ids: Filter by tag IDs (optional, multiple allowed)
        due_date_from: Filter tasks due on or after this date (optional)
        due_date_to: Filter tasks due on or before this date (optional)
        sort_by: Field to sort by (default: created_at)
        sort_order: Sort order (asc/desc, default: desc)
        limit: Maximum number of results (default: 50, max: 100)
        offset: Number of results to skip (default: 0)
    """
    search: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(pending|completed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high)$")
    tag_ids: Optional[List[UUID]] = None
    due_date_from: Optional[str] = None  # ISO date string
    due_date_to: Optional[str] = None  # ISO date string
    sort_by: str = Field(default="created_at", pattern="^(created_at|due_date|priority|title)$")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

    @validator('status')
    def validate_status(cls, v):
        if v is not None and v not in ['pending', 'completed']:
            raise ValueError('Status must be one of: pending, completed')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None and v not in ['low', 'medium', 'high']:
            raise ValueError('Priority must be one of: low, medium, high')
        return v

    @validator('sort_by')
    def validate_sort_by(cls, v):
        if v not in ['created_at', 'due_date', 'priority', 'title']:
            raise ValueError('sort_by must be one of: created_at, due_date, priority, title')
        return v

    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be one of: asc, desc')
        return v
