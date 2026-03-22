"""
Tests for FastAPI tasks endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock
from datetime import datetime


class TestListTasks:
    """Tests for GET /api/v1/tasks endpoint"""

    def test_list_tasks_success(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test listing all tasks"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[sample_task_data])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get("/api/v1/tasks", headers=auth_headers)

            assert response.status_code == 200
            data = response.json()
            assert "tasks" in data
            assert len(data["tasks"]) == 1
            assert data["tasks"][0]["id"] == sample_task_data["id"]

    def test_list_tasks_by_project(self, client: TestClient, auth_headers: Dict):
        """Test listing tasks filtered by project"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/tasks?projectId=test-project-123",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_list_tasks_by_assignee(self, client: TestClient, auth_headers: Dict):
        """Test listing tasks filtered by assignee"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/tasks?assignedTo=test-user-123",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_list_tasks_by_status(self, client: TestClient, auth_headers: Dict):
        """Test listing tasks filtered by status"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/tasks?status_filter=todo",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_list_tasks_no_auth(self, client: TestClient):
        """Test listing tasks without authentication"""
        response = client.get("/api/v1/tasks")

        assert response.status_code == 401


class TestGetTask:
    """Tests for GET /api/v1/tasks/{task_id} endpoint"""

    def test_get_task_success(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test getting a single task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_task_data)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/tasks/test-task-123",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "task" in data
            assert data["task"]["id"] == sample_task_data["id"]

    def test_get_task_not_found(self, client: TestClient, auth_headers: Dict):
        """Test getting a non-existent task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/tasks/non-existent",
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_get_task_no_auth(self, client: TestClient):
        """Test getting a task without authentication"""
        response = client.get("/api/v1/tasks/test-task-123")

        assert response.status_code == 401


class TestCreateTask:
    """Tests for POST /api/v1/tasks endpoint"""

    def test_create_task_success(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test creating a new task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.execute = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_task_data)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            task_data = {
                "projectId": "test-project-123",
                "title": "New Task",
                "description": "Task description",
                "orderIndex": 0
            }

            response = client.post(
                "/api/v1/tasks",
                json=task_data,
                headers=auth_headers
            )

            assert response.status_code == 201
            data = response.json()
            assert "task" in data
            assert data["task"]["title"] == "New Task"

    def test_create_task_missing_required_fields(self, client: TestClient, auth_headers: Dict):
        """Test creating a task without required fields"""
        response = client.post(
            "/api/v1/tasks",
            json={"title": "Missing projectId and orderIndex"},
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_create_task_invalid_order_index(self, client: TestClient, auth_headers: Dict):
        """Test creating a task with negative order index"""
        response = client.post(
            "/api/v1/tasks",
            json={
                "projectId": "test-project-123",
                "title": "Test",
                "orderIndex": -1
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_create_task_no_auth(self, client: TestClient):
        """Test creating a task without authentication"""
        response = client.post(
            "/api/v1/tasks",
            json={"projectId": "test-123", "title": "Test", "orderIndex": 0}
        )

        assert response.status_code == 401


class TestUpdateTask:
    """Tests for PUT /api/v1/tasks/{task_id} endpoint"""

    def test_update_task_success(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test updating a task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_task_data)
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            update_data = {
                "title": "Updated Task",
                "status": "in_progress"
            }

            response = client.put(
                "/api/v1/tasks/test-task-123",
                json=update_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "task" in data

    def test_update_task_not_found(self, client: TestClient, auth_headers: Dict):
        """Test updating a non-existent task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.put(
                "/api/v1/tasks/non-existent",
                json={"title": "Updated"},
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_update_task_no_auth(self, client: TestClient):
        """Test updating a task without authentication"""
        response = client.put(
            "/api/v1/tasks/test-task-123",
            json={"title": "Updated"}
        )

        assert response.status_code == 401


class TestDeleteTask:
    """Tests for DELETE /api/v1/tasks/{task_id} endpoint"""

    def test_delete_task_success(self, client: TestClient, auth_headers: Dict):
        """Test deleting a task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.delete(
                "/api/v1/tasks/test-task-123",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_delete_task_not_found(self, client: TestClient, auth_headers: Dict):
        """Test deleting a non-existent task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.delete(
                "/api/v1/tasks/non-existent",
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_delete_task_no_auth(self, client: TestClient):
        """Test deleting a task without authentication"""
        response = client.delete("/api/v1/tasks/test-task-123")

        assert response.status_code == 401


class TestSubmitTask:
    """Tests for POST /api/v1/tasks/{task_id}/submit endpoint"""

    def test_submit_task_success(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test submitting a task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_task_data)
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            submission_data = {
                "submissionContent": "My project solution"
            }

            response = client.post(
                "/api/v1/tasks/test-task-123/submit",
                json=submission_data,
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_submit_task_with_rubric_scores(self, client: TestClient, auth_headers: Dict, sample_task_data: Dict):
        """Test submitting a task with rubric scores"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_task_data)
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            submission_data = {
                "submissionContent": "My project solution",
                "rubricScores": [
                    {"criterionId": "1", "score": 8},
                    {"criterionId": "2", "score": 9}
                ]
            }

            response = client.post(
                "/api/v1/tasks/test-task-123/submit",
                json=submission_data,
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_submit_task_not_found(self, client: TestClient, auth_headers: Dict):
        """Test submitting a non-existent task"""
        with patch('app.api.tasks.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.post(
                "/api/v1/tasks/non-existent/submit",
                json={"submissionContent": "Content"},
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_submit_task_no_auth(self, client: TestClient):
        """Test submitting a task without authentication"""
        response = client.post(
            "/api/v1/tasks/test-task-123/submit",
            json={"submissionContent": "Content"}
        )

        assert response.status_code == 401
