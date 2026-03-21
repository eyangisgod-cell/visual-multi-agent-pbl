"""
Tests for FastAPI authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock


class TestVerifyToken:
    """Tests for POST /api/v1/auth/verify endpoint"""

    def test_verify_valid_token(self, client: TestClient, valid_jwt_token: str):
        """Test verifying a valid JWT token"""
        response = client.post(
            "/api/v1/auth/verify",
            json={"token": valid_jwt_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["user_id"] == "test-user-123"
        assert data["username"] == "testuser"

    def test_verify_invalid_token(self, client: TestClient, invalid_jwt_token: str):
        """Test verifying an invalid JWT token"""
        response = client.post(
            "/api/v1/auth/verify",
            json={"token": invalid_jwt_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["user_id"] is None
        assert data["username"] is None

    def test_verify_empty_token(self, client: TestClient):
        """Test verifying an empty token"""
        response = client.post(
            "/api/v1/auth/verify",
            json={"token": ""}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    def test_verify_missing_token(self, client: TestClient):
        """Test request with missing token field"""
        response = client.post(
            "/api/v1/auth/verify",
            json={}
        )

        assert response.status_code == 422  # Validation error

    def test_verify_expired_token(self, client: TestClient):
        """Test verifying an expired JWT token"""
        from jose import jwt
        from datetime import datetime, timedelta

        # Create an expired token
        payload = {
            "userId": "test-user-123",
            "username": "testuser",
            "exp": datetime.utcnow() - timedelta(hours=1)
        }
        expired_token = jwt.encode(
            payload,
            "visual-pbl-jwt-secret-key-change-in-production",
            algorithm="HS256"
        )

        response = client.post(
            "/api/v1/auth/verify",
            json={"token": expired_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False


class TestGetMe:
    """Tests for GET /api/v1/auth/me endpoint"""

    def test_get_current_user_info(self, client: TestClient, auth_headers: Dict, sample_user_data: Dict):
        """Test getting current user info with valid token"""
        with patch('app.api.auth.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_user_data)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get("/api/v1/auth/me", headers=auth_headers)

            assert response.status_code == 200
            data = response.json()
            assert "user" in data
            assert data["user"]["id"] == sample_user_data["id"]
            assert data["user"]["username"] == sample_user_data["username"]

    def test_get_current_user_info_not_found(self, client: TestClient, auth_headers: Dict):
        """Test getting current user info when user not found"""
        with patch('app.api.auth.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get("/api/v1/auth/me", headers=auth_headers)

            assert response.status_code == 404

    def test_get_current_user_info_no_auth(self, client: TestClient):
        """Test getting current user info without authentication"""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_get_current_user_info_invalid_token(self, client: TestClient, invalid_jwt_token: str):
        """Test getting current user info with invalid token"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {invalid_jwt_token}"}
        )

        assert response.status_code == 401

    def test_get_current_user_info_db_error(self, client: TestClient, auth_headers: Dict):
        """Test getting current user info with database error"""
        with patch('app.api.auth.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = Exception("Database connection error")

            response = client.get("/api/v1/auth/me", headers=auth_headers)

            assert response.status_code == 500
