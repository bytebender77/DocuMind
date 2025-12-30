"""
User routes for authenticated endpoints.
"""
from fastapi import APIRouter, Depends
from app.db.models import User
from app.db.schemas import UserResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.
    Protected route that requires valid JWT token.
    
    Args:
        current_user: Current authenticated user (from dependency)
        
    Returns:
        Current user information
    """
    return current_user

