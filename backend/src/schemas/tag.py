from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, validator
import re


class TagCreate(BaseModel):
    """
    Schema for creating a new tag.

    Attributes:
        name: Tag name (required, 1-100 chars, unique per user)
        color: Hex color code (default: #6B7280)
    """
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6B7280", pattern="^#[0-9a-fA-F]{6}$")

    @validator('name')
    def name_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Tag name cannot be empty or only whitespace')
        return v.strip()

    @validator('color')
    def validate_color(cls, v):
        if not re.match(r'^#[0-9a-fA-F]{6}$', v):
            raise ValueError('Color must be a valid hex color code (e.g., #FF5733)')
        return v


class TagUpdate(BaseModel):
    """
    Schema for updating an existing tag.
    All fields are optional for partial updates.

    Attributes:
        name: Updated tag name (1-100 chars)
        color: Updated hex color code
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern="^#[0-9a-fA-F]{6}$")

    @validator('name')
    def name_not_empty(cls, v):
        if v is not None and (not v or not v.strip()):
            raise ValueError('Tag name cannot be empty or only whitespace')
        return v.strip() if v else v

    @validator('color')
    def validate_color(cls, v):
        if v is not None and not re.match(r'^#[0-9a-fA-F]{6}$', v):
            raise ValueError('Color must be a valid hex color code (e.g., #FF5733)')
        return v


class TagResponse(BaseModel):
    """
    Schema for tag responses (read operations).
    Includes all fields including read-only ones.

    Attributes:
        id: Tag unique identifier
        user_id: Tag owner identifier
        name: Tag name
        color: Hex color code
        created_at: Creation timestamp
        task_count: Number of tasks using this tag
    """
    id: UUID
    user_id: str
    name: str
    color: str
    created_at: datetime
    task_count: int = 0

    class Config:
        from_attributes = True  # Allow conversion from SQLModel objects
