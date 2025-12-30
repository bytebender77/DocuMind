"""
File upload routes for document management.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.db.database import get_db
from app.db.models import User, Document
from app.db.schemas import DocumentResponse, FileUploadResponse
from app.dependencies.auth import get_current_user
from app.dependencies.workspace import verify_workspace_ownership
from app.files.service import save_file_to_storage, create_document_record
from app.rag.pipeline import process_document

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_files(
    workspace_id: UUID = Form(..., description="Workspace ID to upload files to"),
    files: List[UploadFile] = File(..., description="PDF files to upload"),
    auto_process: bool = Form(False, description="Automatically process file after upload"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload one or more PDF files to a workspace.
    
    This endpoint:
    - Requires JWT authentication
    - Validates workspace ownership
    - Accepts multiple PDF files
    - Validates file type (PDF only) and size (max 10MB)
    - Stores files locally in /storage/{workspace_id}/
    - Saves file metadata to database
    
    Args:
        workspace_id: UUID of the workspace to upload to
        files: List of PDF files to upload
        current_user: Current authenticated user (from dependency)
        db: Database session
        
    Returns:
        FileUploadResponse with document information
        
    Raises:
        HTTPException: If validation fails or upload error occurs
    """
    # Verify workspace ownership
    workspace = await verify_workspace_ownership(workspace_id, current_user, db)
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided"
        )
    
    # Process first file (for now, we'll handle one at a time)
    # TODO: Extend to handle multiple files in a batch
    file = files[0]
    
    try:
        # Save file to storage
        file_url, file_size = await save_file_to_storage(file, workspace_id, db)
        
        # Create document record
        document = await create_document_record(
            workspace_id=workspace_id,
            filename=file.filename,
            file_url=file_url,
            content_type=file.content_type or "application/pdf",
            size_in_bytes=file_size,
            db=db
        )
        
        # Optionally trigger processing
        if auto_process:
            background_tasks.add_task(process_document, document.id, db)
        
        return FileUploadResponse(
            message="File uploaded successfully" + (" (processing started)" if auto_process else ""),
            document=DocumentResponse.model_validate(document)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.patch("/{document_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_document_endpoint(
    document_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger processing pipeline for a document.
    
    This endpoint:
    - Requires JWT authentication
    - Verifies document ownership through workspace
    - Starts background processing of the document
    - Returns immediately with processing status
    
    Args:
        document_id: UUID of the document to process
        background_tasks: FastAPI background tasks
        current_user: Current authenticated user (from dependency)
        db: Database session
        
    Returns:
        Processing status response
        
    Raises:
        HTTPException: If document not found or access denied
    """
    # Get document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Verify workspace ownership
    from app.dependencies.workspace import verify_workspace_ownership
    await verify_workspace_ownership(document.workspace_id, current_user, db)
    
    # Start background processing
    background_tasks.add_task(process_document, document_id, db)
    
    return {
        "message": "Processing started",
        "document_id": str(document_id),
        "status": "processing"
    }

