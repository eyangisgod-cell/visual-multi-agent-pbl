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
    mock_pool.acquire = AsyncMock()
    mock_pool.release = AsyncMock()
    return mock_pool


@pytest.fixture
def valid_jwt_token() -> str:
    """
    Return a valid JWT token for testing
    """
    from jose import jwt
    payload = {
        "userId": "test-user-123",
        "username": "testuser"
    }
    return jwt.encode(payload, "visual-pbl-jwt-secret-key-change-in-production", algorithm="HS256")


@pytest.fixture
def invalid_jwt_token() -> str:
    """
    Return an invalid JWT token for testing
    """
    return "invalid.token.here"


@pytest.fixture
def auth_headers(valid_jwt_token: str) -> Dict[str, str]:
    """
    Return authorization headers with valid JWT token
    """
    return {
        "Authorization": f"Bearer {valid_jwt_token}"
    }


@pytest.fixture
def sample_user_data() -> Dict[str, Any]:
    """
    Sample user data for testing
    """
    return {
        "id": "test-user-123",
        "username": "testuser",
        "nickname": "Test User",
        "grade": 5,
        "invitation_code": "ABCD1234"
    }


@pytest.fixture
def sample_project_data() -> Dict[str, Any]:
    """
    Sample project data for testing
    """
    return {
        "id": "test-project-123",
        "title": "Test Project",
        "description": "A test project description",
        "grade_min": 3,
        "grade_max": 6,
        "subject": "Science",
        "difficulty": 2,
        "status": "draft",
        "rubric_criteria": None
    }


@pytest.fixture
def sample_task_data() -> Dict[str, Any]:
    """
    Sample task data for testing
    """
    return {
        "id": "test-task-123",
        "project_id": "test-project-123",
        "title": "Test Task",
        "description": "A test task description",
        "status": "todo",
        "order_index": 0,
        "agent_type": "guide",
        "assigned_to": "test-user-123"
    }
