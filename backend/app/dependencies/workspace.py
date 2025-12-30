"""
Workspace ownership validation dependencies.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models import User, Workspace
from app.dependencies.auth import get_current_user


async def verify_workspace_ownership(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Workspace:
    """
    Verify that the current user owns the specified workspace.
    
    Args:
        workspace_id: UUID of the workspace to verify
        current_user: Current authenticated user (from dependency)
        db: Database session
        
    Returns:
        Workspace object if ownership is verified
        
    Raises:
        HTTPException: If workspace not found or user doesn't own it
    """
    workspace = db.query(Workspace).filter(
        Workspace.id == workspace_id,
        Workspace.user_id == current_user.id
    ).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or you don't have access to it"
        )
    
    return workspace

