#!/usr/bin/env python3
"""
Quick script to test Supabase database connection.
Run this after updating your .env file with Supabase credentials.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app.db.database import engine
    from app.core.config import settings
    
    print("🔍 Testing Supabase connection...")
    print(f"📍 Database URL: {settings.DATABASE_URL[:30]}...")  # Show first 30 chars only
    
    # Test connection
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print("✅ Connection successful!")
        print(f"📊 PostgreSQL version: {version[:50]}...")
        
        # Check if tables exist
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result]
        
        if tables:
            print(f"📋 Tables found: {', '.join(tables)}")
        else:
            print("⚠️  No tables found. Run migrations: alembic upgrade head")
            
except Exception as e:
    print(f"❌ Connection failed: {str(e)}")
    print("\n💡 Troubleshooting:")
    print("1. Check your DATABASE_URL in .env file")
    print("2. Verify your Supabase password is correct")
    print("3. Ensure your IP is allowed in Supabase dashboard")
    print("4. Check SUPABASE_SETUP.md for detailed instructions")
    sys.exit(1)

