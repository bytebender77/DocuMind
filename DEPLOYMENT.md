# 🚀 RAG AI Assistant - Deployment Guide

## Prerequisites
- GitHub repository with your code
- Render account (https://render.com) 
- Vercel account (https://vercel.com)

---

## Backend Deployment (Render)

### Step 1: Push to GitHub
```bash
cd /Users/kunalkumargupta/Desktop/rag_project
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### Step 2: Create Render Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Configure:
   - **Name:** `rag-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 3: Set Environment Variables (Render)
In Render dashboard → Environment tab, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `SECRET_KEY` | Your JWT secret (32+ chars) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `PINECONE_API_KEY` | Your Pinecone API key |
| `PINECONE_INDEX_NAME` | `rag-chatbots` |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |

### Step 4: Deploy
Click **"Create Web Service"** - Render will build and deploy automatically.

---

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Next.js

### Step 2: Set Environment Variables (Vercel)
In Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com` |
| `NEXT_PUBLIC_WORKSPACE_ID` | Your workspace UUID |

### Step 3: Deploy
Click **"Deploy"** - Vercel will build and deploy automatically.

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Verify CORS is working (frontend can call backend)
- [ ] Test login flow
- [ ] Test document upload
- [ ] Test chat functionality

---

## Environment Variables Summary

### Backend (.env)
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=rag-chatbots
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_WORKSPACE_ID=a11bf637-a95e-43d2-a94e-5b83e104d468
```
