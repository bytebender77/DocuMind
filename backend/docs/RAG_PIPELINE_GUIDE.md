# 🔍 RAG Pipeline - Text Extraction & Embeddings Guide

## Overview

The RAG (Retrieval-Augmented Generation) pipeline processes uploaded PDF documents by:
1. Extracting text from PDFs
2. Chunking text into manageable pieces
3. Generating embeddings using OpenAI
4. Storing vectors in Pinecone with workspace isolation

## 🗂️ Module Structure

```
backend/app/rag/
├── __init__.py
├── extract.py    # PDF text extraction and chunking
├── embed.py      # OpenAI embeddings generation
├── storage.py    # Pinecone vector DB operations
└── pipeline.py   # Main processing pipeline
```

## 📊 Processing Pipeline

### Step 1: Text Extraction
- Uses `pypdf` to extract text from PDF files
- Cleans text (removes excessive whitespace, normalizes)

### Step 2: Text Chunking
- Chunk size: ~800 characters (configurable)
- Overlap: 100 characters between chunks
- Preserves sentence boundaries where possible
- Falls back to word boundaries if needed

### Step 3: Embedding Generation
- Model: `text-embedding-3-small` (1536 dimensions)
- Batch processing for efficiency
- OpenAI API integration

### Step 4: Vector Storage
- Pinecone namespace: `workspace_id` (isolates data per workspace)
- Vector ID format: `{document_id}_{chunk_index}`
- Metadata includes:
  - `workspace_id`
  - `document_id`
  - `chunk_index`
  - `text` (original chunk text)

## 🔌 API Endpoints

### PATCH /files/{document_id}/process

Trigger processing pipeline for a document.

**Authentication:** Required (JWT Bearer token)

**Request:**
- **Method:** `PATCH`
- **URL:** `http://localhost:8000/files/{document_id}/process`
- **Headers:**
  ```
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

**Response (202 Accepted):**
```json
{
  "message": "Processing started",
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing"
}
```

### POST /files/upload (Updated)

Upload file with optional auto-processing.

**New Parameter:**
- `auto_process` (boolean, default: `false`): Automatically trigger processing after upload

**Example:**
```bash
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "workspace_id=YOUR_WORKSPACE_ID" \
  -F "files=@document.pdf" \
  -F "auto_process=true"
```

## 📋 Document Status Tracking

Documents now have a `status` field with the following values:

- **`uploaded`**: File uploaded, not yet processed (default)
- **`processing`**: Currently being processed
- **`ready`**: Processing complete, chunks stored in Pinecone
- **`failed`**: Processing failed

Additional field:
- **`chunks_count`**: Number of chunks created (default: 0)

## ⚙️ Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=rag-chatbots

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

### Pinecone Setup

1. **Create Pinecone Account:** https://www.pinecone.io/
2. **Create Index:**
   - Name: `rag-chatbots` (or update `PINECONE_INDEX_NAME`)
   - Dimensions: `1536` (for text-embedding-3-small)
   - Metric: `cosine`
   - Environment: Choose based on your plan

3. **Get API Key:** From Pinecone dashboard

### OpenAI Setup

1. **Create OpenAI Account:** https://platform.openai.com/
2. **Get API Key:** From API keys section
3. **Add Credits:** Ensure you have credits for embeddings API

## 🚀 Usage Workflow

### 1. Upload and Process Document

```bash
# Upload with auto-processing
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "workspace_id=YOUR_WORKSPACE_ID" \
  -F "files=@document.pdf" \
  -F "auto_process=true"
```

### 2. Or Process Separately

```bash
# Upload first
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "workspace_id=YOUR_WORKSPACE_ID" \
  -F "files=@document.pdf"

# Then process
curl -X PATCH "http://localhost:8000/files/{document_id}/process" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Check Document Status

```bash
# Get document details (status will show: uploaded, processing, ready, or failed)
curl -X GET "http://localhost:8000/files/{document_id}" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 Testing

### Manual RAG Query Example

See `test_rag_query.py` for a complete example of:
- Querying Pinecone for similar chunks
- Retrieving relevant document sections
- Using embeddings for semantic search

### Verify Stored Chunks

You can verify chunks in Pinecone dashboard:
1. Go to your Pinecone index
2. Filter by namespace (workspace_id)
3. View vectors and metadata

## 📝 Processing Details

### Chunking Algorithm

1. **Target Size:** 800 characters per chunk
2. **Overlap:** 100 characters between chunks
3. **Boundary Preservation:**
   - First tries sentence boundaries (`. `, `! `, `? `)
   - Falls back to word boundaries (spaces, newlines)
   - Ensures minimum 70% of target size

### Error Handling

- **File Not Found:** Document status set to `failed`
- **Extraction Error:** Status set to `failed`, error logged
- **Embedding Error:** Status set to `failed`, partial chunks not stored
- **Pinecone Error:** Status set to `failed`, transaction rolled back

## 🔒 Security

- **Workspace Isolation:** Each workspace has its own Pinecone namespace
- **Authentication Required:** All endpoints require JWT
- **Ownership Validation:** Users can only process their own documents

## 📊 Monitoring

### Check Processing Status

```python
# Document status values
- uploaded: Initial state
- processing: Background task running
- ready: Successfully processed
- failed: Error occurred
```

### View Chunks Count

The `chunks_count` field shows how many chunks were created:
- 0: Not processed or failed
- >0: Number of chunks stored in Pinecone

## 🐛 Troubleshooting

### "Pinecone index not found"
- Verify `PINECONE_INDEX_NAME` matches your index name
- Ensure index exists in Pinecone dashboard
- Check API key is correct

### "OpenAI API error"
- Verify `OPENAI_API_KEY` is set correctly
- Check you have API credits
- Verify model name is correct

### "Processing failed"
- Check document file exists at `file_url`
- Verify PDF is not corrupted
- Check logs for specific error messages

### "No text extracted"
- PDF might be image-based (OCR needed)
- PDF might be empty or corrupted
- Check file format

## 🚧 Next Steps

- [ ] Add OCR support for image-based PDFs
- [ ] Implement chunk deletion on document delete
- [ ] Add processing retry mechanism
- [ ] Add batch processing for multiple documents
- [ ] Implement chunk update on document re-upload

