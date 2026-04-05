from __future__ import annotations

import math
import json
import logging
from datetime import date, datetime, time, timedelta
from time import perf_counter
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user
from app.db.supabase_client import supabase

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger("app.admin.routing")


def _require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if str(current_user.get("role", "")).lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def _parse_time(value: str | None, fallback: str = "22:00") -> time:
    if not value:
        return time.fromisoformat(fallback)
    parsed = value.strip()
    if len(parsed) == 5:
        parsed = f"{parsed}:00"
    return time.fromisoformat(parsed)


def _combine_dt(service_date: str, t: time) -> datetime:
    parsed_date = date.fromisoformat(service_date)
    return datetime.combine(parsed_date, t)


def _osrm_route(points: list[tuple[float, float]], average_speed_kmph: float) -> dict[str, Any]:
    # Fallback to straight-line estimates if OSRM is unavailable.
    def fallback() -> dict[str, Any]:
        leg_durations_seconds: list[float] = []
        total_distance_km = 0.0

        for i in range(len(points) - 1):
            a = points[i]
            b = points[i + 1]
            km = _haversine_km(a[0], a[1], b[0], b[1])
            total_distance_km += km
            if average_speed_kmph > 0:
                leg_durations_seconds.append(max(60.0, (km / average_speed_kmph) * 3600.0))
            else:
                leg_durations_seconds.append(60.0)

        return {
            "distance_km": total_distance_km,
            "duration_seconds": sum(leg_durations_seconds),
            "duration_min": sum(leg_durations_seconds) / 60.0,
            "leg_durations_seconds": leg_durations_seconds,
            "geometry": [{"lat": lat, "lng": lng} for lat, lng in points],
            "source": "fallback",
        }

    if len(points) < 2:
        return {
            "distance_km": 0.0,
            "duration_seconds": 0.0,
            "duration_min": 0.0,
            "leg_durations_seconds": [],
            "geometry": [{"lat": lat, "lng": lng} for lat, lng in points],
            "source": "fallback",
        }

    try:
        coords = ";".join([f"{lng},{lat}" for lat, lng in points])
        query = urlencode(
            {
                "overview": "full",
                "geometries": "geojson",
                "steps": "false",
                "alternatives": "false",
            }
        )
        url = f"https://router.project-osrm.org/route/v1/driving/{coords}?{query}"

        with urlopen(url, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))

        routes = data.get("routes") or []
        if not routes:
            return fallback()

        route = routes[0]
        legs = route.get("legs") or []
        leg_durations_seconds = [float(leg.get("duration", 0.0)) for leg in legs]

        geometry_coords = route.get("geometry", {}).get("coordinates", [])
        geometry = [{"lat": float(c[1]), "lng": float(c[0])} for c in geometry_coords if len(c) >= 2]

        distance_km = float(route.get("distance", 0.0)) / 1000.0
        duration_seconds = float(route.get("duration", 0.0))

        if len(leg_durations_seconds) != len(points) - 1:
            # Ensure timing logic still works if API omits or shortens legs.
            return fallback()

        return {
            "distance_km": distance_km,
            "duration_seconds": duration_seconds,
            "duration_min": duration_seconds / 60.0,
            "leg_durations_seconds": leg_durations_seconds,
            "geometry": geometry if geometry else [{"lat": lat, "lng": lng} for lat, lng in points],
            "source": "osrm",
        }
    except Exception:
        return fallback()


def _osrm_table_matrix(points: list[tuple[float, float]], average_speed_kmph: float) -> dict[str, Any]:
    def fallback() -> dict[str, Any]:
        n = len(points)
        matrix = [[0.0 for _ in range(n)] for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i == j:
                    matrix[i][j] = 0.0
                    continue
                km = _haversine_km(points[i][0], points[i][1], points[j][0], points[j][1])
                if average_speed_kmph > 0:
                    matrix[i][j] = max(60.0, (km / average_speed_kmph) * 3600.0)
                else:
                    matrix[i][j] = 60.0
        return {"durations": matrix, "source": "fallback"}

    if len(points) <= 1:
        return {"durations": [[0.0]], "source": "fallback"}

    try:
        coords = ";".join([f"{lng},{lat}" for lat, lng in points])
        query = urlencode({"annotations": "duration"})
        url = f"https://router.project-osrm.org/table/v1/driving/{coords}?{query}"

        with urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

        durations = data.get("durations")
        if not durations or len(durations) != len(points):
            return fallback()

        return {
            "durations": durations,
            "source": "osrm",
        }
    except Exception:
        return fallback()


@router.get("/pickup-routing/input")
def pickup_routing_input(
    service_date: str = Query(..., description="YYYY-MM-DD"),
    shift_start_time: str | None = Query(default=None, description="HH:MM or HH:MM:SS"),
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    pickup_query = supabase.table("pickup_request").select(
        "pickup_id,employee_id,pickup_lat,pickup_lng,shift_start_time,service_date,status,request_type"
    ).eq("service_date", service_date)

    if shift_start_time:
        pickup_query = pickup_query.eq("shift_start_time", shift_start_time)

    pickup_rows = pickup_query.execute().data or []

    employee_ids = sorted({row["employee_id"] for row in pickup_rows if row.get("employee_id") is not None})
    employees = []
    if employee_ids:
        employees = (
            supabase.table("employee")
            .select("employee_id,user_id,home_lat,home_lng,is_active")
            .in_("employee_id", employee_ids)
            .execute()
            .data
            or []
        )

    drivers = (
        supabase.table("driver")
        .select("driver_id,user_id,license_no,status")
        .execute()
        .data
        or []
    )

    vehicles = (
        supabase.table("vehicle")
        .select("vehicle_id,plate_no,capacity,parking_lat,parking_lng,status,driver_id")
        .execute()
        .data
        or []
    )

    return {
        "service_date": service_date,
        "shift_start_time": shift_start_time,
        "counts": {
            "pickup_requests": len(pickup_rows),
            "employees": len(employees),
            "drivers": len(drivers),
            "vehicles": len(vehicles),
        },
        "pickup_requests": pickup_rows,
        "employees": employees,
        "drivers": drivers,
        "vehicles": vehicles,
    }


@router.post("/pickup-routing/run")
def run_pickup_routing(
    payload: dict[str, Any],
    current_user: dict = Depends(_require_admin),
):
    _ = current_user

    started_at = perf_counter()

    service_date = str(payload.get("service_date") or date.today().isoformat())
    shift_start_time = payload.get("shift_start_time")
    office_lat = float(payload.get("office_lat", 23.8103))
    office_lng = float(payload.get("office_lng", 90.4125))
    office_buffer_minutes = int(payload.get("office_buffer_minutes", 8))
    office_buffer_minutes = max(5, min(10, office_buffer_minutes))
    stop_dwell_minutes = int(payload.get("stop_dwell_minutes", 2))
    average_speed_kmph = float(payload.get("average_speed_kmph", 25.0))

    logger.info("=" * 60)
    logger.info("STARTING PICKUP ROUTING")
    logger.info("service_date=%s shift_start_time=%s office=(%.6f, %.6f)", service_date, shift_start_time, office_lat, office_lng)
    logger.info("params: office_buffer=%sm stop_dwell=%sm speed=%.2f km/h", office_buffer_minutes, stop_dwell_minutes, average_speed_kmph)
    logger.info("=" * 60)

    pickup_query = supabase.table("pickup_request").select(
        "pickup_id,employee_id,pickup_lat,pickup_lng,shift_start_time,service_date,status,request_type"
    ).eq("service_date", service_date)

    if shift_start_time:
        pickup_query = pickup_query.eq("shift_start_time", shift_start_time)

    pickup_rows = pickup_query.execute().data or []
    pending_rows = [row for row in pickup_rows if str(row.get("status", "")).lower() == "pending"]

    logger.info("pickup requests loaded: total=%s pending=%s", len(pickup_rows), len(pending_rows))

    if not pending_rows:
        return {
            "service_date": service_date,
            "summary": {
                "total_requests": 0,
                "assigned_requests": 0,
                "cars_used": 0,
                "drivers_used": 0,
                "unassigned_requests": 0,
                "skipped_requests": 0,
            },
            "cars": [],
            "employee_assignments": {},
            "unassigned_requests": [],
            "skipped_requests": [],
        }

    employee_ids = sorted({row["employee_id"] for row in pending_rows if row.get("employee_id") is not None})
    employees = (
        supabase.table("employee")
        .select("employee_id,user_id,home_lat,home_lng,is_active")
        .in_("employee_id", employee_ids)
        .execute()
        .data
        or []
    )
    employee_by_id = {row["employee_id"]: row for row in employees}
    logger.info("employee profiles loaded: %s", len(employees))

    user_ids = sorted({row["user_id"] for row in employees if row.get("user_id") is not None})
    users = (
        supabase.table("users")
        .select("user_id,name,email,phone")
        .in_("user_id", user_ids)
        .execute()
        .data
        or []
    )
    user_by_id = {row["user_id"]: row for row in users}
    logger.info("employee user rows loaded: %s", len(users))

    all_drivers = (
        supabase.table("driver")
        .select("driver_id,user_id,license_no,status")
        .execute()
        .data
        or []
    )
    available_drivers = [
        row for row in all_drivers if str(row.get("status", "Available")).lower() in {"available", "active", ""}
    ]
    logger.info("drivers loaded: total=%s available=%s", len(all_drivers), len(available_drivers))

    driver_user_ids = sorted({row["user_id"] for row in available_drivers if row.get("user_id") is not None})
    driver_users = (
        supabase.table("users")
        .select("user_id,name,email,phone")
        .in_("user_id", driver_user_ids)
        .execute()
        .data
        or []
    )
    driver_user_by_id = {row["user_id"]: row for row in driver_users}
    logger.info("driver user rows loaded: %s", len(driver_users))

    vehicles = (
        supabase.table("vehicle")
        .select("vehicle_id,plate_no,capacity,parking_lat,parking_lng,status,driver_id")
        .eq("status", "Active")
        .execute()
        .data
        or []
    )
    logger.info("active vehicles loaded: %s", len(vehicles))

    if not vehicles:
        raise HTTPException(status_code=400, detail="No active vehicles found")
    if not available_drivers:
        raise HTTPException(status_code=400, detail="No available drivers found")

    available_driver_by_id = {row.get("driver_id"): row for row in available_drivers if row.get("driver_id") is not None}
    used_driver_ids: set[int] = set()
    remaining_available_drivers = [
        row for row in available_drivers if row.get("driver_id") is not None
    ]

    fleet = []
    mapped_count = 0
    fallback_count = 0
    for vehicle in vehicles:
        mapped_driver_id = vehicle.get("driver_id")
        driver = None
        assignment_source = "mapped"

        # Prefer explicit vehicle -> driver mapping from DB.
        if mapped_driver_id is not None:
            driver = available_driver_by_id.get(mapped_driver_id)

        # If mapped driver is unavailable, fall back to any unassigned available driver.
        if driver is None:
            assignment_source = "fallback"
            for candidate in remaining_available_drivers:
                candidate_id = candidate.get("driver_id")
                if candidate_id is None or candidate_id in used_driver_ids:
                    continue
                driver = candidate
                break

        if driver is None:
            continue

        if assignment_source == "mapped":
            mapped_count += 1
        else:
            fallback_count += 1

        driver_id_value = driver.get("driver_id")
        if driver_id_value is not None:
            used_driver_ids.add(int(driver_id_value))

        driver_user = driver_user_by_id.get(driver.get("user_id"), {})

        fleet.append(
            {
                "vehicle_id": vehicle["vehicle_id"],
                "plate_no": vehicle.get("plate_no"),
                "capacity": int(vehicle.get("capacity") or 0),
                "parking_lat": vehicle.get("parking_lat"),
                "parking_lng": vehicle.get("parking_lng"),
                "driver": {
                    "driver_id": driver.get("driver_id"),
                    "user_id": driver.get("user_id"),
                    "name": driver_user.get("name", "Unknown Driver"),
                    "phone": driver_user.get("phone"),
                    "license_no": driver.get("license_no"),
                },
                "driver_assignment_source": assignment_source,
                "assigned_requests": [],
            }
        )

    if not fleet:
        raise HTTPException(status_code=400, detail="No vehicle-driver pairs available for routing")

    logger.info(
        "vehicle-driver pairs built: fleet=%s mapped=%s fallback=%s unmapped=%s",
        len(fleet),
        mapped_count,
        fallback_count,
        max(0, len(vehicles) - len(fleet)),
    )

    skipped_requests = []
    candidate_requests = []
    logger.info("building candidate pickup list from pending requests...")
    for row in pending_rows:
        employee_id = row.get("employee_id")
        employee = employee_by_id.get(employee_id)
        if not employee:
            skipped_requests.append({"pickup_id": row.get("pickup_id"), "reason": "Employee profile missing"})
            continue

        user_row = user_by_id.get(employee.get("user_id"), {})
        pickup_lat = row.get("pickup_lat") if row.get("pickup_lat") is not None else employee.get("home_lat")
        pickup_lng = row.get("pickup_lng") if row.get("pickup_lng") is not None else employee.get("home_lng")

        if pickup_lat is None or pickup_lng is None:
            skipped_requests.append({"pickup_id": row.get("pickup_id"), "reason": "Pickup coordinates missing"})
            continue

        candidate_requests.append(
            {
                "pickup_id": row.get("pickup_id"),
                "employee_id": employee_id,
                "employee_name": user_row.get("name", f"Employee {employee_id}"),
                "employee_phone": user_row.get("phone"),
                "pickup_lat": float(pickup_lat),
                "pickup_lng": float(pickup_lng),
                "shift_start_time": row.get("shift_start_time"),
                "service_date": row.get("service_date"),
            }
        )

    logger.info(
        "candidate list ready: candidates=%s skipped=%s",
        len(candidate_requests),
        len(skipped_requests),
    )

    parking_points: list[tuple[float, float]] = []
    for car in fleet:
        ref_lat = float(car["parking_lat"]) if car["parking_lat"] is not None else office_lat
        ref_lng = float(car["parking_lng"]) if car["parking_lng"] is not None else office_lng
        parking_points.append((ref_lat, ref_lng))

    pickup_points: list[tuple[float, float]] = [(req["pickup_lat"], req["pickup_lng"]) for req in candidate_requests]
    assignment_points = pickup_points + parking_points
    assignment_matrix_result = _osrm_table_matrix(assignment_points, average_speed_kmph)
    assignment_durations = assignment_matrix_result["durations"]
    pickup_count = len(pickup_points)

    logger.info(
        "assignment matrix prepared: pickups=%s cars=%s source=%s",
        pickup_count,
        len(parking_points),
        assignment_matrix_result.get("source", "unknown"),
    )

    unassigned_requests = []
    logger.info("=" * 60)
    logger.info("STARTING NAIVE ASSIGNMENT")
    logger.info("employees=%s fleet=%s", len(candidate_requests), len(fleet))
    logger.info("=" * 60)
    for req_idx, req in enumerate(candidate_requests):
        best_idx = None
        best_travel_seconds = float("inf")

        for idx, car in enumerate(fleet):
            if car["capacity"] <= 0:
                continue
            if len(car["assigned_requests"]) >= car["capacity"]:
                continue

            car_matrix_idx = pickup_count + idx
            travel_seconds = float(assignment_durations[req_idx][car_matrix_idx] or float("inf"))
            if travel_seconds < best_travel_seconds:
                best_travel_seconds = travel_seconds
                best_idx = idx

        if best_idx is None:
            unassigned_requests.append({"pickup_id": req["pickup_id"], "reason": "No capacity left"})
            continue

        fleet[best_idx]["assigned_requests"].append(req)

    logger.info("assignment complete: assigned=%s unassigned=%s", len(candidate_requests) - len(unassigned_requests), len(unassigned_requests))
    logger.info("=" * 60)
    logger.info("ASSIGNMENT SUMMARY")
    logger.info("=" * 60)
    for car in fleet:
        assigned_count = len(car.get("assigned_requests", []))
        if assigned_count > 0:
            logger.info(
                "%s (driver=%s): %s employees",
                car.get("plate_no") or car.get("vehicle_id"),
                (car.get("driver") or {}).get("name", "Unknown"),
                assigned_count,
            )

    cars_output = []
    employee_assignments: dict[str, Any] = {}

    logger.info("=" * 60)
    logger.info("CALCULATING ROUTES")
    logger.info("=" * 60)

    for car in fleet:
        assigned = car["assigned_requests"]
        if not assigned:
            continue

        logger.info(
            "calculating route for %s (driver=%s, employees=%s)",
            car.get("plate_no") or car.get("vehicle_id"),
            (car.get("driver") or {}).get("name", "Unknown"),
            len(assigned),
        )

        start_lat = float(car["parking_lat"]) if car["parking_lat"] is not None else office_lat
        start_lng = float(car["parking_lng"]) if car["parking_lng"] is not None else office_lng

        stop_points = [(req["pickup_lat"], req["pickup_lng"]) for req in assigned]
        # index 0=start parking, 1..n=stops, n+1=office
        route_points_for_matrix: list[tuple[float, float]] = [(start_lat, start_lng)] + stop_points + [(office_lat, office_lng)]
        route_matrix_result = _osrm_table_matrix(route_points_for_matrix, average_speed_kmph)
        route_matrix = route_matrix_result["durations"]

        remaining_indices = list(range(len(assigned)))
        current_idx = 0
        ordered = []

        while remaining_indices:
            nearest_local_idx = min(
                remaining_indices,
                key=lambda local_idx: float(route_matrix[current_idx][local_idx + 1] or float("inf")),
            )
            nearest = assigned[nearest_local_idx]
            ordered.append(nearest)
            remaining_indices.remove(nearest_local_idx)
            current_idx = nearest_local_idx + 1

        earliest_shift = min(
            (_parse_time(req.get("shift_start_time")) for req in ordered),
            default=time.fromisoformat("22:00:00"),
        )
        office_arrival_dt = _combine_dt(service_date, earliest_shift) - timedelta(minutes=office_buffer_minutes)

        point_sequence: list[tuple[float, float]] = [(start_lat, start_lng)]
        for req in ordered:
            point_sequence.append((req["pickup_lat"], req["pickup_lng"]))
        point_sequence.append((office_lat, office_lng))

        route_metrics = _osrm_route(point_sequence, average_speed_kmph)
        leg_durations_seconds = route_metrics.get("leg_durations_seconds", [])
        segment_minutes = [max(1, int(round(float(sec) / 60.0))) for sec in leg_durations_seconds]

        if len(segment_minutes) != len(point_sequence) - 1:
            segment_minutes = []
            seq_matrix_result = _osrm_table_matrix(point_sequence, average_speed_kmph)
            seq_matrix = seq_matrix_result["durations"]
            for idx in range(len(point_sequence) - 1):
                seconds = float(seq_matrix[idx][idx + 1] or 0.0)
                if seconds <= 0:
                    a = point_sequence[idx]
                    b = point_sequence[idx + 1]
                    km = _haversine_km(a[0], a[1], b[0], b[1])
                    seconds = max(60.0, (km / max(average_speed_kmph, 1.0)) * 3600.0)
                segment_minutes.append(max(1, int(round(seconds / 60.0))))

        # Backward schedule from office arrival: subtract leg-by-leg and dwell between stops.
        # segment_minutes index mapping: 0=start->stop1, 1=stop1->stop2, ..., n=stopN->office
        pickup_time_by_order: list[datetime] = []
        if ordered:
            pickup_time_by_order = [office_arrival_dt for _ in ordered]
            backward_dt = office_arrival_dt

            for stop_idx in range(len(ordered) - 1, -1, -1):
                backward_dt = backward_dt - timedelta(minutes=segment_minutes[stop_idx + 1])
                pickup_time_by_order[stop_idx] = backward_dt

                if stop_idx > 0:
                    backward_dt = backward_dt - timedelta(minutes=stop_dwell_minutes)

            route_start_dt = pickup_time_by_order[0] - timedelta(minutes=segment_minutes[0])
        else:
            route_start_dt = office_arrival_dt

        stops_output = []
        for idx, req in enumerate(ordered):
            pickup_dt = pickup_time_by_order[idx]
            pickup_time = pickup_dt.time().strftime("%H:%M:%S")

            stop = {
                "order": idx + 1,
                "pickup_id": req["pickup_id"],
                "employee_id": req["employee_id"],
                "employee_name": req["employee_name"],
                "employee_phone": req.get("employee_phone"),
                "pickup_location": {
                    "lat": req["pickup_lat"],
                    "lng": req["pickup_lng"],
                },
                "pickup_time": pickup_time,
            }
            stops_output.append(stop)

            employee_assignments[str(req["employee_id"])] = {
                "pickup_id": req["pickup_id"],
                "vehicle_id": car["vehicle_id"],
                "plate_no": car["plate_no"],
                "driver": car["driver"],
                "pickup_time": pickup_time,
                "pickup_location": {
                    "lat": req["pickup_lat"],
                    "lng": req["pickup_lng"],
                },
            }
        cars_output.append(
            {
                "vehicle_id": car["vehicle_id"],
                "plate_no": car["plate_no"],
                "capacity": car["capacity"],
                "driver": car["driver"],
                "parking_location": {
                    "lat": car["parking_lat"],
                    "lng": car["parking_lng"],
                },
                "office_location": {"lat": office_lat, "lng": office_lng},
                "route_start_time": route_start_dt.time().strftime("%H:%M:%S"),
                "office_arrival_time": office_arrival_dt.time().strftime("%H:%M:%S"),
                "office_buffer_minutes_used": office_buffer_minutes,
                "route_distance_km": round(float(route_metrics.get("distance_km", 0.0) or 0.0), 3),
                "route_travel_time_min": round(float(route_metrics.get("duration_min", 0.0) or 0.0), 1),
                "route_geometry": route_metrics.get("geometry", []),
                "assigned_employee_count": len(ordered),
                "assigned_employee_ids": [stop["employee_id"] for stop in stops_output],
                "stops": stops_output,
            }
        )

        logger.info(
            "route done for %s: stops=%s distance=%.3fkm travel=%.1fmin source=%s matrix_source=%s",
            car.get("plate_no") or car.get("vehicle_id"),
            len(stops_output),
            float(route_metrics.get("distance_km", 0.0) or 0.0),
            float(route_metrics.get("duration_min", 0.0) or 0.0),
            route_metrics.get("source", "unknown"),
            route_matrix_result.get("source", "unknown"),
        )

    total_elapsed = perf_counter() - started_at
    logger.info("=" * 60)
    logger.info("SOLUTION STATISTICS")
    logger.info("cars_used=%s assigned=%s unassigned=%s skipped=%s", len(cars_output), sum(car["assigned_employee_count"] for car in cars_output), len(unassigned_requests), len(skipped_requests))
    logger.info("total_distance_km=%.3f total_travel_time_min=%.1f", sum(float(car.get("route_distance_km", 0.0) or 0.0) for car in cars_output), sum(float(car.get("route_travel_time_min", 0.0) or 0.0) for car in cars_output))
    logger.info("total_elapsed_sec=%.2f", total_elapsed)
    logger.info("=" * 60)

    return {
        "service_date": service_date,
        "shift_start_time_filter": shift_start_time,
        "office": {"lat": office_lat, "lng": office_lng},
        "parameters": {
            "office_buffer_minutes": office_buffer_minutes,
            "stop_dwell_minutes": stop_dwell_minutes,
            "average_speed_kmph": average_speed_kmph,
            "office_arrival_window_minutes": {"min": 5, "max": 10},
        },
        "summary": {
            "total_requests": len(candidate_requests),
            "assigned_requests": sum(car["assigned_employee_count"] for car in cars_output),
            "cars_used": len(cars_output),
            "drivers_used": len(cars_output),
            "total_distance_km": round(sum(float(car.get("route_distance_km", 0.0) or 0.0) for car in cars_output), 3),
            "total_travel_time_min": round(sum(float(car.get("route_travel_time_min", 0.0) or 0.0) for car in cars_output), 1),
            "unassigned_requests": len(unassigned_requests),
            "skipped_requests": len(skipped_requests),
        },
        "cars": cars_output,
        "employee_assignments": employee_assignments,
        "unassigned_requests": unassigned_requests,
        "skipped_requests": skipped_requests,
    }
