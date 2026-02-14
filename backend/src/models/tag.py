from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, UniqueConstraint


class Tag(SQLModel, table=True):
    """
    Tag entity for task categorization.

    Attributes:
        id: Unique identifier (UUID)
        user_id: Owner identifier (string, references user)
        name: Tag name (required, max 100 chars, unique per user)
        color: Hex color code (default: #6B7280)
        created_at: Creation timestamp (UTC)
    """
    __tablename__ = "tags"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_tag_name"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: str = Field(max_length=255, index=True)
    name: str = Field(max_length=100)
    color: str = Field(default="#6B7280", max_length=7)
    created_at: datetime = Field(default_factory=datetime.utcnow)
