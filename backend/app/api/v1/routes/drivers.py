from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/drivers", tags=["drivers"])


def _require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if str(current_user.get("role", "")).lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def _pagination(page: int, limit: int, total_items: int) -> dict:
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    return {
        "current_page": page,
        "total_pages": total_pages,
        "page_size": limit,
        "total_items": total_items,
    }


@router.get("")
def list_drivers(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    query = supabase.table("driver").select("driver_id,user_id,license_no,status")
    if status:
        query = query.eq("status", status)

    all_rows = query.order("driver_id").execute().data or []
    start = (page - 1) * limit
    end = start + limit
    rows = all_rows[start:end]

    user_ids = [row["user_id"] for row in rows if row.get("user_id") is not None]
    users = []
    if user_ids:
        users = (
            supabase.table("users")
            .select("user_id,name,email,phone,role,status,created_at")
            .in_("user_id", user_ids)
            .execute()
            .data
            or []
        )
    user_by_id = {user["user_id"]: user for user in users}

    drivers = []
    for row in rows:
        drivers.append(
            {
                **row,
                "user": user_by_id.get(row.get("user_id")),
            }
        )

    return {
        "drivers": drivers,
        "pagination": _pagination(page=page, limit=limit, total_items=len(all_rows)),
    }


@router.get("/{driver_id}")
def get_driver(
    driver_id: int,
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    result = (
        supabase.table("driver")
        .select("driver_id,user_id,license_no,status")
        .eq("driver_id", driver_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Driver not found")

    driver = result.data[0]
    user = None
    if driver.get("user_id") is not None:
        user_result = (
            supabase.table("users")
            .select("user_id,name,email,phone,role,status,created_at")
            .eq("user_id", driver["user_id"])
            .limit(1)
            .execute()
        )
        if user_result.data:
            user = user_result.data[0]

    return {
        **driver,
        "user": user,
    }
