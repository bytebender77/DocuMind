"""
Pinecone vector database storage operations.
Compatible with pinecone v8+ and serverless indexes.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
from pinecone import Pinecone
from app.core.config import settings


# Pinecone client cache
_pc_client: Optional[Pinecone] = None
_index_cache = None


def get_pinecone_client() -> Pinecone:
    """Get or create Pinecone client."""
    global _pc_client
    if _pc_client is None:
        if not settings.PINECONE_API_KEY:
            raise Exception("PINECONE_API_KEY not configured")
        _pc_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        print(f"[PINECONE] Client initialized")
    return _pc_client


def get_pinecone_index():
    """
    Get Pinecone index.
    
    Returns:
        Pinecone index object
    """
    global _index_cache
    
    if _index_cache is not None:
        return _index_cache
    
    try:
        pc = get_pinecone_client()
        
        # List indexes to verify connection
        indexes = pc.list_indexes()
        print(f"[PINECONE] Available indexes: {[idx.name for idx in indexes]}")
        
        # Connect to index
        print(f"[PINECONE] Connecting to index: {settings.PINECONE_INDEX_NAME}")
        _index_cache = pc.Index(settings.PINECONE_INDEX_NAME)
        print(f"[PINECONE] Connected successfully")
        return _index_cache
    except Exception as e:
        print(f"[PINECONE] Connection error: {str(e)}")
        raise Exception(f"Failed to connect to Pinecone index: {str(e)}")


def upsert_chunks(
    workspace_id: UUID,
    document_id: UUID,
    chunks: List[str],
    embeddings: List[List[float]],
    index
) -> int:
    """
    Upsert document chunks to Pinecone with metadata.
    """
    if len(chunks) != len(embeddings):
        raise ValueError("Number of chunks must match number of embeddings")
    
    try:
        # Prepare vectors for upsert
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector_id = f"{document_id}_{i}"
            metadata = {
                "workspace_id": str(workspace_id),
                "document_id": str(document_id),
                "chunk_index": i,
                "text": chunk
            }
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": metadata
            })
        
        # Upsert to Pinecone with namespace = workspace_id
        namespace = str(workspace_id)
        print(f"[PINECONE] Upserting {len(vectors)} vectors to namespace '{namespace}'...")
        index.upsert(vectors=vectors, namespace=namespace)
        print(f"[PINECONE] Upsert complete!")
        
        return len(vectors)
    except Exception as e:
        print(f"[PINECONE] Upsert error: {str(e)}")
        raise Exception(f"Failed to upsert chunks to Pinecone: {str(e)}")


def query_similar_chunks(
    workspace_id: UUID,
    query_embedding: List[float],
    top_k: int = 5,
    index=None
) -> List[Dict[str, Any]]:
    """
    Query Pinecone for similar chunks.
    """
    if index is None:
        index = get_pinecone_index()
    
    try:
        namespace = str(workspace_id)
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            namespace=namespace
        )
        
        matches = []
        if hasattr(results, 'matches'):
            for match in results.matches:
                matches.append({
                    "id": match.id,
                    "score": match.score,
                    "metadata": match.metadata if hasattr(match, 'metadata') else {}
                })
        elif isinstance(results, dict) and 'matches' in results:
            for match in results['matches']:
                matches.append({
                    "id": match.get('id'),
                    "score": match.get('score', 0),
                    "metadata": match.get('metadata', {})
                })
        
        return matches
    except Exception as e:
        raise Exception(f"Failed to query Pinecone: {str(e)}")


def delete_document_chunks(
    workspace_id: UUID,
    document_id: UUID,
    chunks_count: int,
    index=None
) -> None:
    """
    Delete all chunks for a document from Pinecone.
    """
    if index is None:
        index = get_pinecone_index()
    
    try:
        namespace = str(workspace_id)
        vector_ids = [f"{document_id}_{i}" for i in range(chunks_count)]
        index.delete(ids=vector_ids, namespace=namespace)
    except Exception as e:
        print(f"Warning: Failed to delete chunks from Pinecone: {str(e)}")
