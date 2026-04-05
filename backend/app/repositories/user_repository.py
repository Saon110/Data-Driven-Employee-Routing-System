from __future__ import annotations

from typing import Any

from app.db.supabase_client import supabase


def get_users(
    role: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict[str, Any]:
    query = supabase.table("users").select("user_id,name,email,phone,role,status,created_at", count="exact")

    if role:
        query = query.eq("role", role)
    if status:
        query = query.eq("status", status)

    response = query.order("user_id", desc=True).range(offset, offset + limit - 1).execute()
    return {
        "users": response.data or [],
        "total": response.count or 0,
    }


def get_user_by_id(user_id: str | int) -> dict[str, Any] | None:
    response = (
        supabase.table("users")
        .select("user_id,name,email,phone,role,status,created_at")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def update_user(user_id: str | int, data: dict[str, Any]) -> dict[str, Any] | None:
    supabase.table("users").update(data).eq("user_id", user_id).execute()
    return get_user_by_id(user_id)


def soft_delete_user(user_id: str | int) -> dict[str, Any] | None:
    return update_user(user_id, {"status": "Inactive"})


def update_password(user_id: str | int, hashed_password: str) -> dict[str, Any] | None:
    supabase.table("users").update({"password_hash": hashed_password}).eq("user_id", user_id).execute()
    return True
