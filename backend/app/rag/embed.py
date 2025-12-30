"""
OpenAI embeddings generation utilities.
"""
from typing import List
from openai import OpenAI
from app.core.config import settings


# OpenAI client (initialized lazily)
_client = None


def get_openai_client():
    """Get or initialize OpenAI client."""
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise Exception("OPENAI_API_KEY not configured in environment variables")
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def get_embedding(text: str, model: str = "text-embedding-3-small", dimensions: int = 1024) -> List[float]:
    """
    Generate embedding for a single text using OpenAI.
    
    Args:
        text: Text to embed
        model: OpenAI embedding model name (default: text-embedding-3-small)
        dimensions: Output dimensions (default: 1024 for Pinecone compatibility)
        
    Returns:
        List of embedding vector values
        
    Raises:
        Exception: If embedding generation fails
    """
    try:
        client = get_openai_client()
        response = client.embeddings.create(
            model=model,
            input=text,
            dimensions=dimensions
        )
        return response.data[0].embedding
    except Exception as e:
        raise Exception(f"Failed to generate embedding: {str(e)}")


def get_embeddings_batch(texts: List[str], model: str = "text-embedding-3-small", dimensions: int = 1024) -> List[List[float]]:
    """
    Generate embeddings for multiple texts in a batch.
    
    Args:
        texts: List of texts to embed
        model: OpenAI embedding model name (default: text-embedding-3-small)
        dimensions: Output dimensions (default: 1024 for Pinecone compatibility)
        
    Returns:
        List of embedding vectors
        
    Raises:
        Exception: If embedding generation fails
    """
    if not texts:
        return []
    
    try:
        client = get_openai_client()
        response = client.embeddings.create(
            model=model,
            input=texts,
            dimensions=dimensions
        )
        # Return embeddings in the same order as input texts
        embeddings = [item.embedding for item in response.data]
        return embeddings
    except Exception as e:
        raise Exception(f"Failed to generate embeddings batch: {str(e)}")


def get_embedding_dimension(model: str = "text-embedding-3-small") -> int:
    """
    Get the dimension of embeddings for a given model.
    
    Args:
        model: OpenAI embedding model name
        
    Returns:
        Embedding dimension (1024 for our Pinecone index)
    """
    # Using 1024 dimensions for Pinecone index compatibility
    return 1024
