from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/employees", tags=["employees"])


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
def list_employees(
    is_active: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=500),
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    query = supabase.table("employee").select("employee_id,user_id,home_lat,home_lng,is_active")
    if is_active is not None:
        query = query.eq("is_active", is_active)

    all_rows = query.order("employee_id").execute().data or []
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

    employees = []
    for row in rows:
        employees.append(
            {
                **row,
                "user": user_by_id.get(row.get("user_id")),
            }
        )

    return {
        "employees": employees,
        "pagination": _pagination(page=page, limit=limit, total_items=len(all_rows)),
    }


@router.get("/{employee_id}")
def get_employee(
    employee_id: int,
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    result = (
        supabase.table("employee")
        .select("employee_id,user_id,home_lat,home_lng,is_active")
        .eq("employee_id", employee_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee = result.data[0]
    user = None
    if employee.get("user_id") is not None:
        user_result = (
            supabase.table("users")
            .select("user_id,name,email,phone,role,status,created_at")
            .eq("user_id", employee["user_id"])
            .limit(1)
            .execute()
        )
        if user_result.data:
            user = user_result.data[0]

    return {
        **employee,
        "user": user,
    }
