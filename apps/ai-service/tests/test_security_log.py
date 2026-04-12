"""
Security Logging Tests for Visual PBL

Tests for:
- Security event creation
- Security logging functionality
- Event type and severity handling
- Integration with middleware
"""

import pytest
from unittest.mock import MagicMock, patch
from app.utils.security_log import (
    SecurityLogEvent,
    SecurityLogger,
    SecurityEventType,
    SecuritySeverity,
    log_security_event,
    security_log
)


class TestSecurityLogEvent:
    """Tests for SecurityLogEvent class."""

    def test_create_event_minimal(self):
        """Test creating event with minimal data."""
        event = SecurityLogEvent(
            event_type=SecurityEventType.SQL_INJECTION,
            severity=SecuritySeverity.HIGH,
            description="Test SQL injection"
        )

        assert event.event_type == SecurityEventType.SQL_INJECTION
        assert event.severity == SecuritySeverity.HIGH
        assert event.description == "Test SQL injection"

    def test_create_event_full(self):
        """Test creating event with all fields."""
        event = SecurityLogEvent(
            event_type=SecurityEventType.XSS_ATTEMPT,
            severity=SecuritySeverity.CRITICAL,
            description="XSS attack detected",
            ip_address="192.168.1.100",
            user_agent="Mozilla/5.0",
            user_id="user-123",
            request_path="/api/users",
            request_body={"name": "<script>alert(1)</script>"},
            metadata={"blocked": True}
        )

        assert event.ip_address == "192.168.1.100"
        assert event.user_agent == "Mozilla/5.0"
        assert event.user_id == "user-123"
        assert event.request_path == "/api/users"
        assert event.metadata["blocked"] is True

    def test_event_to_dict(self):
        """Test converting event to dictionary."""
        event = SecurityLogEvent(
            event_type=SecurityEventType.CSRF_FAILURE,
            severity=SecuritySeverity.MEDIUM,
            description="CSRF token mismatch"
        )

        data = event.to_dict()

        assert data["event_type"] == "csrf_failure"
        assert data["severity"] == "medium"
        assert data["description"] == "CSRF token mismatch"
        assert "timestamp" in data

    def test_event_to_json(self):
        """Test converting event to JSON."""
        event = SecurityLogEvent(
            event_type=SecurityEventType.RATE_LIMIT_EXCEEDED,
            severity=SecuritySeverity.LOW,
            description="Rate limit exceeded"
        )

        json_str = event.to_json()

        assert isinstance(json_str, str)
        assert "rate_limit_exceeded" in json_str
        assert "Rate limit exceeded" in json_str


class TestSecurityLogger:
    """Tests for SecurityLogger class."""

    @pytest.fixture
    def mock_logger(self):
        """Create mock logger."""
        return MagicMock()

    @pytest.fixture
    def security_logger(self, mock_logger):
        """Create SecurityLogger with mock."""
        return SecurityLogger(logger=mock_logger)

    def test_log_sql_injection(self, mock_logger, security_logger):
        """Test logging SQL injection attempt."""
        event = security_logger.log_sql_injection(
            ip_address="192.168.1.1",
            request_path="/api/users",
            payload="' OR 1=1 --"
        )

        assert event.event_type == SecurityEventType.SQL_INJECTION
        assert event.severity == SecuritySeverity.HIGH
        assert mock_logger.log.called
        call_args = mock_logger.log.call_args[0]
        assert call_args[0] >= 40  # ERROR level or higher

    def test_log_xss_attempt(self, mock_logger, security_logger):
        """Test logging XSS attempt."""
        event = security_logger.log_xss_attempt(
            ip_address="10.0.0.1",
            request_path="/api/comments",
            payload="<script>alert('xss')</script>"
        )

        assert event.event_type == SecurityEventType.XSS_ATTEMPT
        assert event.severity == SecuritySeverity.HIGH

    def test_log_csrf_failure(self, mock_logger, security_logger):
        """Test logging CSRF failure."""
        event = security_logger.log_csrf_failure(
            ip_address="172.16.0.1",
            request_path="/api/projects",
            reason="Token mismatch"
        )

        assert event.event_type == SecurityEventType.CSRF_FAILURE
        assert event.severity == SecuritySeverity.MEDIUM

    def test_log_rate_limit_exceeded(self, mock_logger, security_logger):
        """Test logging rate limit exceeded."""
        event = security_logger.log_rate_limit_exceeded(
            ip_address="192.168.1.50",
            request_path="/api/data",
            request_count=150,
            limit=100
        )

        assert event.event_type == SecurityEventType.RATE_LIMIT_EXCEEDED
        assert event.severity == SecuritySeverity.MEDIUM
        assert event.metadata["request_count"] == 150
        assert event.metadata["limit"] == 100

    def test_log_auth_failure(self, mock_logger, security_logger):
        """Test logging authentication failure."""
        event = security_logger.log_auth_failure(
            ip_address="192.168.1.100",
            request_path="/api/auth/login",
            reason="Invalid credentials"
        )

        assert event.event_type == SecurityEventType.AUTH_FAILURE
        assert event.severity == SecuritySeverity.MEDIUM

    def test_log_auth_failure_multiple_attempts(self, mock_logger, security_logger):
        """Test logging multiple auth failures."""
        event = security_logger.log_auth_failure(
            ip_address="192.168.1.100",
            request_path="/api/auth/login",
            reason="Multiple failed attempts - possible brute force"
        )

        assert event.severity == SecuritySeverity.HIGH

    def test_log_suspicious_activity(self, mock_logger, security_logger):
        """Test logging suspicious activity."""
        event = security_logger.log_suspicious_activity(
            ip_address="192.168.1.200",
            request_path="/api/admin",
            description="Unauthorized admin access attempt",
            metadata={"user_agent": "curl/7.68.0"}
        )

        assert event.event_type == SecurityEventType.SUSPICIOUS_ACTIVITY
        assert event.severity == SecuritySeverity.MEDIUM

    def test_log_encryption_error(self, mock_logger, security_logger):
        """Test logging encryption error."""
        event = security_logger.log_encryption_error(
            description="Failed to decrypt user data",
            user_id="user-456"
        )

        assert event.event_type == SecurityEventType.ENCRYPTION_ERROR
        assert event.severity == SecuritySeverity.HIGH


class TestSecurityEventType:
    """Tests for SecurityEventType enum."""

    def test_all_event_types(self):
        """Test all event types are defined."""
        assert SecurityEventType.SQL_INJECTION.value == "sql_injection"
        assert SecurityEventType.XSS_ATTEMPT.value == "xss_attempt"
        assert SecurityEventType.CSRF_FAILURE.value == "csrf_failure"
        assert SecurityEventType.RATE_LIMIT_EXCEEDED.value == "rate_limit_exceeded"
        assert SecurityEventType.AUTH_FAILURE.value == "auth_failure"
        assert SecurityEventType.INVALID_INPUT.value == "invalid_input"
        assert SecurityEventType.SUSPICIOUS_ACTIVITY.value == "suspicious_activity"
        assert SecurityEventType.ENCRYPTION_ERROR.value == "encryption_error"


class TestSecuritySeverity:
    """Tests for SecuritySeverity enum."""

    def test_all_severity_levels(self):
        """Test all severity levels are defined."""
        assert SecuritySeverity.LOW.value == "low"
        assert SecuritySeverity.MEDIUM.value == "medium"
        assert SecuritySeverity.HIGH.value == "high"
        assert SecuritySeverity.CRITICAL.value == "critical"


class TestLogSecurityEvent:
    """Tests for log_security_event convenience function."""

    @patch('app.utils.security_log.security_logger')
    def test_log_security_event(self, mock_logger):
        """Test logging generic security event."""
        event = log_security_event(
            event_type=SecurityEventType.INVALID_INPUT,
            severity=SecuritySeverity.LOW,
            description="Invalid input detected",
            ip_address="192.168.1.1"
        )

        assert event.event_type == SecurityEventType.INVALID_INPUT
        assert event.ip_address == "192.168.1.1"
        assert mock_logger.log.called


class TestSecurityLoggerIntegration:
    """Integration tests for security logging."""

    def test_global_security_logger(self):
        """Test global security logger instance."""
        assert security_log is not None
        assert isinstance(security_log, SecurityLogger)

    def test_multiple_loggers_independent(self):
        """Test that multiple loggers are independent."""
        logger1 = SecurityLogger(logger=MagicMock())
        logger2 = SecurityLogger(logger=MagicMock())

        logger1.log_sql_injection("1.1.1.1", "/api", "test")
        logger2.log_xss_attempt("2.2.2.2", "/api", "test")

        # Each should have their own mock logger called
        assert logger1._logger.log.called
        assert logger2._logger.log.called


class TestSecurityEventSeverityAssignment:
    """Tests for correct severity assignment."""

    @pytest.fixture
    def mock_logger(self):
        return MagicMock()

    @pytest.fixture
    def security_logger(self, mock_logger):
        return SecurityLogger(logger=mock_logger)

    def test_sql_injection_is_high_severity(self, security_logger):
        """Test SQL injection is logged as HIGH severity."""
        event = security_logger.log_sql_injection(
            ip_address="1.1.1.1",
            request_path="/api",
            payload="test"
        )
        assert event.severity == SecuritySeverity.HIGH

    def test_xss_attempt_is_high_severity(self, security_logger):
        """Test XSS attempt is logged as HIGH severity."""
        event = security_logger.log_xss_attempt(
            ip_address="1.1.1.1",
            request_path="/api",
            payload="test"
        )
        assert event.severity == SecuritySeverity.HIGH

    def test_csrf_failure_is_medium_severity(self, security_logger):
        """Test CSRF failure is logged as MEDIUM severity."""
        event = security_logger.log_csrf_failure(
            ip_address="1.1.1.1",
            request_path="/api",
            reason="test"
        )
        assert event.severity == SecuritySeverity.MEDIUM

    def test_rate_limit_is_medium_severity(self, security_logger):
        """Test rate limit exceeded is logged as MEDIUM severity."""
        event = security_logger.log_rate_limit_exceeded(
            ip_address="1.1.1.1",
            request_path="/api",
            request_count=100,
            limit=100
        )
        assert event.severity == SecuritySeverity.MEDIUM

    def test_encryption_error_is_high_severity(self, security_logger):
        """Test encryption error is logged as HIGH severity."""
        event = security_logger.log_encryption_error(
            description="test error"
        )
        assert event.severity == SecuritySeverity.HIGH


class TestSecurityEventMetadata:
    """Tests for security event metadata handling."""

    def test_metadata_preserved(self):
        """Test that metadata is preserved in event."""
        metadata = {
            "user_agent": "TestBrowser/1.0",
            "request_id": "req-123",
            "additional_info": {"key": "value"}
        }

        event = SecurityLogEvent(
            event_type=SecurityEventType.SUSPICIOUS_ACTIVITY,
            severity=SecuritySeverity.MEDIUM,
            description="Test event",
            metadata=metadata
        )

        assert event.metadata["user_agent"] == "TestBrowser/1.0"
        assert event.metadata["request_id"] == "req-123"
        assert event.metadata["additional_info"]["key"] == "value"

    def test_empty_metadata_default(self):
        """Test that empty metadata defaults to empty dict."""
        event = SecurityLogEvent(
            event_type=SecurityEventType.SQL_INJECTION,
            severity=SecuritySeverity.HIGH,
            description="Test"
        )

        assert event.metadata == {}
