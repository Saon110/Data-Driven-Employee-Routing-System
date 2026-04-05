from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


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
def list_vehicles(
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    query = supabase.table("vehicle").select("vehicle_id,plate_no,capacity,parking_lat,parking_lng,status")
    if status:
        query = query.eq("status", status)

    all_rows = query.order("vehicle_id").execute().data or []
    start = (page - 1) * limit
    end = start + limit
    rows = all_rows[start:end]

    return {
        "vehicles": rows,
        "pagination": _pagination(page=page, limit=limit, total_items=len(all_rows)),
    }


@router.get("/{vehicle_id}")
def get_vehicle(
    vehicle_id: int,
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    result = (
        supabase.table("vehicle")
        .select("vehicle_id,plate_no,capacity,parking_lat,parking_lng,status")
        .eq("vehicle_id", vehicle_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return result.data[0]
