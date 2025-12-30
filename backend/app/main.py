"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.auth.routes import router as auth_router
from app.users.routes import router as users_router
from app.workspaces.routes import router as workspaces_router
from app.files.routes import router as files_router
from app.chat.routes import router as chat_router
from app.chatbot.routes import router as chatbot_router
from app.analytics.routes import router as analytics_router

# Create FastAPI application
app = FastAPI(
    title="Multi-Tenant SaaS Platform API",
    description="RAG-Powered Chatbot Backend with Authentication, Workspaces, File Upload, and Chat Completion",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - read from environment for production
import os
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins != "*":
    allowed_origins = [origin.strip() for origin in allowed_origins.split(",")]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(workspaces_router)
app.include_router(files_router)
app.include_router(chat_router)
app.include_router(chatbot_router)
app.include_router(analytics_router)

# Serve widget static files
app.mount("/widget", StaticFiles(directory="app/widget"), name="widget")


@app.get("/")
async def root():
    """
    Root endpoint for API health check.
    
    Returns:
        API information
    """
    return {
        "message": "Multi-Tenant SaaS Platform API",
        "version": "3.0.0",
        "docs": "/docs",
        "features": ["authentication", "workspaces", "file-upload", "rag-chatbot"]
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns:
        Health status
    """
    return {"status": "healthy"}

