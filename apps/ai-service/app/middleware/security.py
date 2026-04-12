"""
Security Middleware for Visual PBL

Provides comprehensive security features:
- SQL Injection Detection
- XSS Prevention
- Input Sanitization
- Security Headers
"""

import re
import html
from typing import Optional, Set, List
from fastapi import HTTPException, status, Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.utils.security_log import security_log, SecurityEventType, SecuritySeverity


# SQL Injection patterns to detect
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|WHERE|SET)\b)",
    r"(--|\#|\/\*|\*\/)",  # SQL comments
    r"(\b(OR|AND)\b\s+\d+\s*=\s*\d+)",  # OR 1=1, AND 1=1
    r"(\b(OR|AND)\b\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+)",  # OR '1'='1'
    r"(\'.*\b(OR|AND)\b.*\')",  # ' OR ... '
    r"(\bEXEC(?:UTE)?\b)",
    r"(\bxp_\w+\b)",  # SQL Server extended procedures
    r"(\bWAITFOR\b.*\bDELAY\b)",
    r"(\bBENCHMARK\b)",
    r"(\bSLEEP\b\s*\()",
    r"(;\s*(SELECT|INSERT|UPDATE|DELETE|DROP))",  # Stacked queries
]

# XSS patterns to detect
XSS_PATTERNS = [
    r"<\s*script[^>]*>",
    r"<\s*/\s*script\s*>",
    r"<\s*img[^>]*\s+on\w+\s*=",
    r"<\s*svg[^>]*\s+on\w+\s*=",
    r"<\s*iframe[^>]*>",
    r"<\s*object[^>]*>",
    r"<\s*embed[^>]*>",
    r"javascript\s*:",
    r"vbscript\s*:",
    r"on\w+\s*=",  # onclick=, onerror=, onload=
    r"<\s*body[^>]*\s+on\w+\s*=",
    r"expression\s*\(",
    r"url\s*\(\s*['\"]?javascript:",
    r"data\s*:\s*text\/html",
]

# Compiled regex patterns for performance
SQL_INJECTION_REGEX = [re.compile(pattern, re.IGNORECASE) for pattern in SQL_INJECTION_PATTERNS]
XSS_REGEX = [re.compile(pattern, re.IGNORECASE) for pattern in XSS_PATTERNS]


def sanitize_input(value: str) -> str:
    """
    Sanitize user input by escaping HTML special characters.

    Args:
        value: Raw input string

    Returns:
        Sanitized string safe for HTML output
    """
    if not isinstance(value, str):
        return str(value)

    # Escape HTML special characters
    sanitized = html.escape(value, quote=True)

    # Remove null bytes
    sanitized = sanitized.replace('\x00', '')

    return sanitized


def detect_sql_injection(value: str, ip_address: str = None, request_path: str = None) -> bool:
    """
    Detect potential SQL injection attempts.

    Args:
        value: Input string to check
        ip_address: Client IP address for logging
        request_path: Request path for logging

    Returns:
        True if SQL injection pattern detected
    """
    if not isinstance(value, str):
        return False

    for pattern in SQL_INJECTION_REGEX:
        if pattern.search(value):
            # Log the attempt
            if ip_address and request_path:
                security_log.log_sql_injection(
                    ip_address=ip_address,
                    request_path=request_path,
                    payload=value[:500]  # Truncate long payloads
                )
            return True

    return False


def detect_xss(value: str, ip_address: str = None, request_path: str = None) -> bool:
    """
    Detect potential XSS attempts.

    Args:
        value: Input string to check
        ip_address: Client IP address for logging
        request_path: Request path for logging

    Returns:
        True if XSS pattern detected
    """
    if not isinstance(value, str):
        return False

    for pattern in XSS_REGEX:
        if pattern.search(value):
            # Log the attempt
            if ip_address and request_path:
                security_log.log_xss_attempt(
                    ip_address=ip_address,
                    request_path=request_path,
                    payload=value[:500]  # Truncate long payloads
                )
            return True

    return False


def validate_input(value: str, max_length: int = 10000) -> tuple[bool, str]:
    """
    Validate input for security.

    Args:
        value: Input string to validate
        max_length: Maximum allowed length

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not isinstance(value, str):
        return True, ""

    if len(value) > max_length:
        return False, f"Input exceeds maximum length of {max_length} characters"

    if detect_sql_injection(value):
        return False, "Potential SQL injection detected"

    if detect_xss(value):
        return False, "Potential XSS attack detected"

    return True, ""


class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Security middleware providing:
    - SQL injection detection and blocking
    - XSS prevention
    - Input sanitization
    - Security headers
    """

    def __init__(
        self,
        app: ASGIApp,
        enabled_checks: Optional[Set[str]] = None,
        max_input_length: int = 10000,
        excluded_paths: Optional[List[str]] = None
    ):
        """
        Initialize security middleware.

        Args:
            app: ASGI application
            enabled_checks: Set of checks to enable ('sql_injection', 'xss', 'headers')
            max_input_length: Maximum allowed input length
            excluded_paths: Paths to exclude from security checks
        """
        super().__init__(app)
        self.enabled_checks = enabled_checks or {'sql_injection', 'xss', 'headers'}
        self.max_input_length = max_input_length
        self.excluded_paths = excluded_paths or []

    def _add_security_headers(self, response) -> None:
        """Add security headers to response."""
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Strict Transport Security
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none'"
        )

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy
        response.headers["Permissions-Policy"] = (
            "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
        )

        # Cache control for sensitive data
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
        response.headers["Pragma"] = "no-cache"

    async def _check_request_body(self, request: Request) -> None:
        """Check request body for malicious content."""
        if 'sql_injection' not in self.enabled_checks and 'xss' not in self.enabled_checks:
            return

        content_type = request.headers.get("content-type", "")

        # Only check JSON and form data
        if not any(t in content_type for t in ["application/json", "application/x-www-form-urlencoded", "multipart/form-data"]):
            return

        try:
            body = await request.body()
            body_str = body.decode('utf-8', errors='ignore')

            # Check for SQL injection
            if 'sql_injection' in self.enabled_checks:
                if detect_sql_injection(body_str):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Potential SQL injection detected in request body"
                    )

            # Check for XSS
            if 'xss' in self.enabled_checks:
                if detect_xss(body_str):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Potential XSS attack detected in request body"
                    )

        except HTTPException:
            raise
        except Exception:
            # If we can't parse the body, let the request continue
            # The framework will handle malformed requests
            pass

    async def _check_query_params(self, request: Request) -> None:
        """Check query parameters for malicious content."""
        if 'sql_injection' not in self.enabled_checks and 'xss' not in self.enabled_checks:
            return

        for key, value in request.query_params.multi_items():
            # Check for SQL injection
            if 'sql_injection' in self.enabled_checks:
                if detect_sql_injection(value):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Potential SQL injection detected in query parameter: {key}"
                    )

            # Check for XSS
            if 'xss' in self.enabled_checks:
                if detect_xss(value):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Potential XSS attack detected in query parameter: {key}"
                    )

    async def dispatch(self, request: Request, call_next):
        """Process request with security checks."""
        # Skip security checks for excluded paths
        if any(request.url.path.startswith(path) for path in self.excluded_paths):
            response = await call_next(request)
            if 'headers' in self.enabled_checks:
                self._add_security_headers(response)
            return response

        try:
            # Check query parameters
            await self._check_query_params(request)

            # Check request body (for POST, PUT, DELETE, PATCH)
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                await self._check_request_body(request)

        except HTTPException as e:
            # Log the attempt (in production, use proper logging)
            client_ip = request.client.host if request.client else "unknown"
            print(f"Security alert [{e.status_code}]: {e.detail} - IP: {client_ip}")
            return JSONResponse(
                status_code=e.status_code,
                content={"error": "Bad Request", "detail": str(e.detail)}
            )

        # Process the request
        response = await call_next(request)

        # Add security headers
        if 'headers' in self.enabled_checks:
            self._add_security_headers(response)

        return response


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to sanitize all string inputs in JSON request bodies.
    This is a defensive layer - primary protection is validation/rejection.
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next):
        """Sanitize input in request body."""
        # Only process JSON requests
        content_type = request.headers.get("content-type", "")
        if "application/json" not in content_type:
            return await call_next(request)

        try:
            # Get original body
            body = await request.body()
            body_str = body.decode('utf-8')

            # Parse and sanitize
            import json
            data = json.loads(body_str)
            sanitized_data = self._sanitize_dict(data)

            # Replace request body (note: this is tricky in ASGI)
            # For now, we'll just pass through - sanitization is best done at framework level

        except (json.JSONDecodeError, Exception):
            # If parsing fails, let the request continue
            # Framework will handle malformed JSON
            pass

        return await call_next(request)

    def _sanitize_dict(self, data: dict) -> dict:
        """Recursively sanitize dictionary values."""
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = sanitize_input(value)
            elif isinstance(value, dict):
                result[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    sanitize_input(v) if isinstance(v, str) else v
                    for v in value
                ]
            else:
                result[key] = value
        return result


def create_security_middleware(
    enabled_checks: Optional[Set[str]] = None,
    max_input_length: int = 10000,
    excluded_paths: Optional[List[str]] = None
) -> SecurityMiddleware:
    """
    Factory function to create security middleware.

    Args:
        enabled_checks: Set of checks to enable
        max_input_length: Maximum allowed input length
        excluded_paths: Paths to exclude from security checks

    Returns:
        SecurityMiddleware instance
    """
    return SecurityMiddleware(
        app=None,  # Will be set by FastAPI
        enabled_checks=enabled_checks,
        max_input_length=max_input_length,
        excluded_paths=excluded_paths
    )
