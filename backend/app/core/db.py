from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import inspect, text
from app.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=True)

def migrate_schema(engine):
    """Add missing columns to existing tables.

    This function handles schema migrations for when new columns are added
    to models but the database tables already exist. SQLModel's create_all()
    doesn't alter existing tables, so we need to do it manually.
    """
    inspector = inspect(engine)

    # Check if project table exists
    if not inspector.has_table('project'):
        # Table doesn't exist yet, create_all will handle it
        return

    # Get existing columns in the project table
    columns = [col['name'] for col in inspector.get_columns('project')]

    with engine.begin() as conn:
        # Add region column if missing
        if 'region' not in columns:
            print("Adding 'region' column to project table...")
            conn.execute(text("ALTER TABLE project ADD COLUMN region VARCHAR DEFAULT 'us-east-1'"))

        # Add terraform_version column if missing
        if 'terraform_version' not in columns:
            print("Adding 'terraform_version' column to project table...")
            conn.execute(text("ALTER TABLE project ADD COLUMN terraform_version VARCHAR DEFAULT '1.5.0'"))

def init_db():
    """Create all tables and run migrations."""
    # First, create any new tables
    SQLModel.metadata.create_all(engine)

    # Then, run migrations to add missing columns to existing tables
    migrate_schema(engine)

def get_session():
    """Dependency that provides a database session."""
    with Session(engine) as session:
        yield session
