from app.core.permissions import is_admin, is_self_or_admin
from app.repositories.user_repository import get_user_by_id, get_users, update_user

ALLOWED_STATUS_VALUES = {"Active", "Inactive"}


def validate_pagination(page: int, limit: int) -> tuple[int, int]:
    if page < 1:
        raise ValueError("page must be greater than or equal to 1")
    if limit < 1 or limit > 100:
        raise ValueError("limit must be between 1 and 100")
    offset = (page - 1) * limit
    return limit, offset


def validate_status(status: str | None) -> str | None:
    if status is None:
        return None
    if status not in ALLOWED_STATUS_VALUES:
        raise ValueError(f"status must be one of {sorted(ALLOWED_STATUS_VALUES)}")
    return status


def can_access_user(current_user: dict, target_user_id: str | int) -> bool:
    return is_self_or_admin(current_user, target_user_id)


def can_list_users(current_user: dict) -> bool:
    return is_admin(current_user)


def list_users(current_user: dict, role: str | None, status: str | None, page: int, limit: int) -> dict:
    if not can_list_users(current_user):
        raise PermissionError("Only admin can list users")

    limit, offset = validate_pagination(page, limit)
    status = validate_status(status)
    result = get_users(role=role, status=status, limit=limit, offset=offset)
    return {
        "users": result["users"],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": result["total"],
        },
    }


def get_user(current_user: dict, target_user_id: str | int) -> dict:
    if not can_access_user(current_user, target_user_id):
        raise PermissionError("Not allowed to view this user")

    user = get_user_by_id(target_user_id)
    if not user:
        raise LookupError("User not found")
    return user


def update_user_profile(current_user: dict, target_user_id: str | int, data: dict) -> dict:
    if not can_access_user(current_user, target_user_id):
        raise PermissionError("Not allowed to update this user")

    if "status" in data:
        if not is_admin(current_user):
            raise PermissionError("Only admin can update status")
        data["status"] = validate_status(data["status"])

    allowed_keys = {"name", "phone", "status"}
    update_data = {key: value for key, value in data.items() if key in allowed_keys and value is not None}

    if not update_data:
        raise ValueError("No valid fields provided for update")

    updated_user = update_user(target_user_id, update_data)
    if not updated_user:
        raise LookupError("User not found")
    return updated_user
