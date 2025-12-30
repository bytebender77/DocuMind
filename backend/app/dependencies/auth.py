"""
Authentication dependencies for protected routes.
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.auth.jwt_handler import verify_token

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials
        db: Database session
        
    Returns:
        Authenticated User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    token_data = verify_token(token, token_type="access")
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(
    http_request: Request,
    db: Session = Depends(get_db)
) -> User | None:
    """
    Dependency to optionally get the current authenticated user from JWT token.
    Returns None if no token is provided or token is invalid.
    Used for endpoints that support both authenticated and public access.
    
    Args:
        request: FastAPI Request object
        db: Database session
        
    Returns:
        Authenticated User object or None
    """
    authorization = http_request.headers.get("Authorization")
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>" format
        if authorization.startswith("Bearer "):
            token = authorization[7:]
        else:
            token = authorization
        
        token_data = verify_token(token, token_type="access")
        
        if token_data is None:
            return None
        
        user = db.query(User).filter(User.id == token_data.user_id).first()
        return user
    except Exception:
        return None

