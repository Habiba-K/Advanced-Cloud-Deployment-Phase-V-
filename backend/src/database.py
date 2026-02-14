from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings

# Import all models to register them with SQLModel metadata
# This ensures SQLModel.metadata.create_all() will create all tables
from src.models.user import User
from src.models.task import Task, TaskStatus, TaskPriority
from src.models.conversation import Conversation
from src.models.message import Message
from src.models.tag import Tag
from src.models.todo_tag import TodoTag

# Phase 3+ models will be imported here when created:
# from src.models.audit_log import AuditLog


# Convert postgresql:// to postgresql+asyncpg:// for async support
# Remove sslmode and channel_binding parameters as asyncpg handles SSL differently
database_url = settings.database_url.replace("postgresql://", "postgresql+asyncpg://")
# Remove sslmode and channel_binding parameters if present
if "?" in database_url:
    # Split by ? to separate base URL from parameters
    parts = database_url.split("?")
    base_url = parts[0]
    if len(parts) > 1:
        params = parts[1].split("&")
        # Filter out sslmode and channel_binding parameters (asyncpg doesn't use them)
        filtered_params = [p for p in params if not p.startswith("sslmode=") and not p.startswith("channel_binding=")]
        if filtered_params:
            database_url = base_url + "?" + "&".join(filtered_params)
        else:
            database_url = base_url

# Create async engine for Neon PostgreSQL with connection pooling
# Increased timeout for Neon database wake-up (free tier databases sleep after inactivity)
engine = create_async_engine(
    database_url,
    echo=True,  # Set to False in production
    future=True,
    pool_pre_ping=True,  # Verify connections before using
    connect_args={
        "timeout": 120,  # 2 minutes timeout for sleeping database to wake up
        "command_timeout": 120,
        "server_settings": {
            "application_name": "todo_app_phase5"
        }
    }
)

# Create async session factory
async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """
    Initialize database tables.
    Called on application startup.
    """
    async with engine.begin() as conn:
        # Create all tables defined in SQLModel models
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:
    """
    Dependency for getting async database session.
    Yields a session and ensures it's closed after use.
    """
    async with async_session_maker() as session:
        yield session
