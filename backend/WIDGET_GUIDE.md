# 💬 Embeddable Chat Widget Guide

## Overview

The embeddable chat widget allows you to add a RAG-powered AI assistant to any website with a simple script tag. The widget provides a floating chat interface that visitors can use to ask questions about your documents.

## 🚀 Quick Start

### Step 1: Get Your Workspace ID

1. Login to your backend API
2. Get your workspace ID from `/workspaces/` endpoint
3. Copy the workspace UUID

### Step 2: Embed the Widget

Add this script tag to your HTML page (before closing `</body>` tag):

```html
<script src="http://localhost:8000/widget/widget.js"
        data-workspace-id="YOUR_WORKSPACE_UUID"
        data-api-url="http://localhost:8000"
        async>
</script>
```

**For Production:**
```html
<script src="https://your-backend-domain.com/widget/widget.js"
        data-workspace-id="YOUR_WORKSPACE_UUID"
        data-api-url="https://your-backend-domain.com"
        async>
</script>
```

## 📋 Configuration Options

### Required Attributes

- `data-workspace-id`: Your workspace UUID (required)

### Optional Attributes

- `data-api-url`: Backend API URL (defaults to current page origin)
  ```html
  data-api-url="https://api.example.com"
  ```

## 🎨 Widget Features

### UI Components

1. **Chat Bubble**: Floating button in bottom-right corner (💬 icon)
2. **Chat Window**: Opens when bubble is clicked
   - Header: "Ask AI Assistant"
   - Messages area: Shows conversation history
   - Input field: Type questions
   - Send button: Submit questions

### User Experience

- **Welcome Message**: Shows when chat opens
- **Loading Indicator**: Animated dots while waiting for response
- **Error Handling**: Shows error messages if request fails
- **No Context Fallback**: Helpful message when no documents found
- **Keyboard Shortcuts**:
  - `Enter`: Send message
  - `Escape`: Close chat window

## 📝 Example HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with AI Assistant</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>Ask our AI assistant anything about our documents!</p>
    
    <!-- Embed Chat Widget -->
    <script src="http://localhost:8000/widget/widget.js"
            data-workspace-id="123e4567-e89b-12d3-a456-426614174000"
            data-api-url="http://localhost:8000"
            async>
    </script>
</body>
</html>
```

## 🔧 Local Testing

### 1. Start Your Backend Server

```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Create a Test HTML File

Create `test_widget.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Testing Chat Widget</h1>
    <p>Click the chat bubble in the bottom-right corner!</p>
    
    <script src="http://localhost:8000/widget/widget.js"
            data-workspace-id="YOUR_WORKSPACE_ID"
            data-api-url="http://localhost:8000"
            async>
    </script>
</body>
</html>
```

### 3. Open in Browser

```bash
# Open the HTML file in your browser
open test_widget.html
# or
python -m http.server 8080
# Then visit http://localhost:8080/test_widget.html
```

## 🌐 Production Deployment

### 1. Update CORS Settings

For production, update CORS in `app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
        # Add other allowed domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Serve Widget Files

The widget files are automatically served at:
- `https://your-backend.com/widget/widget.js`
- `https://your-backend.com/widget/widget.css`

### 3. Update Widget Script

Use your production API URL:

```html
<script src="https://api.yourdomain.com/widget/widget.js"
        data-workspace-id="YOUR_WORKSPACE_ID"
        data-api-url="https://api.yourdomain.com"
        async>
</script>
```

## 🔒 Security Considerations

### Current Implementation (MVP)

- **No Authentication Required**: Widget works without login for public access
- **Workspace Validation**: Only validates workspace exists (not ownership)
- **CORS Enabled**: Allows requests from any origin

### Production Recommendations

1. **Rate Limiting**: Add rate limiting per workspace/IP
2. **API Keys**: Consider workspace-specific API keys for widget access
3. **Domain Whitelist**: Restrict CORS to specific domains
4. **Workspace Privacy**: Add public/private workspace settings

## 🎨 Customization

### Styling

The widget uses CSS that can be overridden. Key classes:

- `.rag-chat-bubble`: Chat button
- `.rag-chat-window`: Chat window container
- `.rag-chat-header`: Header section
- `.rag-message-user`: User messages
- `.rag-message-bot`: Bot messages

### Custom CSS Override

Add custom styles after widget loads:

```html
<style>
    #rag-chat-widget .rag-chat-bubble {
        background: linear-gradient(135deg, #your-color-1, #your-color-2) !important;
    }
</style>
```

## 🐛 Troubleshooting

### Widget Not Loading

1. **Check Console**: Open browser DevTools (F12) → Console tab
2. **Verify Script URL**: Ensure `data-api-url` is correct
3. **Check CORS**: Verify backend CORS allows your domain
4. **Network Tab**: Check if `widget.js` and `widget.css` load successfully

### Chat Not Responding

1. **Check API Endpoint**: Verify `/chat/query` endpoint is accessible
2. **Verify Workspace ID**: Ensure workspace exists and has processed documents
3. **Check Backend Logs**: Look for errors in server console
4. **Test API Directly**: Use curl/Postman to test `/chat/query` endpoint

### Styling Issues

1. **CSS Not Loading**: Check if `widget.css` is accessible
2. **Z-index Conflicts**: Widget uses `z-index: 10000`, adjust if needed
3. **Responsive Issues**: Widget is responsive, but test on mobile devices

## 📊 API Endpoint

The widget calls:

**POST** `/chat/query`

**Request:**
```json
{
  "workspace_id": "UUID",
  "message": "User question"
}
```

**Response:**
```json
{
  "reply": "AI response",
  "source_chunks": [...],
  "chunks_count": 2
}
```

## 🔄 Widget Lifecycle

1. **Load**: Script tag loads `widget.js`
2. **Initialize**: Widget reads `data-workspace-id` and `data-api-url`
3. **Render**: Creates chat bubble and window (hidden)
4. **Open**: User clicks bubble → window opens
5. **Query**: User sends message → widget calls API
6. **Display**: Shows response in chat window

## 📱 Mobile Support

The widget is fully responsive:
- Adapts to screen size
- Touch-friendly buttons
- Scrollable message area
- Keyboard support

## 🚀 Next Steps

- [ ] Add conversation history persistence
- [ ] Implement streaming responses
- [ ] Add file upload support
- [ ] Custom branding options
- [ ] Analytics integration
- [ ] Multi-language support

## 📚 Additional Resources

- [Chat API Guide](./CHAT_API_GUIDE.md) - Backend API documentation
- [RAG Pipeline Guide](./RAG_PIPELINE_GUIDE.md) - Document processing


