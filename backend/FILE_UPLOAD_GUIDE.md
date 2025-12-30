# 📁 File Upload System - Phase 2 Documentation

## Overview

The file upload system allows authenticated users to upload PDF files to their workspaces. Files are stored locally in the `/storage/` directory and metadata is saved to the database.

## 🗂️ Module Structure

```
backend/app/files/
├── __init__.py
├── routes.py      # API endpoints
├── service.py     # File handling business logic
└── utils.py       # File validation utilities
```

## 📊 Database Schema

### Documents Table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary Key |
| `workspace_id` | UUID | Foreign Key → workspaces.id |
| `filename` | String(255) | Original filename |
| `file_url` | String(500) | Storage path (e.g., `storage/{workspace_id}/{filename}`) |
| `content_type` | String(100) | MIME type (currently only `application/pdf`) |
| `size_in_bytes` | Integer | File size in bytes |
| `created_at` | Timestamp | Auto-generated |

## 🔌 API Endpoint

### POST /files/upload

Upload one or more PDF files to a workspace.

**Authentication:** Required (JWT Bearer token)

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:8000/files/upload`
- **Content-Type:** `multipart/form-data`
- **Headers:**
  ```
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```
- **Body (form-data):**
  - `workspace_id` (string, required): UUID of the workspace
  - `files` (file, required): One or more PDF files

**Response (201 Created):**
```json
{
  "message": "File uploaded successfully",
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
    "filename": "document.pdf",
    "file_url": "storage/123e4567-e89b-12d3-a456-426614174000/550e8400-e29b-41d4-a716-446655440000.pdf",
    "content_type": "application/pdf",
    "size_in_bytes": 245678,
    "created_at": "2025-12-30T21:00:00Z"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid file type or size
  ```json
  {
    "detail": "File type 'image/png' not allowed. Only PDF files are accepted."
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

## 📝 Usage Examples

### Using cURL

```bash
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "workspace_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "files=@/path/to/document.pdf"
```

### Using Python (requests)

```python
import requests

url = "http://localhost:8000/files/upload"
headers = {
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
files = {
    "files": ("document.pdf", open("document.pdf", "rb"), "application/pdf")
}
data = {
    "workspace_id": "123e4567-e89b-12d3-a456-426614174000"
}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

### Using Postman

1. **Create a new request:**
   - Method: `POST`
   - URL: `http://localhost:8000/files/upload`

2. **Set Headers:**
   - Key: `Authorization`
   - Value: `Bearer YOUR_ACCESS_TOKEN`

3. **Set Body:**
   - Select: `form-data`
   - Add fields:
     - `workspace_id` (Text): `123e4567-e89b-12d3-a456-426614174000`
     - `files` (File): Select your PDF file

4. **Send Request**

### Using JavaScript (Fetch API)

```javascript
const formData = new FormData();
formData.append('workspace_id', '123e4567-e89b-12d3-a456-426614174000');
formData.append('files', fileInput.files[0]); // fileInput is an <input type="file">

fetch('http://localhost:8000/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 🔒 Security Features

1. **JWT Authentication:** All uploads require valid JWT token
2. **Workspace Ownership Validation:** Users can only upload to their own workspaces
3. **File Type Validation:** Only PDF files are accepted
4. **File Size Limit:** Maximum 10 MB per file
5. **Filename Sanitization:** Prevents directory traversal attacks
6. **Unique Filenames:** UUID-based filenames prevent collisions

## 📂 Storage Structure

Files are stored in the following structure:

```
backend/
└── storage/
    └── {workspace_id}/
        └── {uuid}.pdf
```

Example:
```
backend/
└── storage/
    └── 123e4567-e89b-12d3-a456-426614174000/
        └── 550e8400-e29b-41d4-a716-446655440000.pdf
```

## 🛠️ Configuration

### File Validation Settings

Located in `app/files/utils.py`:

```python
ALLOWED_CONTENT_TYPES = ["application/pdf"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
```

To modify:
- Change `ALLOWED_CONTENT_TYPES` to add more file types
- Change `MAX_FILE_SIZE` to adjust size limit

## 🧪 Testing

### 1. Get Authentication Token

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Get User's Workspace ID

```bash
curl -X GET "http://localhost:8000/workspaces/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Upload a File

```bash
curl -X POST "http://localhost:8000/files/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "workspace_id=YOUR_WORKSPACE_ID" \
  -F "files=@test.pdf"
```

## 📋 Complete Workflow Example

1. **Register/Login:**
   ```bash
   POST /auth/login
   # Returns: { "access_token": "...", "refresh_token": "..." }
   ```

2. **Get Workspaces:**
   ```bash
   GET /workspaces/
   Authorization: Bearer {access_token}
   # Returns: [{ "id": "...", "workspace_name": "...", ... }]
   ```

3. **Upload File:**
   ```bash
   POST /files/upload
   Authorization: Bearer {access_token}
   Form-data:
     - workspace_id: {workspace_id}
     - files: {pdf_file}
   # Returns: { "message": "...", "document": {...} }
   ```

## 🚀 Next Steps

- [ ] Add support for multiple file types
- [ ] Implement file deletion endpoint
- [ ] Add file listing endpoint
- [ ] Integrate with S3 for cloud storage
- [ ] Add file processing pipeline (text extraction, embeddings)

## ⚠️ Important Notes

1. **Local Storage:** Files are currently stored locally. For production, migrate to S3 or similar cloud storage.
2. **Single File:** Currently processes only the first file from the list. Batch processing coming soon.
3. **No File Deletion:** File deletion endpoint not yet implemented.
4. **Storage Cleanup:** Implement periodic cleanup of orphaned files.

## 🔍 Troubleshooting

### "Form data requires python-multipart"
```bash
pip install python-multipart
```

### "Workspace not found"
- Verify the workspace_id exists
- Ensure you own the workspace (check `/workspaces/` endpoint)

### "File type not allowed"
- Only PDF files are currently supported
- Check file MIME type is `application/pdf`

### "File size exceeds limit"
- Maximum file size is 10 MB
- Compress or split large files

