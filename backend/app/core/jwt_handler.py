from datetime import datetime, timedelta,timezone
from jose import JWTError, jwt
from app.core.config import settings

def create_access_token(subject: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.Access_Token_Expire_Minutes)
    payload={"sub":subject,"type":"access","exp":expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(subject: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload={"sub":subject,"type":"refresh","exp":expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc