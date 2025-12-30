"""
SQLAlchemy database models.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.db.database import Base


class DocumentStatus(enum.Enum):
    """Document processing status enum."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class User(Base):
    """
    User model representing application users.
    """
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to workspaces
    workspaces = relationship("Workspace", back_populates="user", cascade="all, delete-orphan")


class Workspace(Base):
    """
    Workspace model representing isolated tenant workspaces.
    """
    __tablename__ = "workspaces"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Widget customization fields
    bot_name = Column(String(100), nullable=True, default="AI Assistant")
    primary_color = Column(String(7), nullable=True, default="#3b82f6")  # Hex color code
    chat_position = Column(String(10), nullable=True, default="right")  # "left" or "right"
    welcome_message = Column(Text, nullable=True, default="Hi! How can I assist you?")
    
    # Relationship to user
    user = relationship("User", back_populates="workspaces")
    # Relationship to documents
    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    # Relationship to message logs
    message_logs = relationship("MessageLog", back_populates="workspace", cascade="all, delete-orphan")


class Document(Base):
    """
    Document model representing uploaded files in workspaces.
    """
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)  # Local storage path or S3 URL
    content_type = Column(String(100), nullable=False)  # e.g., application/pdf
    size_in_bytes = Column(Integer, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED, nullable=False)
    chunks_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship to workspace
    workspace = relationship("Workspace", back_populates="documents")


class MessageLog(Base):
    """
    Message log model for analytics tracking.
    """
    __tablename__ = "message_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    is_context_used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationship to workspace
    workspace = relationship("Workspace", back_populates="message_logs")

