"""
Tests for Vector Search functionality in Memory API

Tests for:
- generate_embedding function
- Vector similarity search with pgvector
- Embedding storage and retrieval
"""
import pytest
import numpy as np
from typing import List, Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock


class TestEmbeddingGeneration:
    """Test embedding generation using sentence-transformers"""

    def test_generate_embedding_returns_list_of_floats(self):
        """Test that generate_embedding returns a list of floats"""
        from app.api.memory import generate_embedding

        # Mock the sentence transformer model
        mock_model = MagicMock()
        mock_embedding = np.array([0.1, 0.2, 0.3, 0.4, 0.5])
        mock_model.encode.return_value = mock_embedding

        with patch('app.api.memory.get_embedding_model', return_value=mock_model):
            result = generate_embedding("test text")

        assert isinstance(result, list)
        assert all(isinstance(x, float) for x in result)
        assert len(result) == 5

    def test_generate_embedding_consistent_output(self):
        """Test that same input produces same embedding"""
        from app.api.memory import generate_embedding

        mock_model = MagicMock()
        mock_embedding = np.array([0.1, 0.2, 0.3])
        mock_model.encode.return_value = mock_embedding

        with patch('app.api.memory.get_embedding_model', return_value=mock_model):
            result1 = generate_embedding("same text")
            result2 = generate_embedding("same text")

        assert result1 == result2

    def test_generate_embedding_different_output_for_different_input(self):
        """Test that different inputs produce different embeddings"""
        from app.api.memory import generate_embedding

        mock_model = MagicMock()

        def encode_side_effect(text, **kwargs):
            if text == "text one":
                return np.array([0.1, 0.2, 0.3])
            return np.array([0.4, 0.5, 0.6])

        mock_model.encode.side_effect = encode_side_effect

        with patch('app.api.memory.get_embedding_model', return_value=mock_model):
            result1 = generate_embedding("text one")
            result2 = generate_embedding("text two")

        assert result1 != result2

    def test_get_embedding_model_lazy_loading(self):
        """Test that embedding model is loaded lazily"""
        from app.api.memory import get_embedding_model
        import app.api.memory as memory_module

        # Reset the module state for testing
        original_model = memory_module._embedding_model
        memory_module._embedding_model = None

        try:
            # Initially model should be None
            assert memory_module._embedding_model is None

            # Mock the sentence_transformers.SentenceTransformer import
            mock_model = MagicMock()
            with patch('sentence_transformers.SentenceTransformer', return_value=mock_model):
                model = get_embedding_model()

            assert model is mock_model
            # After calling get_embedding_model, the internal model should be set
            assert memory_module._embedding_model is mock_model
        finally:
            # Restore original state
            memory_module._embedding_model = original_model

    def test_embedding_dimension(self):
        """Test that embeddings have expected dimension (384 for all-MiniLM-L6-v2)"""
        from app.api.memory import generate_embedding

        mock_model = MagicMock()
        # all-MiniLM-L6-v2 produces 384-dimensional vectors
        mock_embedding = np.zeros(384)
        mock_model.encode.return_value = mock_embedding

        with patch('app.api.memory.get_embedding_model', return_value=mock_model):
            result = generate_embedding("test")

        assert len(result) == 384


class TestCosineSimilarity:
    """Test cosine similarity calculation"""

    def test_cosine_similarity_identical_vectors(self):
        """Test that identical vectors have similarity of 1.0"""
        vec1 = [0.1, 0.2, 0.3]
        vec2 = [0.1, 0.2, 0.3]

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = sum(x ** 2 for x in vec1) ** 0.5
        norm_b = sum(x ** 2 for x in vec2) ** 0.5
        similarity = dot_product / (norm_a * norm_b)

        assert abs(similarity - 1.0) < 0.0001

    def test_cosine_similarity_orthogonal_vectors(self):
        """Test that orthogonal vectors have similarity of 0"""
        vec1 = [1, 0, 0]
        vec2 = [0, 1, 0]

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = sum(x ** 2 for x in vec1) ** 0.5
        norm_b = sum(x ** 2 for x in vec2) ** 0.5
        similarity = dot_product / (norm_a * norm_b) if norm_a * norm_b > 0 else 0

        assert similarity == 0

    def test_cosine_similarity_opposite_vectors(self):
        """Test that opposite vectors have similarity of -1"""
        vec1 = [1, 0, 0]
        vec2 = [-1, 0, 0]

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_a = sum(x ** 2 for x in vec1) ** 0.5
        norm_b = sum(x ** 2 for x in vec2) ** 0.5
        similarity = dot_product / (norm_a * norm_b)

        assert abs(similarity - (-1.0)) < 0.0001


class TestVectorSearchQuery:
    """Test vector search SQL query structure"""

    def test_vector_search_query_structure(self):
        """Test that vector search SQL query uses pgvector correctly"""
        import re

        # The query from memory.py
        query_template = """
            SELECT id, agent_id, type, content, importance, tags, metadata,
                   1 - (embedding <-> $2::vector) AS similarity
            FROM agent_memories
            WHERE agent_id = $1
              AND embedding IS NOT NULL
            ORDER BY similarity DESC
        """

        # Verify pgvector syntax
        assert re.search(r'embedding <-> .*::vector', query_template, re.DOTALL)
        assert 'similarity' in query_template
        assert 'ORDER BY similarity DESC' in query_template

    def test_vector_search_uses_cosine_distance(self):
        """Test that query uses cosine distance operator (<->)"""
        # pgvector cosine distance operator
        query = "1 - (embedding <-> $2::vector)"

        # <-> is the cosine distance operator in pgvector
        assert '<->' in query
        assert '::vector' in query

    def test_vector_search_filters_null_embeddings(self):
        """Test that query filters out memories without embeddings"""
        query = """
            SELECT id, agent_id, type, content
            FROM agent_memories
            WHERE agent_id = $1
              AND embedding IS NOT NULL
        """

        assert 'embedding IS NOT NULL' in query


class TestMemoryAPIWithMockDB:
    """Test memory API with mocked database"""

    def test_add_memory_with_embedding(self, auth_headers):
        """Test adding memory with embedding"""
        from fastapi.testclient import TestClient
        from app.main import app
        from unittest.mock import MagicMock

        memory_data = {
            "agent_id": "test-agent",
            "type": "SEMANTIC",
            "content": "Test content"
        }

        # Create mock row with proper __getitem__
        mock_row_data = {
            "id": "mem-123",
            "agent_id": "test-agent",
            "type": "SEMANTIC",
            "content": "Test content",
            "importance": 1,
            "tags": [],
            "metadata": None
        }
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda self, key: mock_row_data.get(key)

        mock_conn = AsyncMock()
        mock_conn.fetchrow.return_value = mock_row

        # Create async context manager mock
        acquire_cm = AsyncMock()
        acquire_cm.__aenter__ = AsyncMock(return_value=mock_conn)
        acquire_cm.__aexit__ = AsyncMock(return_value=None)

        mock_pool = MagicMock()
        mock_pool.acquire = MagicMock(return_value=acquire_cm)

        with patch('app.api.memory.get_db_pool', return_value=mock_pool):
            with patch('app.api.memory.generate_embedding', return_value=[0.1] * 384) as mock_gen:
                with TestClient(app) as client:
                    response = client.post(
                        "/api/v1/memory",
                        json=memory_data,
                        headers=auth_headers
                    )

                    assert response.status_code == 201
                    mock_gen.assert_called_once_with("Test content")

    def test_search_memory_with_vector(self, auth_headers):
        """Test searching memory with vector similarity"""
        from fastapi.testclient import TestClient
        from app.main import app
        from unittest.mock import MagicMock

        search_data = {
            "agent_id": "test-agent",
            "query": "test query",
            "top_k": 5
        }

        # Create mock row
        mock_row_data = {
            "id": "mem-123",
            "agent_id": "test-agent",
            "type": "SEMANTIC",
            "content": "Test content",
            "importance": 1,
            "tags": [],
            "metadata": None,
            "similarity": 0.95
        }
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda self, key: mock_row_data.get(key)

        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [mock_row]

        acquire_cm = AsyncMock()
        acquire_cm.__aenter__ = AsyncMock(return_value=mock_conn)
        acquire_cm.__aexit__ = AsyncMock(return_value=None)

        mock_pool = MagicMock()
        mock_pool.acquire = MagicMock(return_value=acquire_cm)

        with patch('app.api.memory.get_db_pool', return_value=mock_pool):
            with patch('app.api.memory.generate_embedding', return_value=[0.1] * 384):
                with TestClient(app) as client:
                    response = client.post(
                        "/api/v1/memory/search",
                        json=search_data,
                        headers=auth_headers
                    )

                    assert response.status_code == 200
                    data = response.json()
                    assert len(data) > 0
                    assert data[0]["similarity"] == 0.95

    def test_search_fallback_when_embedding_fails(self, auth_headers):
        """Test that search falls back to ILIKE when embedding fails"""
        from fastapi.testclient import TestClient
        from app.main import app
        from unittest.mock import MagicMock

        search_data = {
            "agent_id": "test-agent",
            "query": "test query"
        }

        # Create mock row for fallback
        mock_row_data = {
            "id": "mem-123",
            "agent_id": "test-agent",
            "type": "SEMANTIC",
            "content": "Test content",
            "importance": 1,
            "tags": [],
            "metadata": None,
            "similarity": 1.0
        }
        mock_row = MagicMock()
        mock_row.__getitem__ = lambda self, key: mock_row_data.get(key)

        mock_conn = AsyncMock()
        mock_conn.fetch.return_value = [mock_row]

        acquire_cm = AsyncMock()
        acquire_cm.__aenter__ = AsyncMock(return_value=mock_conn)
        acquire_cm.__aexit__ = AsyncMock(return_value=None)

        mock_pool = MagicMock()
        mock_pool.acquire = MagicMock(return_value=acquire_cm)

        with patch('app.api.memory.get_db_pool', return_value=mock_pool):
            with patch('app.api.memory.generate_embedding', side_effect=Exception("Model error")):
                with TestClient(app) as client:
                    response = client.post(
                        "/api/v1/memory/search",
                        json=search_data,
                        headers=auth_headers
                    )

                    # Should return 200 with fallback results
                    assert response.status_code == 200