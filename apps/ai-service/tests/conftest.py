"""
Test configuration and fixtures for FastAPI tests
"""
import pytest
from typing import Generator, Dict, Any
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """
    Create a test client for the FastAPI app
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def auth_headers() -> Dict[str, str]:
    """
    Return authorization headers with valid JWT token
    """
    from jose import jwt
    payload = {
        "userId": "test-user-123",
        "username": "testuser"
    }
    token = jwt.encode(payload, "visual-pbl-jwt-secret-key-change-in-production", algorithm="HS256")
    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def mock_db_connection() -> MagicMock:
    """
    Mock asyncpg database connection
    """
    mock_conn = AsyncMock()
    mock_conn.fetchrow = AsyncMock()
    mock_conn.fetch = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_conn.close = AsyncMock()
    return mock_conn


@pytest.fixture
def mock_db_pool() -> MagicMock:
    """
    Mock asyncpg connection pool
    """
    mock_pool = AsyncMock()
    mock_pool.acquire = MagicMock()
    mock_pool.release = AsyncMock()
    return mock_pool
