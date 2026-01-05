from typing import Optional, Dict, Any, List
from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import JSON
from datetime import datetime


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)


class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to projects
    projects: List["Project"] = Relationship(back_populates="user")


class UserCreate(SQLModel):
    email: str
    password: str


class UserRead(SQLModel):
    id: int
    email: str


class ProjectBase(SQLModel):
    name: str


class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    diagram_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    meta_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    region: str = Field(default="us-east-1")
    terraform_version: str = Field(default="1.5.0")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to user
    user: Optional[User] = Relationship(back_populates="projects")


class ProjectCreate(SQLModel):
    name: str
    diagram_data: Dict[str, Any]  # nodes and edges
    meta_data: Optional[Dict[str, Any]] = None
    region: Optional[str] = "us-east-1"
    terraform_version: Optional[str] = "1.5.0"


class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    diagram_data: Optional[Dict[str, Any]] = None
    meta_data: Optional[Dict[str, Any]] = None
    region: Optional[str] = None
    terraform_version: Optional[str] = None


class ProjectRead(SQLModel):
    id: int
    name: str
    diagram_data: Dict[str, Any]
    meta_data: Dict[str, Any]
    region: str
    terraform_version: str
    created_at: datetime
    updated_at: datetime


class ProjectListItem(SQLModel):
    id: int
    name: str
    created_at: datetime
    updated_at: datetime


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(SQLModel):
    user_id: Optional[int] = None
