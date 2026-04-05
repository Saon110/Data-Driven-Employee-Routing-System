from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user
from app.core.security import hash_password, verify_password
from app.repositories.user_auth_repository import get_user_auth_by_id
from app.schemas.user_schema import ChangePasswordRequest, UserUpdate
from app.services.user_service import get_user, list_users, update_user_profile
from app.repositories.user_repository import soft_delete_user
from app.repositories.user_repository import update_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def read_users(
    current_user: dict = Depends(get_current_user),
    role: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    try:
        return list_users(
            current_user=current_user,
            role=role,
            status=status_filter,
            page=page,
            limit=limit,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{user_id}")
def read_user(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    try:
        return get_user(current_user=current_user, target_user_id=user_id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.put("/{user_id}")
def update_user_route(
    user_id: int,
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        return update_user_profile(current_user=current_user, target_user_id=user_id, data=payload.model_dump(exclude_unset=True))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{user_id}")
def delete_user_route(
    user_id: int,
    current_user: dict = Depends(get_current_user),
):
    try:
        if not current_user.get("role") == "Admin" and str(current_user.get("sub")) != str(user_id):
            raise PermissionError("Not allowed to delete this user")

        updated_user = soft_delete_user(user_id)
        if not updated_user:
            raise LookupError("User not found")

        return {"message": "User marked as Inactive", "user": updated_user}
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{user_id}/change-password")
def change_password_route(
    user_id: int,
    payload: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        if str(current_user.get("sub")) != str(user_id) and current_user.get("role") != "Admin":
            raise PermissionError("Not allowed to change this user's password")

        user = get_user_auth_by_id(user_id)
        if not user:
            raise LookupError("User not found")

        if not verify_password(payload.old_password, user.get("password_hash", "")):
            raise ValueError("Old password is incorrect")

        new_hash = hash_password(payload.new_password)
        updated = update_password(user_id, new_hash)
        if not updated:
            raise LookupError("User not found")

        return {"message": "Password updated successfully"}
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
