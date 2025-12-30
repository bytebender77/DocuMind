#!/usr/bin/env python3
"""
Manual RAG query example script.

This script demonstrates how to:
1. Generate an embedding for a query
2. Search Pinecone for similar chunks
3. Retrieve relevant document sections

Usage:
    python test_rag_query.py "your query text" WORKSPACE_ID
"""
import sys
import os
from uuid import UUID

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.rag.embed import get_embedding
from app.rag.storage import query_similar_chunks, get_pinecone_index
from app.core.config import settings


def query_rag(query_text: str, workspace_id: str, top_k: int = 5):
    """
    Query RAG system for similar chunks.
    
    Args:
        query_text: Query text to search for
        workspace_id: UUID of the workspace
        top_k: Number of results to return
    """
    print(f"🔍 Querying RAG system...")
    print(f"📝 Query: {query_text}")
    print(f"🏢 Workspace: {workspace_id}")
    print(f"📊 Top K: {top_k}\n")
    
    try:
        # Step 1: Generate query embedding
        print("1️⃣ Generating query embedding...")
        query_embedding = get_embedding(query_text, model="text-embedding-3-small")
        print(f"   ✅ Embedding generated ({len(query_embedding)} dimensions)\n")
        
        # Step 2: Query Pinecone
        print("2️⃣ Querying Pinecone...")
        index = get_pinecone_index()
        matches = query_similar_chunks(
            workspace_id=UUID(workspace_id),
            query_embedding=query_embedding,
            top_k=top_k,
            index=index
        )
        print(f"   ✅ Found {len(matches)} matches\n")
        
        # Step 3: Display results
        print("3️⃣ Results:\n")
        if not matches:
            print("   ⚠️  No matches found. Make sure documents are processed.")
            return
        
        for i, match in enumerate(matches, 1):
            print(f"   📄 Match {i}:")
            print(f"      Score: {match['score']:.4f}")
            print(f"      Document ID: {match['metadata']['document_id']}")
            print(f"      Chunk Index: {match['metadata']['chunk_index']}")
            print(f"      Text Preview: {match['metadata']['text'][:200]}...")
            print()
        
        # Step 4: Show full text of top match
        if matches:
            print("4️⃣ Full text of top match:\n")
            top_match = matches[0]
            print(f"   {top_match['metadata']['text']}\n")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("1. Check PINECONE_API_KEY and OPENAI_API_KEY in .env")
        print("2. Verify Pinecone index exists and name matches")
        print("3. Ensure documents are processed (status = 'ready')")
        print("4. Check workspace_id is correct")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_rag_query.py 'query text' WORKSPACE_ID [top_k]")
        print("\nExample:")
        print("  python test_rag_query.py 'What is machine learning?' 123e4567-e89b-12d3-a456-426614174000")
        sys.exit(1)
    
    query_text = sys.argv[1]
    workspace_id = sys.argv[2]
    top_k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    
    query_rag(query_text, workspace_id, top_k)

