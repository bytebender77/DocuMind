"""
RAG query utilities for retrieving relevant context from Pinecone.
"""
from typing import List, Dict, Any, Optional
from uuid import UUID
import asyncio
from app.rag.embed import get_embedding, get_openai_client
from app.rag.storage import query_similar_chunks, get_pinecone_index


SYSTEM_PROMPT_TEMPLATE = """You are an AI assistant for this organization.
You have access to the organization's documents and knowledge base.

Instructions:
- Only use the provided context to answer questions
- If the answer is not found in the provided context, say "Information not available in the documents."
- Be concise and accurate
- Cite relevant information when possible
- If asked about something outside the context, politely decline and suggest checking the documents

Context from documents:
{context}"""


async def retrieve_relevant_chunks(
    workspace_id: UUID,
    query: str,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Retrieve relevant document chunks for a query using RAG.
    
    Args:
        workspace_id: UUID of the workspace (Pinecone namespace)
        query: User query text
        top_k: Number of top chunks to retrieve
        
    Returns:
        List of relevant chunks with metadata and scores
    """
    try:
        # Generate query embedding (run in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        query_embedding = await loop.run_in_executor(
            None, 
            get_embedding, 
            query, 
            "text-embedding-3-small"
        )
        
        # Query Pinecone (run in thread pool)
        index = get_pinecone_index()
        chunks = await loop.run_in_executor(
            None,
            query_similar_chunks,
            workspace_id,
            query_embedding,
            top_k,
            index
        )
        
        return chunks
    except Exception as e:
        raise Exception(f"Failed to retrieve relevant chunks: {str(e)}")


def build_context_from_chunks(chunks: List[Dict[str, Any]]) -> str:
    """
    Build context string from retrieved chunks.
    
    Args:
        chunks: List of chunk dictionaries with metadata
        
    Returns:
        Formatted context string
    """
    if not chunks:
        return "No relevant documents found."
    
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        text = chunk.get('metadata', {}).get('text', '')
        document_id = chunk.get('metadata', {}).get('document_id', 'Unknown')
        chunk_index = chunk.get('metadata', {}).get('chunk_index', 0)
        
        context_parts.append(f"[Document {document_id[:8]}... - Chunk {chunk_index}]\n{text}")
    
    return "\n\n".join(context_parts)


async def generate_chat_completion(
    user_message: str,
    context: str,
    model: str = "gpt-4o-mini"
) -> str:
    """
    Generate chat completion using OpenAI with RAG context.
    
    Args:
        user_message: User's query message
        context: Retrieved context from documents
        model: OpenAI model to use (default: gpt-4o-mini)
        
    Returns:
        AI-generated response
    """
    try:
        client = get_openai_client()
        
        # Build system prompt with context
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)
        
        # Create chat completion (run in thread pool to avoid blocking)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.7,
                max_tokens=1000
            )
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"Failed to generate chat completion: {str(e)}")


async def query_rag(
    workspace_id: UUID,
    user_message: str,
    top_k: int = 5,
    model: str = "gpt-4o-mini"
) -> Dict[str, Any]:
    """
    Complete RAG query pipeline: retrieve chunks and generate response.
    
    Args:
        workspace_id: UUID of the workspace
        user_message: User's query message
        top_k: Number of chunks to retrieve
        model: OpenAI model to use
        
    Returns:
        Dictionary with reply and source_chunks
    """
    # Step 1: Retrieve relevant chunks
    chunks = await retrieve_relevant_chunks(workspace_id, user_message, top_k)
    
    # Step 2: Build context
    context = build_context_from_chunks(chunks)
    
    # Step 3: Generate response
    reply = await generate_chat_completion(user_message, context, model)
    
    # Step 4: Format source chunks for response
    source_chunks = []
    for chunk in chunks:
        source_chunks.append({
            "document_id": chunk.get('metadata', {}).get('document_id'),
            "chunk_index": chunk.get('metadata', {}).get('chunk_index'),
            "text": chunk.get('metadata', {}).get('text', '')[:200] + '...',  # Preview
            "score": chunk.get('score', 0.0)
        })
    
    return {
        "reply": reply,
        "source_chunks": source_chunks,
        "chunks_count": len(chunks)
    }

