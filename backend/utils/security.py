from datetime import datetime, timedelta, timezone
import secrets
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from backend.config import get_settings

ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=2,
    hash_len=32,
    salt_len=16
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2 hash."""
    if not hashed_password:
        return False
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    expire_minutes = int(settings.ACCESS_TOKEN_EXPIRE_MINUTES or 1440)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    secret = (settings.JWT_SECRET.strip() if settings.JWT_SECRET else None) or "super-secret-jwt-key-for-workforce-system-2026-production"
    algo = settings.JWT_ALGORITHM or "HS256"
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=algo)
    return encoded_jwt


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token."""
    settings = get_settings()
    secret = (settings.JWT_SECRET.strip() if settings.JWT_SECRET else None) or "super-secret-jwt-key-for-workforce-system-2026-production"
    algo = settings.JWT_ALGORITHM or "HS256"
    try:
        payload = jwt.decode(token, secret, algorithms=[algo])
        return payload
    except jwt.PyJWTError:
        return None


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(length)
