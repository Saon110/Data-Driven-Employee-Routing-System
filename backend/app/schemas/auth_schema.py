from enum import Enum
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserRole(str, Enum):
    admin = "Admin"
    employee = "Employee"
    driver = "Driver"

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=8, max_length=128)
    role: UserRole

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            mapping = {
                "admin": UserRole.admin.value,
                "employee": UserRole.employee.value,
                "driver": UserRole.driver.value,
            }
            return mapping.get(normalized, value)
        return value

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole
    status: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
    
class RefreshRequest(BaseModel):
    refresh_token: str