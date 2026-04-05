from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/pickup-requests", tags=["pickup-requests"])


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


def _attach_employee_users(rows: list[dict]) -> list[dict]:
    employee_ids = [row.get("employee_id") for row in rows if row.get("employee_id") is not None]
    if not employee_ids:
        return rows

    employees = (
        supabase.table("employee")
        .select("employee_id,user_id,home_lat,home_lng,is_active")
        .in_("employee_id", employee_ids)
        .execute()
        .data
        or []
    )
    employee_by_id = {employee["employee_id"]: employee for employee in employees}

    user_ids = [employee.get("user_id") for employee in employees if employee.get("user_id") is not None]
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

    output = []
    for row in rows:
        employee = employee_by_id.get(row.get("employee_id"))
        if employee:
            output.append(
                {
                    **row,
                    "employee": {
                        **employee,
                        "user": user_by_id.get(employee.get("user_id")),
                    },
                }
            )
        else:
            output.append(row)

    return output


@router.get("")
def list_pickup_requests(
    service_date: str | None = Query(default=None),
    shift_start_time: str | None = Query(default=None),
    status: str | None = Query(default=None),
    future_only: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    query = supabase.table("pickup_request").select(
        "pickup_id,employee_id,zone_id,route_id,pickup_lat,pickup_lng,shift_start_time,service_date,request_type,status,pickup_time,created_at"
    )

    if service_date:
        query = query.eq("service_date", service_date)
    elif future_only:
        query = query.gte("service_date", date.today().isoformat())

    if shift_start_time:
        query = query.eq("shift_start_time", shift_start_time)

    if status:
        query = query.eq("status", status)

    all_rows = query.order("service_date").order("shift_start_time").order("pickup_id").execute().data or []
    start = (page - 1) * limit
    end = start + limit
    rows = all_rows[start:end]

    return {
        "pickup_requests": _attach_employee_users(rows),
        "pagination": _pagination(page=page, limit=limit, total_items=len(all_rows)),
    }


@router.get("/{pickup_id}")
def get_pickup_request(
    pickup_id: int,
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    result = (
        supabase.table("pickup_request")
        .select(
            "pickup_id,employee_id,zone_id,route_id,pickup_lat,pickup_lng,shift_start_time,service_date,request_type,status,pickup_time,created_at"
        )
        .eq("pickup_id", pickup_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Pickup request not found")

    enriched = _attach_employee_users([result.data[0]])
    return enriched[0]
