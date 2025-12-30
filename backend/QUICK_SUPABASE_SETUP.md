# 🚀 Quick Supabase Setup for Your Project

## Your Project Details
- **Project URL**: `https://pcmimvawlwqjxtblouss.supabase.co`
- **Project Reference**: `pcmimvawlwqjxtblouss`
- **Publishable Key**: `sb_publishable_NFZ6Mfq7U-b8aS_jRsel6A_0-VFUrQZ` (for frontend use)

## ⚠️ Important Note
The **publishable key** is for frontend/client-side usage. For backend database connection, you need:
1. **Database password** (different from your account password)
2. **PostgreSQL connection string**

## 📋 Step-by-Step Setup

### Step 1: Get Your Database Password

1. Go to: https://supabase.com/dashboard/project/pcmimvawlwqjxtblouss/settings/database
2. Scroll down to **Connection string** section
3. Look for **URI** or **Connection string**
4. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
   ```
5. Copy the password from there (or reset it if you forgot)

### Step 2: Update Your .env File

Open your `.env` file:
```bash
cd backend
nano .env
```

Replace the `DATABASE_URL` line with:

**Option A: Direct Connection (for migrations)**
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
```

**Option B: Connection Pooling (recommended for production)**
```bash
DATABASE_URL=postgresql://postgres.pcmimvawlwqjxtblouss:YOUR_PASSWORD_HERE@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

Replace `YOUR_PASSWORD_HERE` with your actual database password.

### Step 3: Test Connection

```bash
source venv/bin/activate
python test_supabase_connection.py
```

### Step 4: Run Migrations

```bash
alembic upgrade head
```

This will create `users` and `workspaces` tables in your Supabase database.

### Step 5: Start Server

```bash
uvicorn app.main:app --reload
```

## 🔍 Where to Find Connection String in Supabase

1. Dashboard → Your Project
2. Settings (⚙️ icon) → Database
3. Scroll to **Connection string** section
4. Copy the **URI** connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

## 💡 Quick Reference

Your connection string template:
```
postgresql://postgres:[PASSWORD]@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
```

Just replace `[PASSWORD]` with your database password!

