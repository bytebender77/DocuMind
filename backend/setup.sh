#!/bin/bash

# Setup script for Phase 1 Backend

echo "🚀 Setting up Multi-Tenant SaaS Platform - Phase 1 Backend"

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "📌 Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and update SECRET_KEY and DATABASE_URL"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Create PostgreSQL database: createdb saas_db"
echo "3. Run migrations: alembic upgrade head"
echo "4. Start server: uvicorn app.main:app --reload"
echo ""
echo "Or use Docker:"
echo "  docker-compose up --build"

