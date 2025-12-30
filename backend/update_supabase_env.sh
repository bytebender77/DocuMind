#!/bin/bash

# Helper script to update .env with Supabase connection
# Usage: ./update_supabase_env.sh YOUR_DATABASE_PASSWORD

if [ -z "$1" ]; then
    echo "❌ Error: Database password required"
    echo "Usage: ./update_supabase_env.sh YOUR_DATABASE_PASSWORD"
    echo ""
    echo "Get your password from:"
    echo "https://supabase.com/dashboard/project/pcmimvawlwqjxtblouss/settings/database"
    exit 1
fi

PASSWORD="$1"
PROJECT_REF="pcmimvawlwqjxtblouss"

# Backup current .env
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backed up current .env to .env.backup"
fi

# Update DATABASE_URL
if grep -q "DATABASE_URL=" .env; then
    # Replace existing DATABASE_URL
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres|" .env
    echo "✅ Updated DATABASE_URL in .env"
else
    # Add DATABASE_URL if it doesn't exist
    echo "DATABASE_URL=postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" >> .env
    echo "✅ Added DATABASE_URL to .env"
fi

echo ""
echo "🎉 Done! Your .env file has been updated."
echo ""
echo "Next steps:"
echo "1. Test connection: python test_supabase_connection.py"
echo "2. Run migrations: alembic upgrade head"
echo "3. Start server: uvicorn app.main:app --reload"
