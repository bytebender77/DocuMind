# Supabase Integration Guide

This guide will help you connect your backend to Supabase PostgreSQL database.

## 📋 Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Your project's database password

## 🔑 Getting Your Supabase Connection String

### Step 1: Get Your Connection Details

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string** section
4. You'll see two connection options:

#### Option A: Direct Connection (Recommended for migrations)
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

#### Option B: Connection Pooling (Recommended for application)
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Step 2: Replace Placeholders

- `[YOUR-PASSWORD]`: Your database password (set when creating the project)
- `[PROJECT-REF]`: Your project reference ID (found in project settings)
- `[REGION]`: Your project's AWS region (e.g., `us-east-1`)

### Step 3: Update Your .env File

Open your `.env` file and update the `DATABASE_URL`:

```bash
# For Direct Connection (use for migrations)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# OR for Connection Pooling (use for application)
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## 🚀 Setup Steps

### 1. Update Environment Variables

Edit your `.env` file:

```bash
cd backend
nano .env  # or use your preferred editor
```

Update the `DATABASE_URL` with your Supabase connection string.

### 2. Test Database Connection

```bash
source venv/bin/activate
python -c "from app.db.database import engine; conn = engine.connect(); print('✅ Connected to Supabase!'); conn.close()"
```

### 3. Run Migrations

```bash
# Check current migration status
alembic current

# Run migrations to create tables in Supabase
alembic upgrade head
```

### 4. Verify Tables Created

You can verify in Supabase dashboard:
- Go to **Table Editor** in your Supabase project
- You should see `users` and `workspaces` tables

## 🔒 Security Best Practices

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Use Connection Pooling** for production applications
3. **Use Direct Connection** only for migrations and admin tasks
4. **Rotate passwords** regularly in Supabase dashboard

## 🐛 Troubleshooting

### Connection Timeout
- Check if your IP is allowed in Supabase dashboard
- Go to **Settings** → **Database** → **Connection Pooling** → **Allowed IPs**
- Add your IP address or use `0.0.0.0/0` for development (not recommended for production)

### Authentication Failed
- Verify your password is correct
- Check if you're using the right connection string format
- Ensure you're using `postgres` as the username

### SSL Connection Required
Supabase requires SSL connections. The connection string should work, but if you get SSL errors, you can add SSL parameters:

```bash
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require
```

## 📚 Additional Resources

- [Supabase Database Docs](https://supabase.com/docs/guides/database)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [SQLAlchemy Connection Strings](https://docs.sqlalchemy.org/en/14/core/engines.html#database-urls)

