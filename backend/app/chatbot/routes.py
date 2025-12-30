"""
Chatbot settings routes for widget customization.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.database import get_db
from app.db.models import Workspace
from app.db.schemas import ChatbotSettingsUpdate, ChatbotSettingsResponse
from app.dependencies.workspace import verify_workspace_ownership

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.get("/settings/{workspace_id}", response_model=ChatbotSettingsResponse, status_code=status.HTTP_200_OK)
async def get_chatbot_settings(
    workspace_id: UUID,
    workspace: Workspace = Depends(verify_workspace_ownership),
    db: Session = Depends(get_db)
):
    """
    Get chatbot customization settings for a workspace.
    
    Returns default values if settings haven't been customized.
    
    Args:
        workspace_id: UUID of the workspace
        workspace: Workspace object (verified ownership via dependency)
        db: Database session
        
    Returns:
        ChatbotSettingsResponse with current or default settings
    """
    # Return settings with defaults if None
    return ChatbotSettingsResponse(
        bot_name=workspace.bot_name or "AI Assistant",
        primary_color=workspace.primary_color or "#3b82f6",
        chat_position=workspace.chat_position or "right",
        welcome_message=workspace.welcome_message or "Hi! How can I assist you?"
    )


@router.post("/settings/{workspace_id}", response_model=ChatbotSettingsResponse, status_code=status.HTTP_200_OK)
async def update_chatbot_settings(
    workspace_id: UUID,
    settings: ChatbotSettingsUpdate,
    workspace: Workspace = Depends(verify_workspace_ownership),
    db: Session = Depends(get_db)
):
    """
    Update chatbot customization settings for a workspace.
    
    Only updates fields that are provided (partial update).
    
    Args:
        workspace_id: UUID of the workspace
        settings: ChatbotSettingsUpdate with fields to update
        workspace: Workspace object (verified ownership via dependency)
        db: Database session
        
    Returns:
        ChatbotSettingsResponse with updated settings
    """
    # Update only provided fields
    update_data = settings.model_dump(exclude_unset=True)
    
    if "bot_name" in update_data and update_data["bot_name"] is not None:
        workspace.bot_name = update_data["bot_name"]
    
    if "primary_color" in update_data and update_data["primary_color"] is not None:
        workspace.primary_color = update_data["primary_color"]
    
    if "chat_position" in update_data and update_data["chat_position"] is not None:
        workspace.chat_position = update_data["chat_position"]
    
    if "welcome_message" in update_data and update_data["welcome_message"] is not None:
        workspace.welcome_message = update_data["welcome_message"]
    
    db.commit()
    db.refresh(workspace)
    
    # Return updated settings with defaults for None values
    return ChatbotSettingsResponse(
        bot_name=workspace.bot_name or "AI Assistant",
        primary_color=workspace.primary_color or "#3b82f6",
        chat_position=workspace.chat_position or "right",
        welcome_message=workspace.welcome_message or "Hi! How can I assist you?"
    )

