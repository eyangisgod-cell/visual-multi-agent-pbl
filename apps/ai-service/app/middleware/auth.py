from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
from app.config import settings

# JWT configuration
JWT_SECRET = settings.JWT_SECRET if hasattr(settings, 'JWT_SECRET') else "visual-pbl-jwt-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)


class AuthMiddleware:
    """
    Authentication middleware for FastAPI
    Validates JWT tokens from Authorization header
    """

    def __init__(self):
        self.security = security

    async def __call__(self, request: Request) -> Optional[dict]:
        """
        Extract and validate JWT token from request
        Returns decoded payload if valid, None if no token
        Raises HTTPException if token is invalid
        """
        credentials = await self.security(request)

        if not credentials:
            return None

        try:
            payload = jwt.decode(
                credentials.credentials,
                JWT_SECRET,
                algorithms=[JWT_ALGORITHM]
            )
            return payload
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )


def get_current_user(credentials: HTTPAuthorizationCredentials = security) -> Optional[dict]:
    """
    Dependency to get current user from JWT token
    Use this in route dependencies
    """
    if not credentials:
        return None

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_auth(request: Request, credentials: HTTPAuthorizationCredentials = security) -> dict:
    """
    Dependency to require authentication
    Raises 401 if no valid token
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
