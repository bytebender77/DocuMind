"""
RAG processing pipeline for documents.
"""
import os
from uuid import UUID
from sqlalchemy.orm import Session
from app.db.models import Document, DocumentStatus
from app.rag.extract import extract_and_chunk_pdf
from app.rag.embed import get_embeddings_batch
from app.rag.storage import get_pinecone_index, upsert_chunks


async def process_document(
    document_id: UUID,
    db: Session
) -> None:
    """
    Process a document: extract text, chunk, generate embeddings, and store in Pinecone.
    
    This function:
    1. Updates document status to PROCESSING
    2. Extracts and chunks text from PDF
    3. Generates embeddings for chunks
    4. Stores chunks in Pinecone with metadata
    5. Updates document status to READY or FAILED
    
    Args:
        document_id: UUID of the document to process
        db: Database session
    """
    print(f"\n{'='*50}")
    print(f"[PIPELINE] Starting processing for document: {document_id}")
    print(f"{'='*50}\n")
    
    # Get document
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        print(f"[PIPELINE] ERROR: Document {document_id} not found")
        raise ValueError(f"Document {document_id} not found")
    
    print(f"[PIPELINE] Document found: {document.filename}")
    
    try:
        # Update status to PROCESSING
        document.status = DocumentStatus.PROCESSING
        document.chunks_count = 0
        db.commit()
        print(f"[PIPELINE] Status updated to PROCESSING")
        
        # Get file path
        file_path = document.file_url
        if not os.path.isabs(file_path):
            file_path = os.path.join(os.getcwd(), file_path)
        
        print(f"[PIPELINE] File path: {file_path}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        print(f"[PIPELINE] File exists. Starting text extraction...")
        
        # Step 1: Extract and chunk text
        chunks = extract_and_chunk_pdf(file_path, chunk_size=800, overlap=100)
        
        if not chunks:
            raise ValueError("No text extracted from PDF")
        
        print(f"[PIPELINE] Extracted {len(chunks)} chunks")
        
        # Step 2: Generate embeddings
        print(f"[PIPELINE] Generating embeddings via OpenAI...")
        embeddings = get_embeddings_batch(chunks, model="text-embedding-3-small")
        
        if len(embeddings) != len(chunks):
            raise ValueError("Number of embeddings doesn't match number of chunks")
        
        print(f"[PIPELINE] Generated {len(embeddings)} embeddings (dimension: {len(embeddings[0])})")
        
        # Step 3: Store in Pinecone
        print(f"[PIPELINE] Connecting to Pinecone and upserting vectors...")
        index = get_pinecone_index()
        chunks_upserted = upsert_chunks(
            workspace_id=document.workspace_id,
            document_id=document.id,
            chunks=chunks,
            embeddings=embeddings,
            index=index
        )
        
        print(f"[PIPELINE] Successfully upserted {chunks_upserted} chunks to Pinecone")
        
        # Step 4: Update document status
        document.status = DocumentStatus.READY
        document.chunks_count = chunks_upserted
        db.commit()
        
        print(f"\n{'='*50}")
        print(f"[PIPELINE] SUCCESS! Document processing complete")
        print(f"[PIPELINE] Document ID: {document_id}")
        print(f"[PIPELINE] Chunks indexed: {chunks_upserted}")
        print(f"{'='*50}\n")
        
    except Exception as e:
        print(f"\n{'='*50}")
        print(f"[PIPELINE] ERROR: Document processing failed!")
        print(f"[PIPELINE] Error details: {str(e)}")
        print(f"{'='*50}\n")
        
        # Update status to FAILED
        try:
            document.status = DocumentStatus.FAILED
            db.commit()
        except Exception as db_err:
            print(f"[PIPELINE] Failed to update status to FAILED: {str(db_err)}")
        
        raise Exception(f"Document processing failed: {str(e)}")
