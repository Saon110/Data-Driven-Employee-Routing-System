from typing import Any

from app.db.supabase_client import supabase


def get_user_auth_by_id(user_id: str | int) -> dict[str, Any] | None:
    response = (
        supabase.table("users")
        .select("user_id,password_hash,role")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None
