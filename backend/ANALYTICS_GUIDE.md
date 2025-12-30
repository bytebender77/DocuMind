# 📊 Analytics System Guide

## Overview

The Analytics System tracks and analyzes chat message interactions to provide insights into chatbot usage, context retrieval success rates, and user engagement patterns.

## 🗄️ Database Schema

### `message_logs` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `workspace_id` | UUID (FK) | Foreign key to workspaces |
| `question` | TEXT | User's question |
| `answer` | TEXT | AI's response |
| `is_context_used` | BOOLEAN | Whether context was retrieved from Pinecone |
| `created_at` | TIMESTAMP | Auto-generated timestamp |

### Indexes

- `ix_message_logs_workspace_id` - For fast workspace queries
- `ix_message_logs_created_at` - For time-based queries
- `ix_message_logs_id` - Primary key index

## 📡 API Endpoints

### GET `/analytics/summary/{workspace_id}`

Get analytics summary for a workspace.

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "total_messages": 150,
  "messages_today": 12,
  "context_success_rate": 85.5,
  "top_questions": [
    "What is the refund policy?",
    "How do I reset my password?",
    "What are your business hours?"
  ]
}
```

**Fields**:
- `total_messages`: Total number of messages logged
- `messages_today`: Messages sent today (since midnight)
- `context_success_rate`: Percentage (0-100) of messages that successfully retrieved context
- `top_questions`: Top 10 most frequently asked questions

**Example**:
```bash
curl -X GET "http://localhost:8000/analytics/summary/WORKSPACE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### GET `/analytics/messages-per-day/{workspace_id}`

Get daily message counts for chart visualization.

**Authentication**: Required (JWT token)

**Query Parameters**:
- `days` (optional): Number of days to retrieve (default: 30, max: 365)

**Response**:
```json
{
  "data": [
    {
      "date": "2025-12-01",
      "count": 5
    },
    {
      "date": "2025-12-02",
      "count": 12
    },
    ...
  ]
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/analytics/messages-per-day/WORKSPACE_ID?days=30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔄 Automatic Logging

The Chat API (`POST /chat/query`) automatically logs all messages:

1. **Question**: User's input message
2. **Answer**: AI's generated response
3. **Context Detection**: 
   - `is_context_used = True` if `chunks_count > 0`
   - `is_context_used = False` if `chunks_count == 0`

Logging happens **after** the response is generated, so it doesn't affect response time. If logging fails, the request still succeeds (error is logged but not returned to user).

## 📊 Dashboard UI

### Access

Navigate to: `http://localhost:3000/dashboard/analytics`

### Features

1. **Summary Cards**:
   - Total Messages
   - Messages Today
   - Context Success Rate

2. **Messages Per Day Chart**:
   - Line chart showing daily message volume
   - Configurable time period (7, 30, 90, 365 days)
   - Interactive tooltips

3. **Top 10 Questions Table**:
   - Most frequently asked questions
   - Ranked by frequency

### Setup

1. Enter your **Workspace ID** (from `/workspaces/` endpoint)
2. Enter your **JWT Access Token** (from `/auth/login`)
3. Data auto-refreshes every 30 seconds

## 🚀 Setup Instructions

### Backend

1. **Run Migration**:
   ```bash
   cd backend
   alembic upgrade head
   ```

2. **Start Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access Dashboard**:
   Open `http://localhost:3000/dashboard/analytics`

## 📈 Analytics Metrics Explained

### Context Success Rate

This metric indicates how often the RAG system successfully retrieves relevant context from Pinecone:

- **High rate (>80%)**: Documents are well-indexed and queries match well
- **Low rate (<50%)**: May indicate:
  - Documents not uploaded/processed
  - Queries don't match document content
  - Embedding quality issues

### Top Questions

Identifies the most common user queries, useful for:
- Creating FAQ sections
- Identifying knowledge gaps
- Improving document coverage

### Messages Per Day

Tracks engagement over time:
- Identify usage patterns
- Monitor growth trends
- Detect anomalies

## 🔍 Query Examples

### Get Summary for Last 7 Days

```bash
curl -X GET "http://localhost:8000/analytics/summary/WORKSPACE_ID" \
  -H "Authorization: Bearer TOKEN"
```

### Get Daily Counts for Last 90 Days

```bash
curl -X GET "http://localhost:8000/analytics/messages-per-day/WORKSPACE_ID?days=90" \
  -H "Authorization: Bearer TOKEN"
```

## 🛠️ Troubleshooting

### No Data Showing

1. **Check if messages are being logged**:
   - Send a test message via `/chat/query`
   - Check database: `SELECT COUNT(*) FROM message_logs WHERE workspace_id = '...'`

2. **Verify workspace ID**:
   - Ensure you're using the correct workspace UUID
   - Check ownership: workspace must belong to authenticated user

3. **Check authentication**:
   - Verify JWT token is valid and not expired
   - Token must be in `Authorization: Bearer TOKEN` format

### Migration Issues

If migration fails:
```bash
# Check current migration status
alembic current

# Check migration history
alembic history

# Run migration
alembic upgrade head
```

### Performance

For large datasets:
- Indexes are automatically created on `workspace_id` and `created_at`
- Queries are optimized for time-based filtering
- Consider archiving old logs (>1 year) for better performance

## 📝 Future Enhancements

Potential additions:
- [ ] Export analytics data (CSV/JSON)
- [ ] Advanced filtering (date ranges, context usage)
- [ ] User session tracking
- [ ] Response time analytics
- [ ] Sentiment analysis
- [ ] Custom date range picker
- [ ] Real-time updates (WebSocket)

## 🔗 Related Documentation

- [Chat API Guide](./CHAT_API_GUIDE.md) - Chat completion endpoint
- [RAG Pipeline Guide](./RAG_PIPELINE_GUIDE.md) - Document processing
- [Widget Guide](./WIDGET_GUIDE.md) - Embeddable widget

