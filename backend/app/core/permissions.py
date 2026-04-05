from typing import Any


def is_admin(user: dict[str, Any]) -> bool:
    return str(user.get("role", "")).lower() == "admin"


def is_self_or_admin(current_user: dict[str, Any], target_user_id: str | int) -> bool:
    if is_admin(current_user):
        return True

    current_user_id = current_user.get("sub") or current_user.get("user_id")
    return str(current_user_id) == str(target_user_id)
