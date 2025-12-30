"""
Chat completion routes for RAG-powered chatbot.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.db.database import get_db
from app.db.models import User, Workspace, MessageLog
from app.db.schemas import ChatQueryRequest, ChatQueryResponse
from app.dependencies.auth import get_optional_user
from app.chat.rag_query import query_rag
import asyncio

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=ChatQueryResponse, status_code=status.HTTP_200_OK)
async def chat_query(
    request: ChatQueryRequest,
    http_request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Query the RAG-powered chatbot with a message.
    
    This endpoint supports both authenticated and public (widget) access:
    - If JWT token provided: Validates workspace ownership
    - If no token (public/widget): Validates workspace exists (for widget usage)
    
    Args:
        request: Chat query request with workspace_id and message
        authorization: Optional JWT token in Authorization header
        current_user: Current authenticated user (optional, from dependency)
        db: Database session
        
    Returns:
        ChatQueryResponse with AI reply and source chunks
        
    Raises:
        HTTPException: If validation fails or query error occurs
    """
    # Verify workspace exists
    workspace = db.query(Workspace).filter(
        Workspace.id == request.workspace_id
    ).first()
    
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # If user is authenticated, verify ownership
    if current_user:
        if workspace.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this workspace"
            )
    
    # Validate message
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty"
        )
    
    try:
        # Execute RAG query with timeout
        try:
            result = await asyncio.wait_for(
                query_rag(
                    workspace_id=request.workspace_id,
                    user_message=request.message.strip(),
                    top_k=5,
                    model="gpt-4o-mini"
                ),
                timeout=30.0  # 30 second timeout
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Query timeout - please try again with a shorter message"
            )
        
        # Handle no context case
        if result["chunks_count"] == 0:
            result["reply"] = "I don't have any relevant information in the documents to answer this question. Please make sure documents are uploaded and processed in this workspace."
            result["source_chunks"] = []
        
        # Determine if context was used
        is_context_used = result["chunks_count"] > 0
        
        # Log the message for analytics
        try:
            message_log = MessageLog(
                workspace_id=request.workspace_id,
                question=request.message.strip(),
                answer=result["reply"],
                is_context_used=is_context_used
            )
            db.add(message_log)
            db.commit()
        except Exception as log_error:
            # Don't fail the request if logging fails, just log the error
            print(f"Failed to log message: {str(log_error)}")
            db.rollback()
        
        return ChatQueryResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat query: {str(e)}"
        )
