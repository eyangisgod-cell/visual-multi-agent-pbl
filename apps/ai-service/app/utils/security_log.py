"""
Security Logging Utility for Visual PBL

Provides security event logging for:
- SQL injection attempts
- XSS attack attempts
- CSRF token failures
- Rate limiting violations
- Authentication failures
- Other security events
"""

import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class SecurityEventType(str, Enum):
    """Types of security events."""
    SQL_INJECTION = "sql_injection"
    XSS_ATTEMPT = "xss_attempt"
    CSRF_FAILURE = "csrf_failure"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    AUTH_FAILURE = "auth_failure"
    INVALID_INPUT = "invalid_input"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    ENCRYPTION_ERROR = "encryption_error"


class SecuritySeverity(str, Enum):
    """Severity levels for security events."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Configure security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

# Create handler if not exists
if not security_logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    security_logger.addHandler(handler)


class SecurityLogEvent:
    """
    Security log event data structure.

    Attributes:
        event_type: Type of security event
        severity: Severity level
        description: Human-readable description
        ip_address: Client IP address
        user_agent: Client user agent string
        user_id: Associated user ID if authenticated
        request_path: Request URL path
        request_body: Request body if applicable
        metadata: Additional metadata
    """

    def __init__(
        self,
        event_type: SecurityEventType,
        severity: SecuritySeverity,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_id: Optional[str] = None,
        request_path: Optional[str] = None,
        request_body: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.event_type = event_type
        self.severity = severity
        self.description = description
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.user_id = user_id
        self.request_path = request_path
        self.request_body = request_body
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "event_type": self.event_type.value,
            "severity": self.severity.value,
            "description": self.description,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "user_id": self.user_id,
            "request_path": self.request_path,
            "request_body": self.request_body,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat()
        }

    def to_json(self) -> str:
        """Convert event to JSON string."""
        return json.dumps(self.to_dict())


class SecurityLogger:
    """
    Security event logger for Visual PBL.

    Usage:
        logger = SecurityLogger()
        logger.log_sql_injection(
            ip="192.168.1.1",
            request_path="/api/users",
            payload="' OR 1=1 --"
        )
    """

    def __init__(self, logger: Optional[logging.Logger] = None):
        """
        Initialize security logger.

        Args:
            logger: Optional custom logger instance
        """
        self._logger = logger or security_logger

    def _log_event(
        self,
        event: SecurityLogEvent,
        log_level: int = logging.WARNING
    ) -> None:
        """
        Log a security event.

        Args:
            event: Security event to log
            log_level: Logging level
        """
        self._logger.log(log_level, f"[{event.severity.value.upper()}] {event.event_type.value}: {event.description}")

    def log_sql_injection(
        self,
        ip_address: str,
        request_path: str,
        payload: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log SQL injection attempt.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            payload: SQL injection payload detected
            user_id: Associated user ID
            user_agent: Client user agent

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.SQL_INJECTION,
            severity=SecuritySeverity.HIGH,
            description=f"SQL injection attempt detected: {payload[:100]}",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path,
            metadata={"payload": payload}
        )
        self._log_event(event, logging.CRITICAL)
        return event

    def log_xss_attempt(
        self,
        ip_address: str,
        request_path: str,
        payload: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log XSS attack attempt.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            payload: XSS payload detected
            user_id: Associated user ID
            user_agent: Client user agent

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.XSS_ATTEMPT,
            severity=SecuritySeverity.HIGH,
            description=f"XSS attempt detected: {payload[:100]}",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path,
            metadata={"payload": payload}
        )
        self._log_event(event, logging.CRITICAL)
        return event

    def log_csrf_failure(
        self,
        ip_address: str,
        request_path: str,
        reason: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log CSRF token validation failure.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            reason: Reason for failure
            user_id: Associated user ID
            user_agent: Client user agent

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.CSRF_FAILURE,
            severity=SecuritySeverity.MEDIUM,
            description=f"CSRF validation failed: {reason}",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path
        )
        self._log_event(event, logging.WARNING)
        return event

    def log_rate_limit_exceeded(
        self,
        ip_address: str,
        request_path: str,
        request_count: int,
        limit: int,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log rate limit exceeded.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            request_count: Number of requests made
            limit: Rate limit threshold
            user_id: Associated user ID
            user_agent: Client user agent

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
            severity=SecuritySeverity.MEDIUM,
            description=f"Rate limit exceeded: {request_count}/{limit} requests",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path,
            metadata={"request_count": request_count, "limit": limit}
        )
        self._log_event(event, logging.INFO)
        return event

    def log_auth_failure(
        self,
        ip_address: str,
        request_path: str,
        reason: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log authentication failure.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            reason: Reason for failure
            user_id: Associated user ID
            user_agent: Client user agent

        Returns:
            Created security event
        """
        severity = SecuritySeverity.MEDIUM
        if "invalid" in reason.lower() or "expired" in reason.lower():
            severity = SecuritySeverity.LOW
        elif "brute" in reason.lower() or "multiple" in reason.lower():
            severity = SecuritySeverity.HIGH

        event = SecurityLogEvent(
            event_type=SecurityEventType.AUTH_FAILURE,
            severity=severity,
            description=f"Authentication failed: {reason}",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path
        )
        self._log_event(event, logging.WARNING)
        return event

    def log_suspicious_activity(
        self,
        ip_address: str,
        request_path: str,
        description: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SecurityLogEvent:
        """
        Log suspicious activity.

        Args:
            ip_address: Client IP address
            request_path: Request URL path
            description: Description of suspicious activity
            user_id: Associated user ID
            user_agent: Client user agent
            metadata: Additional metadata

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            severity=SecuritySeverity.MEDIUM,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user_id,
            request_path=request_path,
            metadata=metadata or {}
        )
        self._log_event(event, logging.WARNING)
        return event

    def log_encryption_error(
        self,
        description: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> SecurityLogEvent:
        """
        Log encryption/decryption error.

        Args:
            description: Description of error
            user_id: Associated user ID
            ip_address: Client IP address

        Returns:
            Created security event
        """
        event = SecurityLogEvent(
            event_type=SecurityEventType.ENCRYPTION_ERROR,
            severity=SecuritySeverity.HIGH,
            description=description,
            ip_address=ip_address,
            user_id=user_id
        )
        self._log_event(event, logging.ERROR)
        return event


# Global security logger instance
security_log = SecurityLogger()


def log_security_event(
    event_type: SecurityEventType,
    severity: SecuritySeverity,
    description: str,
    ip_address: Optional[str] = None,
    **kwargs
) -> SecurityLogEvent:
    """
    Convenience function to log any security event.

    Args:
        event_type: Type of security event
        severity: Severity level
        description: Event description
        ip_address: Client IP address
        **kwargs: Additional event parameters

    Returns:
        Created security event
    """
    event = SecurityLogEvent(
        event_type=event_type,
        severity=severity,
        description=description,
        ip_address=ip_address,
        **kwargs
    )

    log_level = logging.INFO
    if severity == SecuritySeverity.CRITICAL:
        log_level = logging.CRITICAL
    elif severity == SecuritySeverity.HIGH:
        log_level = logging.ERROR
    elif severity == SecuritySeverity.MEDIUM:
        log_level = logging.WARNING

    security_logger.log(log_level, f"[{severity.value.upper()}] {event_type.value}: {description}")
    return event
