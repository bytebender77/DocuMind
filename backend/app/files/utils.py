"""
File validation and utility functions.
"""
from fastapi import UploadFile, HTTPException, status
from typing import List
import os


# Allowed file types
ALLOWED_CONTENT_TYPES = ["application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes


def validate_file_type(file: UploadFile) -> None:
    """
    Validate that the uploaded file is a PDF.
    
    Args:
        file: UploadFile object to validate
        
    Raises:
        HTTPException: If file type is not allowed
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Only PDF files are accepted."
        )


def validate_file_size(file: UploadFile) -> None:
    """
    Validate that the uploaded file size is within limits.
    
    Args:
        file: UploadFile object to validate
        
    Raises:
        HTTPException: If file size exceeds limit
    """
    # Note: file.size might not always be available, so we'll check after reading
    pass  # Size validation will be done during file processing


async def validate_file(file: UploadFile) -> None:
    """
    Comprehensive file validation (type and size).
    
    Args:
        file: UploadFile object to validate
        
    Raises:
        HTTPException: If file validation fails
    """
    # Validate content type
    validate_file_type(file)
    
    # Read file to check size
    content = await file.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({MAX_FILE_SIZE} bytes)"
        )
    
    # Reset file pointer for later reading
    await file.seek(0)


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and special characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)
    # Remove or replace dangerous characters
    filename = filename.replace("..", "").replace("/", "_").replace("\\", "_")
    # Keep only alphanumeric, dots, hyphens, and underscores
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"
    filename = "".join(c if c in safe_chars else "_" for c in filename)
    return filename


def get_storage_path(workspace_id: str, filename: str) -> str:
    """
    Generate storage path for a file.
    
    Args:
        workspace_id: UUID of the workspace
        filename: Sanitized filename
        
    Returns:
        Relative storage path
    """
    return f"storage/{workspace_id}/{filename}"


def ensure_storage_directory(workspace_id: str) -> str:
    """
    Ensure storage directory exists for a workspace.
    
    Args:
        workspace_id: UUID of the workspace
        
    Returns:
        Absolute path to workspace storage directory
    """
    storage_dir = os.path.join("storage", str(workspace_id))
    os.makedirs(storage_dir, exist_ok=True)
    return storage_dir

