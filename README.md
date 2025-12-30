# Multi-Tenant SaaS Platform - Backend

Backend foundation for a multi-tenant SaaS platform with authentication, user management, and workspace isolation.

## 🚀 Features

- ✅ User registration with email and password
- ✅ User login with JWT authentication (access + refresh tokens)
- ✅ Password hashing using bcrypt
- ✅ Automatic workspace creation on user registration
- ✅ Protected routes with JWT authentication
- ✅ Swagger UI documentation
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Alembic database migrations
- ✅ Docker support for local development

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── config.py           # Application configuration
│   │   ├── security.py         # Password hashing utilities
│   ├── db/
│   │   ├── database.py         # Database connection and session
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── migrations/         # Alembic migrations
│   ├── auth/
│   │   ├── routes.py           # Authentication routes (signup/login)
│   │   ├── jwt_handler.py      # JWT token creation/validation
│   ├── users/
│   │   ├── routes.py           # User routes
│   ├── workspaces/
│   │   ├── routes.py           # Workspace routes
│   ├── dependencies/
│   │   ├── auth.py             # Authentication dependencies
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
└── .env.example
```

## 🛠️ Setup Instructions

### Prerequisites

- Python 3.12+ (Python 3.12 recommended for best compatibility)
- PostgreSQL 15+ (or use Docker, or Supabase)
- pip

> **Note:** If you're using Python 3.13 and encounter build errors with `pydantic-core` or `psycopg2-binary`, either:
> - Use Python 3.12 instead (recommended), or
> - The updated `requirements.txt` uses `psycopg[binary]` which has better Python 3.13 support

### 🚀 Quick Start with Supabase

If you're using Supabase (recommended for cloud deployment):

1. **Get your Supabase connection string** from your Supabase project dashboard
2. **Update `.env` file** with your Supabase `DATABASE_URL`
3. **Run migrations**: `alembic upgrade head`
4. **Start server**: `uvicorn app.main:app --reload`

See `SUPABASE_SETUP.md` for detailed Supabase integration instructions.

### Local Development Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values, especially `SECRET_KEY` and `DATABASE_URL`.

5. **Create PostgreSQL database:**
   ```bash
   # Using psql
   createdb saas_db
   
   # Or using PostgreSQL client
   psql -U postgres -c "CREATE DATABASE saas_db;"
   ```

6. **Initialize Alembic migrations:**
   ```bash
   alembic init app/db/migrations
   ```
   Note: The migrations directory is already set up, so you can skip this step.

7. **Create initial migration:**
   ```bash
   alembic revision --autogenerate -m "Initial migration: users and workspaces"
   ```

8. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

9. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

10. **Access the API:**
    - API: http://localhost:8000
    - Swagger UI: http://localhost:8000/docs
    - ReDoc: http://localhost:8000/redoc

### Docker Setup

1. **Build and start services:**
   ```bash
   docker-compose up --build
   ```

2. **Run migrations in the container:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

3. **Access the API:**
    - API: http://localhost:8000
    - Swagger UI: http://localhost:8000/docs

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## 📝 API Endpoints

### Authentication

- `POST /auth/signup` - Register a new user
  - Request body: `{"email": "user@example.com", "password": "password123"}`
  - Response: User object with id, email, created_at
  - Automatically creates a workspace for the user

- `POST /auth/login` - Login and get JWT tokens
  - Request body: `{"email": "user@example.com", "password": "password123"}`
  - Response: `{"access_token": "...", "refresh_token": "...", "token_type": "bearer"}`

### Users

- `GET /users/me` - Get current user information (Protected)
  - Headers: `Authorization: Bearer <access_token>`
  - Response: User object

### Workspaces

- `GET /workspaces/` - Get all workspaces for current user (Protected)
  - Headers: `Authorization: Bearer <access_token>`
  - Response: List of workspace objects

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived token (default: 30 minutes) used for API requests
2. **Refresh Token**: Long-lived token (default: 7 days) used to obtain new access tokens

To use protected endpoints, include the access token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## 🗄️ Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (String, Unique, Indexed)
- `password_hash` (String)
- `created_at` (DateTime)

### Workspaces Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users.id)
- `workspace_name` (String)
- `created_at` (DateTime)

## 🔧 Common Commands

### Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history
```

### Running the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🧪 Testing the API

### Using Swagger UI

1. Navigate to http://localhost:8000/docs
2. Use the interactive API documentation to test endpoints
3. Click "Authorize" button and enter your JWT token to test protected routes

### Using curl

**Signup:**
```bash
curl -X POST "http://localhost:8000/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

**Get Current User (Protected):**
```bash
curl -X GET "http://localhost:8000/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔧 Troubleshooting

### Build Errors with Python 3.13

If you encounter build errors when installing dependencies with Python 3.13:

**Option 1: Use Python 3.12 (Recommended)**
```bash
# Install Python 3.12 using pyenv or download from python.org
pyenv install 3.12.0
pyenv local 3.12.0
python --version  # Should show 3.12.x
pip install -r requirements.txt
```

**Option 2: Use Python 3.12 requirements file**
```bash
pip install -r requirements-py312.txt
```

**Option 3: Use updated requirements (already updated)**
The current `requirements.txt` uses `psycopg[binary]` instead of `psycopg2-binary` for better Python 3.13 support. Try:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Database Connection Issues

**Local PostgreSQL:**
- Ensure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env` file
- Verify database exists: `psql -l | grep saas_db`

**Supabase:**
- See `SUPABASE_SETUP.md` for detailed Supabase integration guide
- Verify connection string format in `.env`
- Check if your IP is allowed in Supabase dashboard (Settings → Database)
- Ensure you're using the correct password and project reference

## 🔒 Security Notes

- Always use a strong `SECRET_KEY` in production (minimum 32 characters)
- Never commit `.env` file to version control
- Use HTTPS in production
- Consider implementing rate limiting for authentication endpoints
- Regularly rotate JWT secrets

## 📦 Dependencies

- **FastAPI**: Modern web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: ORM for database operations
- **Alembic**: Database migration tool
- **psycopg2**: PostgreSQL adapter
- **python-jose**: JWT token handling
- **bcrypt**: Password hashing
- **pydantic**: Data validation

## 🚧 Next Steps

- File Upload functionality
- Admin Panel
- Email verification
- Password reset
- Refresh token endpoint
- Rate limiting
- API versioning

