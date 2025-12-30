# RAG Dashboard - Next.js Frontend

Next.js dashboard for customizing the embeddable chat widget.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Features

- **Chatbot Customization Page**: `/chatbot/customize`
  - Customize bot name, primary color, chat position, and welcome message
  - Live preview of widget appearance
  - Copy embed code for easy integration

### Usage

1. Enter your workspace ID (get it from `/workspaces/` endpoint)
2. Enter your JWT access token (get it from `/auth/login`)
3. Customize the widget settings
4. Click "Save Settings" to persist changes
5. Copy the embed code and add it to your website

## 📁 Project Structure

```
frontend/
├── app/
│   ├── chatbot/
│   │   └── customize/
│   │       ├── page.tsx      # Customization page
│   │       └── customize.css # Styles
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page (redirects)
│   └── globals.css           # Global styles
├── package.json
├── tsconfig.json
└── next.config.js
```

## 🔗 API Integration

The dashboard connects to the FastAPI backend at:
- `GET /chatbot/settings/{workspace_id}` - Fetch settings
- `POST /chatbot/settings/{workspace_id}` - Update settings

Both endpoints require JWT authentication.

