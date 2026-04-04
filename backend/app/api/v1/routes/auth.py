from fastapi import APIRouter, Depends, HTTPException, status

from app.core.jwt_handler import create_access_token, create_refresh_token,decode_token
from app.core.security import hash_password, verify_password
from app.db.supabase_client import supabase
from app.core.dependencies import get_current_user
from app.schemas.auth_schema  import RefreshRequest
from app.schemas.auth_schema import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    existing = (
        supabase.table("users")
        .select("user_id,email")
        .eq("email", payload.email)
        .limit(1)
        .execute()
    )

    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    insert_payload = {
        "name": payload.name,
        "email": payload.email,
        "phone": payload.phone,
        "password_hash": hash_password(payload.password),
        "role": payload.role.value,
    }

    created = supabase.table("users").insert(insert_payload).execute()

    if not created.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = created.data[0]
    user_id = str(user["user_id"])

    tokens = TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )

    return AuthResponse(
        user=UserResponse(
            user_id=user["user_id"],
            name=user["name"],
            email=user["email"],
            phone=user.get("phone"),
            role=user["role"],
            status=user.get("status", "Active"),
        ),
        tokens=tokens,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    result = (
        supabase.table("users")
        .select("user_id,name,email,phone,password_hash,role,status")
        .eq("email", payload.email)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["user_id"])
    tokens = TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )

    return AuthResponse(
        user=UserResponse(
            user_id=user["user_id"],
            name=user["name"],
            email=user["email"],
            phone=user.get("phone"),
            role=user["role"],
            status=user.get("status", "Active"),
        ),
        tokens=tokens,
    )
    
@router.post("/refresh")
def refresh_token(payload: RefreshRequest):
    try:
        token_payload = decode_token(payload.refresh_token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if token_payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    subject = token_payload.get("sub")
    if not subject:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    new_access_token = create_access_token(str(subject))
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
def logout():
    return {
        "message": "Logout successful. Please remove tokens on client side."
    }


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Authenticated",
        "user_id": current_user.get("sub"),
        "token_type": current_user.get("type"),
    }