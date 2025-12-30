"""
Workspace routes for workspace management.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User, Workspace
from app.db.schemas import WorkspaceResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("/", response_model=List[WorkspaceResponse])
async def get_user_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all workspaces for the current authenticated user.
    
    Args:
        current_user: Current authenticated user (from dependency)
        db: Database session
        
    Returns:
        List of user's workspaces
    """
    workspaces = db.query(Workspace).filter(Workspace.user_id == current_user.id).all()
    return workspaces

