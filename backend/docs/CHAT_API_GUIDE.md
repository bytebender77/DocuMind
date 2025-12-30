# 💬 Chat Completion API Guide

## Overview

The Chat Completion API provides RAG-powered chatbot functionality that answers questions based on documents stored in your workspace. It uses semantic search to find relevant context and generates intelligent responses using OpenAI.

## 🗂️ Module Structure

```
backend/app/chat/
├── __init__.py
├── routes.py      # API endpoints
└── rag_query.py   # RAG query and chat completion logic
```

## 🔌 API Endpoint

### POST /chat/query

Query the RAG-powered chatbot with a message.

**Authentication:** Required (JWT Bearer token)

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:8000/chat/query`
- **Headers:**
  ```
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  ```
- **Body:**
  ```json
  {
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "What is machine learning?"
  }
  ```

**Response (200 OK):**
```json
{
  "reply": "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Based on the documents, machine learning algorithms use statistical techniques to identify patterns in data...",
  "source_chunks": [
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_index": 2,
      "text": "Machine learning is a subset of artificial intelligence...",
      "score": 0.8923
    },
    {
      "document_id": "550e8400-e29b-41d4-a716-446655440000",
      "chunk_index": 3,
      "text": "There are three main types of machine learning...",
      "score": 0.8756
    }
  ],
  "chunks_count": 2
}
```

**Error Responses:**

- **400 Bad Request:** Invalid request
  ```json
  {
    "detail": "Message cannot be empty"
  }
  ```

- **401 Unauthorized:** Missing or invalid JWT token
  ```json
  {
    "detail": "Invalid authentication credentials"
  }
  ```

- **404 Not Found:** Workspace not found or user doesn't own it
  ```json
  {
    "detail": "Workspace not found or you don't have access to it"
  }
  ```

- **504 Gateway Timeout:** Query timeout
  ```json
  {
    "detail": "Query timeout - please try again with a shorter message"
  }
  ```

## 📝 Usage Examples

### Using cURL

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "What is the main topic of the uploaded documents?"
  }'
```

### Using Python (requests)

```python
import requests

url = "http://localhost:8000/chat/query"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN",
    "Content-Type": "application/json"
}
data = {
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "What is the main topic of the uploaded documents?"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(f"Reply: {result['reply']}")
print(f"Source chunks: {result['chunks_count']}")
for chunk in result['source_chunks']:
    print(f"  - {chunk['text'][:100]}... (score: {chunk['score']})")
```

### Using JavaScript (Fetch API)

```javascript
const response = await fetch('http://localhost:8000/chat/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workspace_id: '123e4567-e89b-12d3-a456-426614174000',
    message: 'What is the main topic of the uploaded documents?'
  })
});

const result = await response.json();
console.log('Reply:', result.reply);
console.log('Source chunks:', result.source_chunks);
```

### Using Postman

1. **Create a new request:**
   - Method: `POST`
   - URL: `http://localhost:8000/chat/query`

2. **Set Headers:**
   - Key: `Authorization`
   - Value: `Bearer YOUR_ACCESS_TOKEN`
   - Key: `Content-Type`
   - Value: `application/json`

3. **Set Body:**
   - Select: `raw` → `JSON`
   - Enter:
     ```json
     {
       "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
       "message": "What is machine learning?"
     }
     ```

4. **Send Request**

## 🔄 Complete Workflow Example

### Step 1: Login and Get Token

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

### Step 2: Get Workspace ID

```bash
curl -X GET "http://localhost:8000/workspaces/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Response:
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "workspace_name": "user@example.com's workspace",
    "user_id": "...",
    "created_at": "2025-12-30T20:00:00Z"
  }
]
```

### Step 3: Upload and Process Document

```bash
# Upload with auto-processing
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "workspace_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "files=@document.pdf" \
  -F "auto_process=true"
```

### Step 4: Query the Chatbot

```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "message": "What are the key points in the document?"
  }'
```

## 🔒 Security Features

1. **JWT Authentication:** All queries require valid JWT token
2. **Workspace Isolation:** Users can only query their own workspaces
3. **Cross-Workspace Protection:** Workspace ownership is validated on every request
4. **Timeout Protection:** 30-second timeout prevents long-running queries

## 🧠 How It Works

### RAG Pipeline

1. **Query Embedding:** User message is converted to embedding vector
2. **Semantic Search:** Pinecone searches for top 5 most relevant chunks
3. **Context Building:** Relevant chunks are formatted into context
4. **AI Generation:** OpenAI generates response using context + user message
5. **Response Formatting:** Reply and source chunks are returned

### System Prompt

The AI is instructed to:
- Only use provided context
- Say "Information not available in documents" if answer not found
- Be concise and accurate
- Cite relevant information

## 📊 Response Structure

### Source Chunks

Each source chunk includes:
- `document_id`: UUID of the source document
- `chunk_index`: Index of the chunk in the document
- `text`: Preview of the chunk text (first 200 chars)
- `score`: Similarity score (0.0 to 1.0, higher is more relevant)

### No Context Fallback

If no relevant chunks are found:
- `chunks_count`: 0
- `source_chunks`: Empty array
- `reply`: Helpful message suggesting documents need to be uploaded/processed

## ⚙️ Configuration

### OpenAI Model

Default model: `gpt-4o-mini`

To change the model, modify `app/chat/routes.py`:
```python
model="gpt-4o-mini"  # Change to "gpt-4" or other models
```

### Top K Chunks

Default: 5 chunks retrieved

To change, modify `app/chat/routes.py`:
```python
top_k=5  # Change to desired number
```

### Timeout

Default: 30 seconds

To change, modify `app/chat/routes.py`:
```python
timeout=30.0  # Change to desired timeout in seconds
```

## 🧪 Testing

### Test with Swagger UI

1. Start server: `uvicorn app.main:app --reload`
2. Go to: http://localhost:8000/docs
3. Find `/chat/query` endpoint
4. Click "Authorize" and enter your Bearer token
5. Click "Try it out"
6. Enter workspace_id and message
7. Execute

### Test with cURL

```bash
# Replace with your actual values
TOKEN="your_access_token"
WORKSPACE_ID="your_workspace_id"

curl -X POST "http://localhost:8000/chat/query" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WORKSPACE_ID\",
    \"message\": \"What is the main topic?\"
  }"
```

## 🐛 Troubleshooting

### "No relevant information in documents"
- Ensure documents are uploaded to the workspace
- Verify documents are processed (status = "ready")
- Check `chunks_count > 0` in document records
- Verify Pinecone has chunks for the workspace namespace

### "Workspace not found"
- Verify workspace_id is correct
- Ensure you own the workspace
- Check workspace exists via `/workspaces/` endpoint

### "Query timeout"
- Message might be too long
- OpenAI API might be slow
- Try shorter, more specific questions

### "Failed to process chat query"
- Check OpenAI API key is set correctly
- Verify Pinecone API key is configured
- Check OpenAI API credits
- Review server logs for detailed error

## 🚀 Next Steps

- [ ] Add conversation history tracking
- [ ] Implement streaming responses
- [ ] Add message logging for analytics
- [ ] Support for multiple models
- [ ] Add rate limiting per workspace
- [ ] Implement chat sessions

