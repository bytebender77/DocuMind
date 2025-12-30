# 💬 Chat API - Quick Examples

## Complete Request/Response Examples

### ✅ Success Response

**Request:**
```bash
POST /chat/query
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What are the key features mentioned in the documents?"
}
```

**Response (200 OK):**
```json
{
  "reply": "Based on the documents, the key features include: 1) Multi-tenant architecture with workspace isolation, 2) JWT-based authentication, 3) PDF document upload and processing, 4) RAG-powered chatbot with semantic search, and 5) Vector database integration with Pinecone. These features enable secure, scalable document-based question answering.",
  "source_chunks": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_index": 1,
      "text": "The platform features a multi-tenant architecture that ensures complete workspace isolation. Each user gets their own workspace with dedicated storage and vector database namespace...",
      "score": 0.9234
    },
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_index": 3,
      "text": "Authentication is handled through JWT tokens with both access and refresh tokens. The system uses bcrypt for password hashing...",
      "score": 0.8912
    },
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_index": 5,
      "text": "Document processing pipeline extracts text from PDFs, chunks it intelligently, and generates embeddings using OpenAI's text-embedding-3-small model...",
      "score": 0.8756
    }
  ],
  "chunks_count": 3
}
```

### ⚠️ No Context Response

**Request:**
```json
{
  "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "What is quantum computing?"
}
```

**Response (200 OK):**
```json
{
  "reply": "I don't have any relevant information in the documents to answer this question. Please make sure documents are uploaded and processed in this workspace.",
  "source_chunks": [],
  "chunks_count": 0
}
```

### ❌ Error Responses

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**404 Not Found:**
```json
{
  "detail": "Workspace not found or you don't have access to it"
}
```

**400 Bad Request:**
```json
{
  "detail": "Message cannot be empty"
}
```

**504 Gateway Timeout:**
```json
{
  "detail": "Query timeout - please try again with a shorter message"
}
```

## 📋 Complete cURL Examples

### Example 1: Basic Query

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "Summarize the main points"
  }'
```

### Example 2: Technical Question

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "How does the authentication system work?"
  }'
```

### Example 3: Specific Document Query

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "What are the security features mentioned?"
  }'
```

## 🧪 Testing Checklist

- [ ] Login and get access token
- [ ] Get workspace ID
- [ ] Upload a PDF document
- [ ] Process the document (wait for status = "ready")
- [ ] Query the chatbot with a question
- [ ] Verify response includes source chunks
- [ ] Test with question not in documents
- [ ] Test with invalid workspace_id
- [ ] Test without authentication token

## 🔍 Verifying Setup

1. **Check documents are processed:**
   ```bash
   # Documents should have status = "ready" and chunks_count > 0
   ```

2. **Verify Pinecone has data:**
   - Check Pinecone dashboard
   - Filter by namespace (workspace_id)
   - Should see vectors with metadata

3. **Test embedding generation:**
   ```python
   from app.rag.embed import get_embedding
   embedding = get_embedding("test query")
   print(f"Embedding dimension: {len(embedding)}")  # Should be 1536
   ```

4. **Test Pinecone query:**
   ```python
   from app.rag.storage import query_similar_chunks, get_pinecone_index
   from app.rag.embed import get_embedding
   
   query_emb = get_embedding("test")
   index = get_pinecone_index()
   results = query_similar_chunks(workspace_id, query_emb, top_k=5, index=index)
   print(f"Found {len(results)} chunks")
   ```

