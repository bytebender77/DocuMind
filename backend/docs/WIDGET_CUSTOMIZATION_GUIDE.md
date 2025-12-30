# 🎨 Widget Customization Guide

## Overview

The widget customization feature allows workspace owners to personalize their embeddable chat widget with custom branding, colors, positioning, and messaging.

## 🚀 Features

### Customization Options

1. **Bot Name**: Customize the name displayed in the chat header (default: "AI Assistant")
2. **Primary Color**: Set the primary color for the bubble button and chat header (default: "#3b82f6")
3. **Chat Position**: Choose left or right side positioning (default: "right")
4. **Welcome Message**: Set a custom welcome message shown when chat opens (default: "Hi! How can I assist you?")

## 📡 API Endpoints

### GET `/chatbot/settings/{workspace_id}`

Fetch current customization settings for a workspace.

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "bot_name": "AI Assistant",
  "primary_color": "#3b82f6",
  "chat_position": "right",
  "welcome_message": "Hi! How can I assist you?"
}
```

**Example**:
```bash
curl -X GET "http://localhost:8000/chatbot/settings/YOUR_WORKSPACE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### POST `/chatbot/settings/{workspace_id}`

Update customization settings for a workspace.

**Authentication**: Required (JWT token)

**Request Body** (all fields optional):
```json
{
  "bot_name": "My Custom Bot",
  "primary_color": "#ff6b6b",
  "chat_position": "left",
  "welcome_message": "Welcome! How can I help you today?"
}
```

**Response**: Returns updated settings

**Example**:
```bash
curl -X POST "http://localhost:8000/chatbot/settings/YOUR_WORKSPACE_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_name": "Support Bot",
    "primary_color": "#10b981",
    "chat_position": "right",
    "welcome_message": "Hello! I am here to help."
  }'
```

## 🎯 Widget Behavior

The widget automatically:
1. Fetches settings when loaded
2. Applies primary color to bubble button and chat header
3. Displays custom bot name in chat header
4. Shows custom welcome message when chat opens
5. Positions bubble on left or right based on settings

## 🖥️ Dashboard UI

### Access the Customization Page

1. Start the Next.js dashboard:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. Navigate to: `http://localhost:3000/chatbot/customize`

3. Enter your:
   - **Workspace ID**: Get from `/workspaces/` endpoint
   - **Access Token**: Get from `/auth/login` endpoint

4. Customize settings and click "Save Settings"

5. Copy the embed code and add it to your website

## 📝 Database Migration

Run the migration to add customization columns:

```bash
cd backend
alembic upgrade head
```

This adds the following columns to the `workspaces` table:
- `bot_name` (String, nullable)
- `primary_color` (String, nullable)
- `chat_position` (String, nullable)
- `welcome_message` (Text, nullable)

## 🔧 Default Values

If settings are not customized, the widget uses:
- **Bot Name**: "AI Assistant"
- **Primary Color**: "#3b82f6" (blue)
- **Chat Position**: "right"
- **Welcome Message**: "Hi! How can I assist you?"

## 🎨 Color Format

Primary color must be in hex format: `#RRGGBB`
- Valid: `#3b82f6`, `#ff6b6b`, `#10b981`
- Invalid: `blue`, `rgb(59, 130, 246)`, `3b82f6`

## 📍 Position Options

- `"left"`: Chat bubble appears on the left side
- `"right"`: Chat bubble appears on the right side (default)

## 🧪 Testing

### Test Settings API

1. **Get your workspace ID**:
   ```bash
   curl -X GET "http://localhost:8000/workspaces/" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Fetch current settings**:
   ```bash
   curl -X GET "http://localhost:8000/chatbot/settings/WORKSPACE_ID" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Update settings**:
   ```bash
   curl -X POST "http://localhost:8000/chatbot/settings/WORKSPACE_ID" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"primary_color": "#ff6b6b", "bot_name": "Test Bot"}'
   ```

4. **Test widget**: Load a page with the widget embed code and verify changes

### Test Widget Customization

1. Update settings via API or dashboard
2. Embed widget on a test page:
   ```html
   <script src="http://localhost:8000/widget/widget.js"
           data-workspace-id="YOUR_WORKSPACE_ID"
           data-api-url="http://localhost:8000"
           async>
   </script>
   ```
3. Verify:
   - Bubble button color matches `primary_color`
   - Chat header shows `bot_name`
   - Welcome message matches `welcome_message`
   - Bubble position matches `chat_position`

## 🐛 Troubleshooting

### Settings Not Applied

1. **Check API response**: Verify settings are saved correctly
2. **Check console**: Look for errors in browser console
3. **Verify workspace ID**: Ensure correct workspace ID in embed code
4. **Clear cache**: Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Widget Not Loading Settings

- Check network tab for failed requests to `/chatbot/settings/{workspace_id}`
- Verify CORS is configured correctly
- Check that workspace exists and is accessible

### Color Not Applied

- Verify color is in hex format: `#RRGGBB`
- Check browser console for CSS errors
- Ensure inline styles are not being overridden

## 📚 Related Documentation

- [Widget Guide](./WIDGET_GUIDE.md) - Widget embedding and usage
- [Chat API Guide](./CHAT_API_GUIDE.md) - Chat completion API
- [Dashboard README](../frontend/README.md) - Next.js dashboard setup

