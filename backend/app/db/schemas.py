"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from uuid import UUID
from typing import Optional, List


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr


class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Workspace Schemas
class WorkspaceBase(BaseModel):
    """Base workspace schema."""
    workspace_name: str = Field(..., min_length=1, max_length=255)


class WorkspaceCreate(WorkspaceBase):
    """Schema for workspace creation."""
    pass


class WorkspaceResponse(WorkspaceBase):
    """Schema for workspace response."""
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: Optional[UUID] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr
    password: str


# Document Schemas
class DocumentBase(BaseModel):
    """Base document schema."""
    filename: str
    content_type: str
    size_in_bytes: int


class DocumentCreate(DocumentBase):
    """Schema for document creation."""
    workspace_id: UUID
    file_url: str


class DocumentResponse(DocumentBase):
    """Schema for document response."""
    id: UUID
    workspace_id: UUID
    file_url: str
    status: str
    chunks_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Schema for file upload response."""
    message: str
    document: DocumentResponse


# Chat Schemas
class ChatQueryRequest(BaseModel):
    """Schema for chat query request."""
    workspace_id: UUID
    message: str = Field(..., min_length=1, max_length=2000, description="User message/query")


class SourceChunk(BaseModel):
    """Schema for source chunk in chat response."""
    document_id: Optional[str] = None
    chunk_index: Optional[int] = None
    text: str
    score: float


class ChatQueryResponse(BaseModel):
    """Schema for chat query response."""
    reply: str
    source_chunks: List[SourceChunk]
    chunks_count: int


# Chatbot Settings Schemas
class ChatbotSettingsBase(BaseModel):
    """Base chatbot settings schema."""
    bot_name: Optional[str] = Field(None, max_length=100, description="Name of the AI assistant")
    primary_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Primary color in hex format (e.g., #3b82f6)")
    chat_position: Optional[str] = Field(None, pattern=r'^(left|right)$', description="Chat bubble position: 'left' or 'right'")
    welcome_message: Optional[str] = Field(None, max_length=500, description="Welcome message shown when chat opens")


class ChatbotSettingsUpdate(ChatbotSettingsBase):
    """Schema for updating chatbot settings."""
    pass


class ChatbotSettingsResponse(ChatbotSettingsBase):
    """Schema for chatbot settings response."""
    bot_name: str
    primary_color: str
    chat_position: str
    welcome_message: str
    
    class Config:
        from_attributes = True


# Analytics Schemas
class MessageLogBase(BaseModel):
    """Base message log schema."""
    question: str
    answer: str
    is_context_used: bool


class MessageLogResponse(MessageLogBase):
    """Schema for message log response."""
    id: UUID
    workspace_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class AnalyticsSummaryResponse(BaseModel):
    """Schema for analytics summary response."""
    total_messages: int
    messages_today: int
    context_success_rate: float  # Percentage (0-100)
    top_questions: List[str]


class DailyMessageCount(BaseModel):
    """Schema for daily message count."""
    date: str  # ISO date string (YYYY-MM-DD)
    count: int


class MessagesPerDayResponse(BaseModel):
    """Schema for messages per day response."""
    data: List[DailyMessageCount]

