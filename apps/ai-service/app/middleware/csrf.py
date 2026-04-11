"""
CSRF Token Protection Middleware

Implements Double Submit Cookie pattern for CSRF protection.
"""

import secrets
import hashlib
from typing import Optional
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware using Double Submit Cookie pattern.

    How it works:
    1. Generate a random token on first request
    2. Set token in HTTP-only cookie
    3. Client must send token in X-CSRF-Token header
    4. Compare cookie value with header value
    """

    def __init__(
        self,
        app: ASGIApp,
        cookie_name: str = "csrf-token",
        header_name: str = "x-csrf-token",
        token_length: int = 32,
        excluded_paths: Optional[list] = None,
        safe_methods: Optional[list] = None
    ):
        """
        Initialize CSRF middleware.

        Args:
            app: ASGI application
            cookie_name: Name of CSRF cookie
            header_name: Name of CSRF header
            token_length: Length of random token
            excluded_paths: Paths to exclude from CSRF protection
            safe_methods: HTTP methods that don't require CSRF protection
        """
        super().__init__(app)
        self.cookie_name = cookie_name
        self.header_name = header_name
        self.token_length = token_length
        self.excluded_paths = excluded_paths or ["/api/v1/health", "/health", "/", "/api/v1/auth/verify"]
        self.safe_methods = safe_methods or ["GET", "HEAD", "OPTIONS"]

    def _generate_token(self) -> str:
        """Generate a secure random token."""
        return secrets.token_hex(self.token_length)

    def _get_token_from_cookie(self, request: Request) -> Optional[str]:
        """Extract CSRF token from cookie."""
        cookie = request.cookies.get(self.cookie_name)
        if cookie:
            return cookie
        return None

    def _get_token_from_header(self, request: Request) -> Optional[str]:
        """Extract CSRF token from header."""
        return request.headers.get(self.header_name)

    def _is_path_excluded(self, path: str) -> bool:
        """Check if path is excluded from CSRF protection."""
        return any(path.startswith(excluded) for excluded in self.excluded_paths)

    async def dispatch(self, request: Request, call_next):
        """Process request with CSRF protection."""
        # Skip CSRF checks for excluded paths
        if self._is_path_excluded(request.url.path):
            response = await call_next(request)
            return response

        # Skip CSRF checks for safe methods
        if request.method in self.safe_methods:
            response = await call_next(request)
            # Set CSRF cookie if not present
            if not request.cookies.get(self.cookie_name):
                token = self._generate_token()
                response.set_cookie(
                    key=self.cookie_name,
                    value=token,
                    max_age=3600,  # 1 hour
                    httponly=True,
                    secure=True,  # Only send over HTTPS
                    samesite="strict",
                    path="/"
                )
            return response

        # For state-changing methods (POST, PUT, DELETE, PATCH)
        # verify CSRF token
        cookie_token = self._get_token_from_cookie(request)
        header_token = self._get_token_from_header(request)

        # If no cookie token, generate one and reject the request
        if not cookie_token:
            response = JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "error": "CSRF token missing",
                    "detail": "No CSRF token found in cookie. Please make a GET request first to obtain a token."
                },
                headers={"X-CSRF-Token-Required": "true"}
            )
            token = self._generate_token()
            response.set_cookie(
                key=self.cookie_name,
                value=token,
                max_age=3600,
                httponly=True,
                secure=True,
                samesite="strict",
                path="/"
            )
            return response

        # If no header token, reject
        if not header_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"CSRF token missing. Please send {self.header_name} header with your request."
            )

        # Compare tokens using constant-time comparison
        if not secrets.compare_digest(cookie_token, header_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed. Token mismatch."
            )

        # Token validated successfully
        response = await call_next(request)
        return response


def create_csrf_middleware(
    cookie_name: str = "csrf-token",
    header_name: str = "x-csrf-token",
    excluded_paths: Optional[list] = None,
    safe_methods: Optional[list] = None
) -> CSRFMiddleware:
    """
    Factory function to create CSRF middleware.

    Args:
        cookie_name: Name of CSRF cookie
        header_name: Name of CSRF header
        excluded_paths: Paths to exclude from CSRF protection
        safe_methods: HTTP methods that don't require CSRF protection

    Returns:
        CSRFMiddleware instance
    """
    return CSRFMiddleware(
        app=None,  # Will be set by FastAPI
        cookie_name=cookie_name,
        header_name=header_name,
        excluded_paths=excluded_paths,
        safe_methods=safe_methods
    )
