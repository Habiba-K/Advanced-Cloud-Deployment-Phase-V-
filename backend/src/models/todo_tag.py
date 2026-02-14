from uuid import UUID
from sqlmodel import Field, SQLModel


class TodoTag(SQLModel, table=True):
    """
    Junction table for many-to-many relationship between tasks and tags.

    Attributes:
        todo_id: Foreign key to tasks.id (CASCADE on delete)
        tag_id: Foreign key to tags.id (CASCADE on delete)
    """
    __tablename__ = "todo_tags"

    todo_id: UUID = Field(foreign_key="tasks.id", primary_key=True, ondelete="CASCADE")
    tag_id: UUID = Field(foreign_key="tags.id", primary_key=True, ondelete="CASCADE")
