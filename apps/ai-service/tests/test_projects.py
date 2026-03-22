"""
Tests for FastAPI projects endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock, MagicMock


class TestListProjects:
    """Tests for GET /api/v1/projects endpoint"""

    def test_list_projects_success(self, client: TestClient, auth_headers: Dict, sample_project_data: Dict):
        """Test listing all projects"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[sample_project_data])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get("/api/v1/projects", headers=auth_headers)

            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            assert len(data["projects"]) == 1
            assert data["projects"][0]["id"] == sample_project_data["id"]

    def test_list_projects_with_status_filter(self, client: TestClient, auth_headers: Dict):
        """Test listing projects with status filter"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/projects?status_filter=published",
                headers=auth_headers
            )

            assert response.status_code == 200
            mock_conn.fetch.assert_called_once()

    def test_list_projects_with_subject_filter(self, client: TestClient, auth_headers: Dict):
        """Test listing projects with subject filter"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/projects?subject=Math",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_list_projects_with_limit(self, client: TestClient, auth_headers: Dict):
        """Test listing projects with limit"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/projects?limit=10",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_list_projects_no_auth(self, client: TestClient):
        """Test listing projects without authentication"""
        response = client.get("/api/v1/projects")

        assert response.status_code == 401

    def test_list_projects_db_error(self, client: TestClient, auth_headers: Dict):
        """Test listing projects with database error"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_connect.side_effect = Exception("Database connection error")

            response = client.get("/api/v1/projects", headers=auth_headers)

            assert response.status_code == 500


class TestGetProject:
    """Tests for GET /api/v1/projects/{project_id} endpoint"""

    def test_get_project_success(self, client: TestClient, auth_headers: Dict, sample_project_data: Dict):
        """Test getting a single project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_project_data)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/projects/test-project-123",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "project" in data
            assert data["project"]["id"] == sample_project_data["id"]

    def test_get_project_not_found(self, client: TestClient, auth_headers: Dict):
        """Test getting a non-existent project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.get(
                "/api/v1/projects/non-existent",
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_get_project_no_auth(self, client: TestClient):
        """Test getting a project without authentication"""
        response = client.get("/api/v1/projects/test-project-123")

        assert response.status_code == 401


class TestCreateProject:
    """Tests for POST /api/v1/projects endpoint"""

    def test_create_project_success(self, client: TestClient, auth_headers: Dict, sample_project_data: Dict):
        """Test creating a new project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.execute = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_project_data)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            project_data = {
                "title": "New Project",
                "description": "Project description",
                "gradeMin": 3,
                "gradeMax": 6,
                "subject": "Science"
            }

            response = client.post(
                "/api/v1/projects",
                json=project_data,
                headers=auth_headers
            )

            assert response.status_code == 201
            data = response.json()
            assert "project" in data
            assert data["project"]["title"] == "New Project"

    def test_create_project_missing_title(self, client: TestClient, auth_headers: Dict):
        """Test creating a project without title"""
        response = client.post(
            "/api/v1/projects",
            json={"description": "No title"},
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_create_project_invalid_grade(self, client: TestClient, auth_headers: Dict):
        """Test creating a project with invalid grade range"""
        response = client.post(
            "/api/v1/projects",
            json={
                "title": "Test",
                "gradeMin": 10,
                "gradeMax": 5  # Invalid: min > max
            },
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_create_project_no_auth(self, client: TestClient):
        """Test creating a project without authentication"""
        response = client.post(
            "/api/v1/projects",
            json={"title": "Test Project"}
        )

        assert response.status_code == 401


class TestUpdateProject:
    """Tests for PUT /api/v1/projects/{project_id} endpoint"""

    def test_update_project_success(self, client: TestClient, auth_headers: Dict, sample_project_data: Dict):
        """Test updating a project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=sample_project_data)
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            update_data = {
                "title": "Updated Project",
                "status": "published"
            }

            response = client.put(
                "/api/v1/projects/test-project-123",
                json=update_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "project" in data

    def test_update_project_not_found(self, client: TestClient, auth_headers: Dict):
        """Test updating a non-existent project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.put(
                "/api/v1/projects/non-existent",
                json={"title": "Updated"},
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_update_project_no_auth(self, client: TestClient):
        """Test updating a project without authentication"""
        response = client.put(
            "/api/v1/projects/test-project-123",
            json={"title": "Updated"}
        )

        assert response.status_code == 401


class TestDeleteProject:
    """Tests for DELETE /api/v1/projects/{project_id} endpoint"""

    def test_delete_project_success(self, client: TestClient, auth_headers: Dict):
        """Test deleting a project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.execute = AsyncMock()
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.delete(
                "/api/v1/projects/test-project-123",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_delete_project_not_found(self, client: TestClient, auth_headers: Dict):
        """Test deleting a non-existent project"""
        with patch('app.api.projects.asyncpg.connect', new_callable=AsyncMock) as mock_connect:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=None)
            mock_conn.close = AsyncMock()
            mock_connect.return_value = mock_conn

            response = client.delete(
                "/api/v1/projects/non-existent",
                headers=auth_headers
            )

            assert response.status_code == 404

    def test_delete_project_no_auth(self, client: TestClient):
        """Test deleting a project without authentication"""
        response = client.delete("/api/v1/projects/test-project-123")

        assert response.status_code == 401
