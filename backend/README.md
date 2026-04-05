# Backend (FastAPI + Supabase + JWT)

This backend provides authentication and user management APIs for the Data-Driven Employee Routing System.

## Tech Stack

- FastAPI
- Supabase (PostgreSQL)
- JWT (access + refresh)
- Passlib + bcrypt password hashing

## Project Structure

```text
backend/
├── app/
│   ├── api/v1/routes/
│   │   ├── auth.py
│   │   └── users.py
│   ├── core/
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   ├── jwt_handler.py
│   │   ├── permissions.py
│   │   └── security.py
│   ├── db/
│   │   └── supabase_client.py
│   ├── repositories/
│   │   ├── user_auth_repository.py
│   │   └── user_repository.py
│   ├── schemas/
│   │   ├── auth_schema.py
│   │   └── user_schema.py
│   └── services/
│       └── user_service.py
├── .env
├── requirements.txt
└── README.md
```

## Setup

### 1) Create and activate virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Configure environment variables

Create `.env` in `backend/`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_key

JWT_SECRET_KEY=your_long_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 4) Run server

```bash
uvicorn app.main:app --reload
```

Server runs at: `http://127.0.0.1:8000`
Swagger docs: `http://127.0.0.1:8000/docs`

---

## Authentication APIs

### POST /auth/register
Registers user and returns access + refresh tokens.

### POST /auth/login
Logs in user and returns access + refresh tokens.

### POST /auth/refresh
Accepts refresh token and returns a new access token.

### POST /auth/logout
Stateless logout endpoint (client should delete tokens).

### GET /auth/me
Protected test route using bearer access token.

---

## User APIs

All user routes require `Authorization: Bearer <access_token>`.

### GET /users
Admin only.
Supports filters + pagination:

- `role` (optional)
- `status` (optional)
- `page` (default 1)
- `limit` (default 20, max 100)

Response format:

```json
{
  "users": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

### GET /users/{user_id}
- Admin: can access any user
- Normal user: self only

### PUT /users/{user_id}
- Admin: can update anyone
- Normal user: self only
- Allowed fields: `name`, `phone`
- `status` can be updated by Admin only

### DELETE /users/{user_id}
Soft delete only:

- sets `status = Inactive`
- does not physically remove row

### POST /users/{user_id}/change-password
- verifies old password
- hashes and stores new password

---

## RBAC Rules

- Admin-only: `GET /users`
- Self or Admin: `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}`, `POST /users/{id}/change-password`
- Never trust frontend role/user id; authorization is verified from token + DB-backed current user resolution.

---

## Important Notes

### 1) Admin role in database
If registering with role `Admin` fails, update Supabase `users_role_check` constraint to include `Admin`.

### 2) Password security
Passwords are never stored in plain text.
Only bcrypt hashes are stored in `users.password_hash`.

### 3) Soft delete behavior
Inactive users remain in DB for audit/history and relationship integrity.

---

## Quick Test Flow

1. Register user (`/auth/register`)
2. Login (`/auth/login`) and copy access/refresh tokens
3. Test protected route (`/auth/me`)
4. Test users list (`/users`) with admin token
5. Update profile (`PUT /users/{id}`)
6. Change password (`POST /users/{id}/change-password`)
7. Soft delete (`DELETE /users/{id}`)
