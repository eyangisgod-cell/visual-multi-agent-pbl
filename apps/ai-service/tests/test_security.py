"""
Security Tests for AI Service

Tests for:
- Rate limiting
- SQL injection protection
- XSS protection
- CSRF token validation
"""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from unittest.mock import AsyncMock, patch, MagicMock


# Test client setup
@pytest.fixture
async def client():
    """Create async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


class TestRateLimiting:
    """Tests for rate limiting functionality."""

    @pytest.mark.asyncio
    async def test_rate_limit_headers_present(self, client):
        """Test that rate limit headers are present in responses."""
        # Mock Redis to avoid actual Redis connection
        with patch('app.middleware.rate_limit.RateLimitMiddleware._get_redis') as mock_redis:
            mock_redis.return_value = MagicMock()
            mock_redis.return_value.zcard = AsyncMock(return_value=10)
            mock_redis.return_value.zcount = AsyncMock(return_value=10)
            mock_redis.return_value.pipeline = MagicMock()

            mock_pipe = MagicMock()
            mock_pipe.zremrangebyscore = AsyncMock()
            mock_pipe.zadd = AsyncMock()
            mock_pipe.expire = AsyncMock()
            mock_pipe.zcard = AsyncMock(return_value=10)
            mock_pipe.execute = AsyncMock(return_value=[None, None, None, 10])
            mock_pipe.__aenter__ = AsyncMock(return_value=mock_pipe)
            mock_pipe.__aexit__ = AsyncMock(return_value=None)
            mock_redis.return_value.pipeline.return_value = mock_pipe

            response = await client.get("/api/v1/health")

            # Should have rate limit headers
            assert "x-ratelimit-limit" in response.headers
            assert "x-ratelimit-remaining" in response.headers
            assert "x-ratelimit-reset" in response.headers

    @pytest.mark.asyncio
    async def test_rate_limit_excluded_paths(self, client):
        """Test that health endpoint is excluded from rate limiting."""
        response = await client.get("/api/v1/health")

        # Health endpoint should always be accessible
        assert response.status_code == 200


class TestSQLInjectionProtection:
    """Tests for SQL injection protection."""

    @pytest.mark.asyncio
    async def test_sql_injection_in_query_params(self, client):
        """Test that SQL injection in query params is blocked."""
        injection_payloads = [
            "1'; DROP TABLE projects; --",
            "1' OR '1'='1",
            "1; DELETE FROM projects",
            "' UNION SELECT * FROM users --",
            "1' AND 1=1 --"
        ]

        for payload in injection_payloads:
            response = await client.get(f"/api/v1/projects?search={payload}")

            # Should return 400 Bad Request, not 500 Server Error
            assert response.status_code in [400, 401, 403, 404], \
                f"SQL injection payload was not blocked: {payload}"

    @pytest.mark.asyncio
    async def test_sql_injection_in_path(self, client):
        """Test that SQL injection in path is handled safely."""
        injection_payloads = [
            "1'; DROP TABLE projects; --",
            "1' OR '1'='1",
            "admin'--"
        ]

        for payload in injection_payloads:
            response = await client.get(f"/api/v1/projects/{payload}")

            # Should not cause server error
            assert response.status_code != 500, \
                f"SQL injection in path caused server error: {payload}"

    @pytest.mark.asyncio
    async def test_sql_injection_in_post_body(self, client):
        """Test that SQL injection in POST body is blocked."""
        injection_payloads = [
            "'; DROP TABLE projects; --",
            "' OR 1=1 --",
            "1; DELETE FROM projects"
        ]

        for payload in injection_payloads:
            response = await client.post(
                "/api/v1/projects",
                json={
                    "title": f"Test {payload}",
                    "description": "Test project"
                }
            )

            # Should return 400 for SQL injection
            assert response.status_code == 400, \
                f"SQL injection in POST body was not blocked: {payload}"


class TestXSSProtection:
    """Tests for XSS protection."""

    @pytest.mark.asyncio
    async def test_xss_in_query_params(self, client):
        """Test that XSS in query params is blocked."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
            "<svg onload=alert('xss')>"
        ]

        for payload in xss_payloads:
            response = await client.get(f"/api/v1/projects?search={payload}")

            # Should return 400 Bad Request
            assert response.status_code == 400, \
                f"XSS payload was not blocked: {payload}"

    @pytest.mark.asyncio
    async def test_xss_in_post_body(self, client):
        """Test that XSS in POST body is blocked."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=fetch('http://evil.com/')>",
            "<iframe src='javascript:alert(1)'>"
        ]

        for payload in xss_payloads:
            response = await client.post(
                "/api/v1/projects",
                json={
                    "title": "Test Project",
                    "description": payload
                }
            )

            # Should return 400 for XSS
            assert response.status_code == 400, \
                f"XSS payload in POST body was not blocked: {payload}"

    @pytest.mark.asyncio
    async def test_security_headers_present(self, client):
        """Test that security headers are present in responses."""
        response = await client.get("/api/v1/health")

        # Check for security headers
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-xss-protection") == "1; mode=block"
        assert "strict-transport-security" in response.headers
        assert "content-security-policy" in response.headers


class TestCSRFProtection:
    """Tests for CSRF token protection."""

    @pytest.mark.asyncio
    async def test_csrf_token_required_for_post(self, client):
        """Test that CSRF token is required for POST requests."""
        response = await client.post(
            "/api/v1/projects",
            json={
                "title": "Test Project",
                "description": "Test"
            }
        )

        # Should require CSRF token (403 Forbidden)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_csrf_token_required_for_delete(self, client):
        """Test that CSRF token is required for DELETE requests."""
        response = await client.delete("/api/v1/projects/test-id")

        # Should require CSRF token (403 Forbidden)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_csrf_token_required_for_put(self, client):
        """Test that CSRF token is required for PUT requests."""
        response = await client.put(
            "/api/v1/projects/test-id",
            json={"title": "Updated"}
        )

        # Should require CSRF token (403 Forbidden)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_csrf_get_excluded(self, client):
        """Test that GET requests don't require CSRF token."""
        # Mock Redis for rate limiting
        with patch('app.middleware.rate_limit.RateLimitMiddleware._get_redis') as mock_redis:
            mock_redis.return_value = MagicMock()
            mock_redis.return_value.zcard = AsyncMock(return_value=10)
            mock_redis.return_value.zcount = AsyncMock(return_value=10)

            response = await client.get("/api/v1/health")

            # GET should work without CSRF token
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_csrf_token_accepted_with_valid_header(self, client):
        """Test that valid CSRF token is accepted."""
        # First, get a CSRF token from cookie
        # Mock Redis for rate limiting
        with patch('app.middleware.rate_limit.RateLimitMiddleware._get_redis') as mock_redis:
            mock_redis.return_value = MagicMock()
            mock_redis.return_value.zcard = AsyncMock(return_value=10)
            mock_redis.return_value.zcount = AsyncMock(return_value=10)

            # Make a GET request to get CSRF cookie
            get_response = await client.get("/api/v1/health")

            # Extract CSRF token from response cookies
            csrf_token = get_response.cookies.get('csrf-token')

            if csrf_token:
                # Now make POST with valid CSRF token
                response = await client.post(
                    "/api/v1/projects",
                    json={"title": "Test", "description": "Test"},
                    headers={"x-csrf-token": csrf_token},
                    cookies={"csrf-token": csrf_token}
                )

                # Should not be 403 (may be 400 for invalid data, but not 403 for CSRF)
                assert response.status_code != 403


class TestInputValidation:
    """Tests for input validation."""

    @pytest.mark.asyncio
    async def test_oversized_input_rejected(self, client):
        """Test that oversized input is rejected."""
        oversized_title = "a" * 10001  # Exceeds 10000 char limit

        response = await client.post(
            "/api/v1/projects",
            json={
                "title": oversized_title,
                "description": "Test"
            }
        )

        # Should be rejected
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_null_bytes_rejected(self, client):
        """Test that null bytes in input are handled safely."""
        response = await client.post(
            "/api/v1/projects",
            json={
                "title": "Test\x00Project",
                "description": "Test"
            }
        )

        # Should handle safely (either reject or sanitize)
        assert response.status_code in [200, 201, 400]


class TestSecurityMiddlewareIntegration:
    """Integration tests for security middleware."""

    @pytest.mark.asyncio
    async def test_multiple_security_layers_work_together(self, client):
        """Test that rate limiting, SQL injection, XSS, and CSRF work together."""
        # Mock Redis
        with patch('app.middleware.rate_limit.RateLimitMiddleware._get_redis') as mock_redis:
            mock_redis.return_value = MagicMock()
            mock_redis.return_value.zcard = AsyncMock(return_value=10)
            mock_redis.return_value.zcount = AsyncMock(return_value=10)

            # Test 1: Request without CSRF should fail
            response = await client.post(
                "/api/v1/projects",
                json={"title": "<script>alert(1)</script>", "description": "Test"}
            )
            assert response.status_code == 403  # CSRF failure

            # Test 2: Request with CSRF but XSS should fail XSS check first
            get_response = await client.get("/api/v1/health")
            csrf_token = get_response.cookies.get('csrf-token')

            if csrf_token:
                response = await client.post(
                    "/api/v1/projects",
                    json={"title": "<script>alert(1)</script>", "description": "Test"},
                    headers={"x-csrf-token": csrf_token},
                    cookies={"csrf-token": csrf_token}
                )
                # Should fail XSS check
                assert response.status_code == 400
