from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.db import get_session
from app.core.security import get_current_user
from app.models import (
    User,
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectRead,
    ProjectListItem,
)

router = APIRouter()


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new project for the current user."""
    project = Project(
        name=project_data.name,
        user_id=current_user.id,
        diagram_data=project_data.diagram_data,
        meta_data=project_data.meta_data or {},
        region=project_data.region or "us-east-1",
        terraform_version=project_data.terraform_version or "1.5.0"
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    return project


@router.get("/", response_model=List[ProjectListItem])
async def list_projects(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all projects for the current user."""
    statement = select(Project).where(Project.user_id == current_user.id).order_by(Project.updated_at.desc())
    projects = session.exec(statement).all()
    return projects


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project by ID."""
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project"
        )

    return project


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Update a project."""
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this project"
        )

    # Update only provided fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.diagram_data is not None:
        project.diagram_data = project_data.diagram_data
    if project_data.meta_data is not None:
        project.meta_data = project_data.meta_data
    if project_data.region is not None:
        project.region = project_data.region
    if project_data.terraform_version is not None:
        project.terraform_version = project_data.terraform_version

    project.updated_at = datetime.utcnow()

    session.add(project)
    session.commit()
    session.refresh(project)

    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a project."""
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project"
        )

    session.delete(project)
    session.commit()

    return None
