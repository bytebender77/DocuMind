# How to Get Your Supabase Database Connection String

Based on your Supabase project URL: `https://pcmimvawlwqjxtblouss.supabase.co`

Your project reference is: **pcmimvawlwqjxtblouss**

## 🔑 Step-by-Step Guide

### Step 1: Get Your Database Password

1. Go to your Supabase project: https://supabase.com/dashboard/project/pcmimvawlwqjxtblouss
2. Navigate to **Settings** (gear icon in left sidebar)
3. Click on **Database** in the settings menu
4. Scroll down to **Connection string** section
5. Look for **Connection pooling** or **Direct connection**
6. You'll see your database password - if you forgot it, you can reset it here

### Step 2: Construct Your Connection String

Your connection string format will be:

**Direct Connection (for migrations):**
```
postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
```

**Connection Pooling (for application - recommended):**
```
postgresql://postgres.pcmimvawlwqjxtblouss:[YOUR-DATABASE-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 3: Find Your Region

To get the exact connection pooling URL:
1. In Supabase dashboard → Settings → Database
2. Look for **Connection pooling** section
3. Copy the connection string shown there (it will have your region)

### Step 4: Update Your .env File

Replace `[YOUR-DATABASE-PASSWORD]` with your actual database password:

```bash
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
```

## 🚀 Quick Setup

1. **Get password from Supabase dashboard** (Settings → Database)
2. **Update .env file:**
   ```bash
   cd backend
   nano .env
   ```
3. **Replace DATABASE_URL with:**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.pcmimvawlwqjxtblouss.supabase.co:5432/postgres
   ```
4. **Test connection:**
   ```bash
   source venv/bin/activate
   python test_supabase_connection.py
   ```
5. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

## 📝 Notes

- The **publishable key** you have is for frontend/client-side usage
- For backend database access, you need the **PostgreSQL connection string**
- The database password is different from your Supabase account password
- If you forgot your database password, you can reset it in Supabase dashboard

