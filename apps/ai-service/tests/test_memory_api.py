"""
Tests for Agent Memory API endpoints

Tests for:
- POST /api/v1/memory - Add memory
- GET /api/v1/memory/{agent_id} - Get memory list
- POST /api/v1/memory/search - Vector search memories
"""
import pytest
from typing import Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock


class TestMemoryAPI:
    """Test Memory API endpoints"""

    def test_add_memory_success(self, client, auth_headers):
        """Test adding a new memory successfully"""
        memory_data = {
            "agent_id": "mentor",
            "type": "SHORT_TERM",
            "content": "Student completed task 1 successfully",
            "importance": 5,
            "tags": ["task_completion", "success"]
        }

        with patch('app.api.memory.add_memory', new=AsyncMock(return_value={
            "id": "test-memory-id",
            **memory_data
        })):
            response = client.post(
                "/api/v1/memory",
                json=memory_data,
                headers=auth_headers
            )

            assert response.status_code == 201
            data = response.json()
            assert data["id"] == "test-memory-id"
            assert data["agent_id"] == "mentor"
            assert data["type"] == "SHORT_TERM"

    def test_add_memory_missing_required_fields(self, client, auth_headers):
        """Test adding memory with missing required fields"""
        memory_data = {
            "type": "SHORT_TERM",
            # missing agent_id and content
        }

        response = client.post(
            "/api/v1/memory",
            json=memory_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_add_memory_invalid_type(self, client, auth_headers):
        """Test adding memory with invalid memory type"""
        memory_data = {
            "agent_id": "mentor",
            "type": "INVALID_TYPE",
            "content": "Test content"
        }

        response = client.post(
            "/api/v1/memory",
            json=memory_data,
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_get_memories_by_agent_id(self, client, auth_headers):
        """Test getting memories by agent ID"""
        mock_memories = [
            {
                "id": "memory-1",
                "agent_id": "mentor",
                "type": "SHORT_TERM",
                "content": "First memory",
                "importance": 3,
                "tags": ["test"]
            },
            {
                "id": "memory-2",
                "agent_id": "mentor",
                "type": "LONG_TERM",
                "content": "Second memory",
                "importance": 5,
                "tags": ["test"]
            }
        ]

        with patch('app.api.memory.get_memories', new=AsyncMock(return_value=mock_memories)):
            response = client.get(
                "/api/v1/memory/mentor",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]["agent_id"] == "mentor"

    def test_get_memories_empty_result(self, client, auth_headers):
        """Test getting memories when no memories exist"""
        with patch('app.api.memory.get_memories', new=AsyncMock(return_value=[])):
            response = client.get(
                "/api/v1/memory/guide",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 0

    def test_get_memories_unauthorized(self, client):
        """Test getting memories without authorization"""
        response = client.get("/api/v1/memory/mentor")
        assert response.status_code == 401

    def test_memory_search_by_query(self, client, auth_headers):
        """Test searching memories by text query"""
        search_data = {
            "agent_id": "mentor",
            "query": "student progress",
            "top_k": 5
        }

        mock_results = [
            {
                "id": "memory-1",
                "content": "Student showed good progress today",
                "similarity_score": 0.95
            },
            {
                "id": "memory-2",
                "content": "Student completed task with progress",
                "similarity_score": 0.87
            }
        ]

        with patch('app.api.memory.search_memories', new=AsyncMock(return_value=mock_results)):
            response = client.post(
                "/api/v1/memory/search",
                json=search_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 2
            assert data[0]["similarity_score"] == 0.95

    def test_memory_search_with_filters(self, client, auth_headers):
        """Test searching memories with type filter"""
        search_data = {
            "agent_id": "mentor",
            "query": "test",
            "memory_type": "LONG_TERM",
            "top_k": 10
        }

        with patch('app.api.memory.search_memories', new=AsyncMock(return_value=[])):
            response = client.post(
                "/api/v1/memory/search",
                json=search_data,
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_memory_search_missing_query(self, client, auth_headers):
        """Test searching memories with missing query"""
        search_data = {
            "agent_id": "mentor",
            # missing query
            "top_k": 5
        }

        response = client.post(
            "/api/v1/memory/search",
            json=search_data,
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_memory_search_invalid_top_k(self, client, auth_headers):
        """Test searching memories with invalid top_k value"""
        search_data = {
            "agent_id": "mentor",
            "query": "test",
            "top_k": -1  # Invalid negative value
        }

        response = client.post(
            "/api/v1/memory/search",
            json=search_data,
            headers=auth_headers
        )

        assert response.status_code == 422

    def test_add_memory_with_embedding(self, client, auth_headers):
        """Test adding memory with embedding vector"""
        memory_data = {
            "agent_id": "mentor",
            "type": "SHORT_TERM",
            "content": "Test content",
            "embedding": [0.1, 0.2, 0.3]  # Simplified embedding
        }

        with patch('app.api.memory.add_memory', new=AsyncMock(return_value={
            "id": "test-memory-id",
            **memory_data
        })):
            response = client.post(
                "/api/v1/memory",
                json=memory_data,
                headers=auth_headers
            )

            assert response.status_code == 201

    def test_add_memory_with_metadata(self, client, auth_headers):
        """Test adding memory with metadata"""
        memory_data = {
            "agent_id": "mentor",
            "type": "SHORT_TERM",
            "content": "Test content",
            "metadata": {
                "session_id": "session-123",
                "context": "task_evaluation"
            }
        }

        with patch('app.api.memory.add_memory', new=AsyncMock(return_value={
            "id": "test-memory-id",
            **memory_data
        })):
            response = client.post(
                "/api/v1/memory",
                json=memory_data,
                headers=auth_headers
            )

            assert response.status_code == 201
            data = response.json()
            assert data["metadata"]["session_id"] == "session-123"

    def test_get_memories_with_type_filter(self, client, auth_headers):
        """Test getting memories with type filter query param"""
        with patch('app.api.memory.get_memories', new=AsyncMock(return_value=[])):
            response = client.get(
                "/api/v1/memory/mentor?type=LONG_TERM",
                headers=auth_headers
            )

            assert response.status_code == 200

    def test_memory_search_unauthorized(self, client):
        """Test searching memories without authorization"""
        response = client.post(
            "/api/v1/memory/search",
            json={"query": "test"}
        )
        assert response.status_code == 401
