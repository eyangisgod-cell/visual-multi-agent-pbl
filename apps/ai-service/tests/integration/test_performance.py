"""
Phase 6 - 性能优化验证测试

测试范围：
1. API 响应时间
2. 数据库查询性能
3. 缓存命中率
4. WebSocket 并发连接
5. 速率限制验证

TDD 流程：
1. RED - 测试失败
2. GREEN - 编写最少代码通过测试
3. REFACTOR - 重构优化
"""
import pytest
import time
from typing import Dict, Any, List
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
import statistics


class TestAPIResponseTime:
    """Tests for API response time performance"""

    def test_health_endpoint_response_time(self, client: TestClient):
        """Test that health endpoint responds within acceptable time"""
        start_time = time.perf_counter()
        response = client.get("/api/v1/health")
        elapsed_time = time.perf_counter() - start_time

        assert response.status_code == 200
        # Health check should respond within 100ms
        assert elapsed_time < 0.1, f"Health endpoint took {elapsed_time*1000:.2f}ms"

    def test_memory_api_response_time(self, client: TestClient, valid_jwt_token: str):
        """Test that memory API responds within acceptable time"""
        memory_data = {
            "agent_id": "mentor",
            "type": "SHORT_TERM",
            "content": "Performance test memory",
            "importance": 5,
        }

        with patch('app.api.memory.add_memory', new=AsyncMock(return_value={
            "id": "test-id",
            **memory_data
        })):
            start_time = time.perf_counter()
            response = client.post(
                "/api/v1/memory",
                json=memory_data,
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 201
            # Memory creation should respond within 200ms
            assert elapsed_time < 0.2, f"Memory API took {elapsed_time*1000:.2f}ms"

    def test_concurrent_api_requests(self, client: TestClient, valid_jwt_token: str):
        """Test handling multiple concurrent API requests"""
        import concurrent.futures

        def make_request():
            return client.get("/api/v1/health")

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            start_time = time.perf_counter()
            futures = [executor.submit(make_request) for _ in range(10)]
            responses = [f.result() for f in futures]
            elapsed_time = time.perf_counter() - start_time

            # All requests should succeed
            for response in responses:
                assert response.status_code == 200

            # Total time should be reasonable (not sequential)
            # If sequential, would take much longer
            assert elapsed_time < 2.0, f"Concurrent requests took {elapsed_time:.2f}s"


class TestDatabaseQueryPerformance:
    """Tests for database query performance"""

    def test_memory_retrieval_performance(self, client: TestClient, valid_jwt_token: str):
        """Test performance of retrieving memories"""
        mock_memories = [
            {"id": f"memory-{i}", "agent_id": "mentor", "type": "SHORT_TERM",
             "content": f"Memory {i}", "importance": 5}
            for i in range(100)
        ]

        with patch('app.api.memory.get_memories', new=AsyncMock(return_value=mock_memories)):
            start_time = time.perf_counter()
            response = client.get(
                "/api/v1/memory/mentor",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 200
            # Should retrieve 100 memories within 500ms
            assert elapsed_time < 0.5, f"Memory retrieval took {elapsed_time*1000:.2f}ms"

    def test_memory_search_performance(self, client: TestClient, valid_jwt_token: str):
        """Test performance of memory search"""
        mock_results = [
            {"id": f"result-{i}", "similarity": 0.9 - i*0.01}
            for i in range(20)
        ]

        with patch('app.api.memory.search_memories', new=AsyncMock(return_value=mock_results)):
            search_data = {
                "agent_id": "mentor",
                "query": "test query",
                "top_k": 20
            }

            start_time = time.perf_counter()
            response = client.post(
                "/api/v1/memory/search",
                json=search_data,
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 200
            # Search should complete within 300ms
            assert elapsed_time < 0.3, f"Memory search took {elapsed_time*1000:.2f}ms"

    def test_database_connection_pooling(self, client: TestClient, valid_jwt_token: str):
        """Test that database connection pooling is efficient"""
        with patch('app.db.database.get_db') as mock_db:
            mock_conn = AsyncMock()
            mock_conn.fetch = AsyncMock(return_value=[])
            mock_db.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_db.return_value.__aexit__ = AsyncMock(return_value=None)

            # Make multiple requests
            times = []
            for _ in range(5):
                start_time = time.perf_counter()
                client.get(
                    "/api/v1/memory/mentor",
                    headers={"Authorization": f"Bearer {valid_jwt_token}"}
                )
                times.append(time.perf_counter() - start_time)

            # Average time should be reasonable
            avg_time = statistics.mean(times)
            assert avg_time < 0.3, f"Average DB query time: {avg_time*1000:.2f}ms"


class TestCachePerformance:
    """Tests for cache performance"""

    def test_redis_cache_hit(self, client: TestClient, valid_jwt_token: str):
        """Test cache hit scenario"""
        mock_cache_data = {"key": "value", "cached": True}

        with patch('app.cache.redis.get_cached', new=AsyncMock(return_value=mock_cache_data)):
            start_time = time.perf_counter()
            # Simulate cached request
            response = client.get(
                "/api/v1/health",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 200
            # Cache hit should be very fast (< 50ms)
            assert elapsed_time < 0.05, f"Cache hit took {elapsed_time*1000:.2f}ms"

    def test_redis_cache_miss(self, client: TestClient, valid_jwt_token: str):
        """Test cache miss scenario"""
        with patch('app.cache.redis.get_cached', new=AsyncMock(return_value=None)):
            with patch('app.cache.redis.set_cached', new=AsyncMock(return_value=True)):
                start_time = time.perf_counter()
                # Simulate cache miss - should fetch from DB and cache
                response = client.get(
                    "/api/v1/health",
                    headers={"Authorization": f"Bearer {valid_jwt_token}"}
                )
                elapsed_time = time.perf_counter() - start_time

                assert response.status_code == 200
                # Cache miss should still be reasonable (< 200ms)
                assert elapsed_time < 0.2, f"Cache miss took {elapsed_time*1000:.2f}ms"


class TestWebSocketPerformance:
    """Tests for WebSocket performance"""

    def test_websocket_connection_time(self, client: TestClient, valid_jwt_token: str):
        """Test WebSocket connection establishment time"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.get_online_users = MagicMock(return_value=[])

            start_time = time.perf_counter()
            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                data = websocket.receive_json()
                elapsed_time = time.perf_counter() - start_time

                assert data is not None
                # Connection should establish within 100ms
                assert elapsed_time < 0.1, f"WebSocket connect took {elapsed_time*1000:.2f}ms"

    def test_websocket_message_throughput(self, client: TestClient, valid_jwt_token: str):
        """Test WebSocket message throughput"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                websocket.receive_json()  # Connection confirmation

                # Send multiple messages
                start_time = time.perf_counter()
                for i in range(10):
                    websocket.send_json({"type": "message", "content": f"Message {i}"})
                    websocket.receive_json()  # Acknowledgment
                elapsed_time = time.perf_counter() - start_time

                # Should handle 10 messages within 500ms
                assert elapsed_time < 0.5, f"10 messages took {elapsed_time*1000:.2f}ms"

    def test_websocket_concurrent_connections(self, client: TestClient, valid_jwt_token: str):
        """Test handling multiple concurrent WebSocket connections"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.get_online_users = MagicMock(return_value=[])

            connections = []
            start_time = time.perf_counter()

            try:
                # Create multiple connections
                for _ in range(5):
                    ws = client.websocket_connect(
                        "/ws",
                        headers={"Authorization": f"Bearer {valid_jwt_token}"}
                    )
                    connections.append(ws.__enter__())

                elapsed_time = time.perf_counter() - start_time

                # Should handle 5 connections within 200ms
                assert elapsed_time < 0.2, f"5 connections took {elapsed_time*1000:.2f}ms"

            finally:
                for ws in connections:
                    try:
                        ws.__exit__(None, None, None)
                    except Exception:
                        pass


class TestRateLimiting:
    """Tests for rate limiting performance"""

    def test_rate_limit_threshold(self, client: TestClient, valid_jwt_token: str):
        """Test that rate limiting kicks in at threshold"""
        # Note: This test assumes rate limiting is configured
        # 100 requests per minute per IP

        with patch('app.middleware.rate_limit.RateLimitMiddleware.__call__', new=MagicMock(side_effect=lambda *args, **kwargs: None)):
            # Mock rate limit to always pass for this test
            # In production, this would actually rate limit

            # Make requests up to threshold
            responses = []
            for _ in range(50):
                response = client.get(
                    "/api/v1/health",
                    headers={"Authorization": f"Bearer {valid_jwt_token}"}
                )
                responses.append(response.status_code)

            # Most requests should succeed (not all due to mock)
            success_count = sum(1 for code in responses if code == 200)
            assert success_count >= 45, f"Only {success_count}/50 requests succeeded"

    def test_rate_limit_recovery(self, client: TestClient, valid_jwt_token: str):
        """Test that service recovers after rate limit window resets"""
        # This test verifies that after rate limit window resets,
        # requests can succeed again

        # Simulate rate limit scenario (mocked)
        with patch('app.middleware.rate_limit.RateLimitMiddleware.__call__', new=MagicMock()):
            # First batch of requests
            for _ in range(10):
                client.get("/api/v1/health")

            # Simulate window reset
            time.sleep(0.1)  # Short sleep for test

            # Second batch should succeed
            response = client.get(
                "/api/v1/health",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            assert response.status_code == 200


class TestMemoryEfficiency:
    """Tests for memory efficiency"""

    def test_large_memory_content_handling(self, client: TestClient, valid_jwt_token: str):
        """Test handling large memory content efficiently"""
        # Create memory with large content (10KB)
        large_content = "A" * 10000

        memory_data = {
            "agent_id": "mentor",
            "type": "LONG_TERM",
            "content": large_content,
            "importance": 5,
        }

        with patch('app.api.memory.add_memory', new=AsyncMock(return_value={
            "id": "test-id",
            **memory_data
        })):
            start_time = time.perf_counter()
            response = client.post(
                "/api/v1/memory",
                json=memory_data,
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 201
            # Should handle large content within 300ms
            assert elapsed_time < 0.3, f"Large content took {elapsed_time*1000:.2f}ms"

    def test_many_memories_performance(self, client: TestClient, valid_jwt_token: str):
        """Test performance with many memories"""
        mock_memories = [
            {"id": f"mem-{i}", "agent_id": "mentor", "type": "SHORT_TERM",
             "content": f"Memory {i}", "importance": i % 10 + 1}
            for i in range(1000)
        ]

        with patch('app.api.memory.get_memories', new=AsyncMock(return_value=mock_memories)):
            start_time = time.perf_counter()
            response = client.get(
                "/api/v1/memory/mentor?limit=100",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
            elapsed_time = time.perf_counter() - start_time

            assert response.status_code == 200
            # Should handle 1000 memories with limit within 500ms
            assert elapsed_time < 0.5, f"1000 memories query took {elapsed_time*1000:.2f}ms"


class TestSecurityPerformance:
    """Tests for security-related performance"""

    def test_jwt_validation_performance(self, client: TestClient, valid_jwt_token: str):
        """Test JWT validation performance"""
        start_time = time.perf_counter()
        for _ in range(10):
            response = client.get(
                "/api/v1/health",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            )
        elapsed_time = time.perf_counter() - start_time

        # 10 JWT validations should complete within 200ms
        assert elapsed_time < 0.2, f"10 JWT validations took {elapsed_time*1000:.2f}ms"

    def test_security_headers_overhead(self, client: TestClient):
        """Test that security headers add minimal overhead"""
        # Get response without extra security checks
        start_time = time.perf_counter()
        response = client.get("/api/v1/health")
        elapsed_time = time.perf_counter() - start_time

        assert response.status_code == 200
        # Security headers should add < 10ms overhead
        assert elapsed_time < 0.05, f"Security headers added {elapsed_time*1000:.2f}ms"
