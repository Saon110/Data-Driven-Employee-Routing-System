from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth_schema import UserRole


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole
    status: str
    created_at: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = None
    status: str | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class PaginationResponse(BaseModel):
    page: int
    limit: int
    total: int
