"""
File handling service for storing and managing uploaded files.
"""
import os
import uuid
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import Document, Workspace
from app.files.utils import (
    sanitize_filename,
    get_storage_path,
    ensure_storage_directory,
    validate_file
)


async def save_file_to_storage(
    file: UploadFile,
    workspace_id: uuid.UUID,
    db: Session
) -> Tuple[str, int]:
    """
    Save uploaded file to local storage.
    
    Args:
        file: UploadFile object
        workspace_id: UUID of the workspace
        db: Database session
        
    Returns:
        Tuple of (file_url, file_size_in_bytes)
        
    Raises:
        HTTPException: If file saving fails
    """
    try:
        # Validate file
        await validate_file(file)
        
        # Sanitize filename
        safe_filename = sanitize_filename(file.filename)
        
        # Generate unique filename to avoid collisions
        file_extension = Path(safe_filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Ensure storage directory exists
        workspace_storage_dir = ensure_storage_directory(str(workspace_id))
        
        # Full path for saving
        file_path = os.path.join(workspace_storage_dir, unique_filename)
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return relative path (for database) and size
        relative_path = get_storage_path(str(workspace_id), unique_filename)
        return relative_path, file_size
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


async def create_document_record(
    workspace_id: uuid.UUID,
    filename: str,
    file_url: str,
    content_type: str,
    size_in_bytes: int,
    db: Session
) -> Document:
    """
    Create a document record in the database.
    
    Args:
        workspace_id: UUID of the workspace
        filename: Original filename
        file_url: Storage path/URL
        content_type: MIME type of the file
        size_in_bytes: File size in bytes
        db: Database session
        
    Returns:
        Created Document object
        
    Raises:
        HTTPException: If workspace not found
    """
    # Verify workspace exists
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    # Create document record
    document = Document(
        workspace_id=workspace_id,
        filename=filename,
        file_url=file_url,
        content_type=content_type,
        size_in_bytes=size_in_bytes
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document

