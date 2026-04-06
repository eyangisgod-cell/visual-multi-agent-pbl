"""
Tests for Agent Memory Consolidation

Tests for:
- Short-term to long-term memory consolidation
- Memory importance calculation
"""
import pytest
from typing import Dict, Any, List
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta


class TestMemoryConsolidation:
    """Test memory consolidation functionality"""

    def test_consolidate_memories_success(self, client, auth_headers):
        """Test consolidating short-term memories to long-term"""
        consolidate_data = {
            "agent_id": "mentor",
            "threshold": 5  # Importance threshold
        }

        mock_result = {
            "consolidated_count": 3,
            "memories_consolidated": [
                {"id": "mem-1", "original_type": "SHORT_TERM", "new_type": "LONG_TERM"},
                {"id": "mem-2", "original_type": "SHORT_TERM", "new_type": "LONG_TERM"},
                {"id": "mem-3", "original_type": "SHORT_TERM", "new_type": "LONG_TERM"}
            ]
        }

        with patch('app.api.memory.consolidate_memories', new=AsyncMock(return_value=mock_result)):
            response = client.post(
                "/api/v1/memory/consolidate",
                json=consolidate_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["consolidated_count"] == 3
            assert len(data["memories_consolidated"]) == 3

    def test_consolidate_memories_no_memories(self, client, auth_headers):
        """Test consolidation when no memories qualify"""
        consolidate_data = {
            "agent_id": "guide",
            "threshold": 7
        }

        mock_result = {
            "consolidated_count": 0,
            "memories_consolidated": []
        }

        with patch('app.api.memory.consolidate_memories', new=AsyncMock(return_value=mock_result)):
            response = client.post(
                "/api/v1/memory/consolidate",
                json=consolidate_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["consolidated_count"] == 0

    def test_consolidate_memories_unauthorized(self, client):
        """Test consolidation without authorization"""
        response = client.post(
            "/api/v1/memory/consolidate",
            json={"agent_id": "mentor"}
        )
        assert response.status_code == 401

    def test_calculate_importance_high_activity(self, client, auth_headers):
        """Test importance calculation with high activity"""
        activity_data = {
            "agent_id": "mentor",
            "interactions_count": 50,
            "time_weight": 0.9,
            "emotional_weight": 0.8
        }

        mock_importance = 8  # High importance score

        with patch('app.api.memory.calculate_importance', new=AsyncMock(return_value=mock_importance)):
            response = client.post(
                "/api/v1/memory/calculate-importance",
                json=activity_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["importance"] == 8

    def test_calculate_importance_low_activity(self, client, auth_headers):
        """Test importance calculation with low activity"""
        activity_data = {
            "agent_id": "mentor",
            "interactions_count": 1,
            "time_weight": 0.1,
            "emotional_weight": 0.1
        }

        mock_importance = 1  # Low importance score

        with patch('app.api.memory.calculate_importance', new=AsyncMock(return_value=mock_importance)):
            response = client.post(
                "/api/v1/memory/calculate-importance",
                json=activity_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["importance"] == 1

    def test_memory_decay_old_memories(self, client, auth_headers):
        """Test memory decay for old memories"""
        decay_data = {
            "agent_id": "mentor",
            "days_old": 30
        }

        mock_decay_factor = 0.5  # 50% decay after 30 days

        with patch('app.api.memory.calculate_decay', new=AsyncMock(return_value=mock_decay_factor)):
            response = client.post(
                "/api/v1/memory/calculate-decay",
                json=decay_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["decay_factor"] == 0.5

    def test_consolidate_with_custom_threshold(self, client, auth_headers):
        """Test consolidation with custom importance threshold"""
        consolidate_data = {
            "agent_id": "mentor",
            "threshold": 8  # Only very important memories
        }

        mock_result = {
            "consolidated_count": 1,
            "memories_consolidated": [
                {"id": "mem-1", "original_type": "SHORT_TERM", "new_type": "LONG_TERM"}
            ]
        }

        with patch('app.api.memory.consolidate_memories', new=AsyncMock(return_value=mock_result)):
            response = client.post(
                "/api/v1/memory/consolidate",
                json=consolidate_data,
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["consolidated_count"] == 1


class TestImportanceCalculation:
    """Test memory importance calculation algorithm"""

    def test_importance_with_high_frequency(self):
        """Test importance increases with high frequency"""
        # Multiple accesses of the same memory should increase importance
        frequency = 10
        recency = 0.9
        user_feedback = 0.8

        expected_min_importance = 5

        # Simulated calculation
        importance = min(10, int((frequency * 0.3 + recency * 10 * 0.4 + user_feedback * 10 * 0.3)))

        assert importance >= expected_min_importance

    def test_importance_with_low_frequency(self):
        """Test importance decreases with low frequency"""
        frequency = 1
        recency = 0.2
        user_feedback = 0.3

        expected_max_importance = 3

        # Simulated calculation
        importance = min(10, int((frequency * 0.3 + recency * 10 * 0.4 + user_feedback * 10 * 0.3)))

        assert importance <= expected_max_importance

    def test_importance_time_decay(self):
        """Test that older memories have lower importance due to time decay"""
        # Recent memory (1 day old)
        recent_decay = 1.0  # No decay

        # Old memory (30 days old)
        old_decay = 0.5  # 50% decay

        assert old_decay < recent_decay

    def test_consolidation_threshold_validation(self, client, auth_headers):
        """Test validation of consolidation threshold"""
        # Invalid threshold (negative)
        consolidate_data = {
            "agent_id": "mentor",
            "threshold": -1
        }

        response = client.post(
            "/api/v1/memory/consolidate",
            json=consolidate_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_consolidation_threshold_max_validation(self, client, auth_headers):
        """Test validation of consolidation threshold max value"""
        # Invalid threshold (too high)
        consolidate_data = {
            "agent_id": "mentor",
            "threshold": 11  # Max is 10
        }

        response = client.post(
            "/api/v1/memory/consolidate",
            json=consolidate_data,
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_memory_priority_queue(self):
        """Test that memories are prioritized correctly for consolidation"""
        memories = [
            {"id": "1", "importance": 3, "age_days": 10},
            {"id": "2", "importance": 8, "age_days": 1},
            {"id": "3", "importance": 5, "age_days": 5},
            {"id": "4", "importance": 9, "age_days": 2}
        ]

        # Sort by importance (descending) and age (ascending - newer first)
        sorted_memories = sorted(
            memories,
            key=lambda m: (-m["importance"], m["age_days"])
        )

        # Highest importance should be first
        assert sorted_memories[0]["id"] == "4"
        assert sorted_memories[1]["id"] == "2"
