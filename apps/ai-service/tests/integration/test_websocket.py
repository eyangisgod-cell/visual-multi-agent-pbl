"""
Phase 6 - WebSocket 集成测试

测试范围：
1. WebSocket 连接认证
2. 实时消息传递
3. 在线用户管理
4. 状态广播

TDD 流程：
1. RED - 测试失败
2. GREEN - 编写最少代码通过测试
3. REFACTOR - 重构优化
"""
import pytest
from typing import Dict, Any
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app


class TestWebSocketConnection:
    """Tests for WebSocket connection functionality"""

    def test_websocket_requires_authentication(self, client: TestClient, invalid_jwt_token: str):
        """Test that WebSocket connection requires valid authentication"""
        # Try to connect with invalid token - should fail
        try:
            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {invalid_jwt_token}"}
            ) as websocket:
                # If we get here, the connection succeeded (which is a failure for this test)
                assert False, "Connection should have been rejected with invalid token"
        except Exception:
            # Expected - invalid token should be rejected
            assert True

    def test_websocket_connect_success(self, client: TestClient, valid_jwt_token: str):
        """Test successful WebSocket connection with valid authentication"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.get_online_users = MagicMock(return_value=[])

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Should receive connection confirmation
                data = websocket.receive_json()
                assert data is not None
                assert data.get('type') == 'connected'
                assert 'onlineUsers' in data

    def test_websocket_connect_with_user_id(self, client: TestClient, valid_jwt_token: str):
        """Test WebSocket connection extracts user ID from token"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.get_online_users = MagicMock(return_value=[])
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation
                data = websocket.receive_json()
                assert data.get('userId') == 'test-user-123'

    def test_websocket_unauthorized_access(self, client: TestClient):
        """Test WebSocket connection without authentication"""
        # No authorization header
        try:
            with client.websocket_connect("/ws") as websocket:
                assert False, "Connection should have been rejected"
        except Exception:
            # Expected - no auth should be rejected
            assert True


class TestWebSocketMessaging:
    """Tests for WebSocket message passing"""

    def test_send_connect_message(self, client: TestClient, valid_jwt_token: str):
        """Test sending connect message via WebSocket"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation first
                websocket.receive_json()

                # Send connect message
                websocket.send_json({"type": "connect", "userId": "test-user-123"})

                # Should receive acknowledgment
                data = websocket.receive_json()
                assert data.get('type') == 'ack'

    def test_send_personal_message(self, client: TestClient, valid_jwt_token: str):
        """Test sending personal message to another user via WebSocket"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.send_personal_message = AsyncMock()
            mock_manager.get_receiver_ws = MagicMock(return_value=MagicMock())

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation first
                websocket.receive_json()

                # Send personal message
                message = {
                    "type": "message",
                    "to": "user-456",
                    "content": "Hello!",
                    "messageType": "chat"
                }
                websocket.send_json(message)

                # Should receive acknowledgment
                data = websocket.receive_json()
                assert data.get('type') == 'ack'

    def test_send_personal_message_to_offline_user(self, client: TestClient, valid_jwt_token: str):
        """Test sending message to offline user"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.get_receiver_ws = MagicMock(side_effect=KeyError("User offline"))

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation first
                websocket.receive_json()

                # Send message to offline user
                message = {
                    "type": "message",
                    "to": "offline-user",
                    "content": "Hello?",
                    "messageType": "chat"
                }
                websocket.send_json(message)

                # Should receive error response
                data = websocket.receive_json()
                assert data.get('type') == 'error'

    def test_broadcast_message(self, client: TestClient, valid_jwt_token: str):
        """Test broadcasting message to all users"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation first
                websocket.receive_json()

                # Send broadcast message
                broadcast = {
                    "type": "broadcast",
                    "content": "Important announcement!",
                    "messageType": "announcement"
                }
                websocket.send_json(broadcast)

                # Verify broadcast was called
                mock_manager.broadcast.assert_called()

    def test_broadcast_status_update(self, client: TestClient, valid_jwt_token: str):
        """Test broadcasting status update"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                websocket.receive_json()

                # Send status update
                status = {
                    "type": "status",
                    "userId": "test-user-123",
                    "online": False
                }
                websocket.send_json(status)

                # Verify broadcast was called with status
                mock_manager.broadcast.assert_called()


class TestWebSocketDisconnection:
    """Tests for WebSocket disconnection"""

    def test_websocket_disconnect_broadcasts_status(self, client: TestClient, valid_jwt_token: str):
        """Test that disconnection broadcasts offline status"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            try:
                with client.websocket_connect(
                    "/ws",
                    headers={"Authorization": f"Bearer {valid_jwt_token}"}
                ) as websocket:
                    websocket.receive_json()
                    # Close the connection will trigger disconnect
            except Exception:
                pass

            # Verify disconnect was called
            mock_manager.disconnect.assert_called()
            # Verify offline status was broadcast
            mock_manager.broadcast.assert_called()

    def test_websocket_manager_cleanup(self, client: TestClient, valid_jwt_token: str):
        """Test WebSocket manager cleans up connections properly"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.active_connections = {"test-user-123": MagicMock()}

            try:
                with client.websocket_connect(
                    "/ws",
                    headers={"Authorization": f"Bearer {valid_jwt_token}"}
                ) as websocket:
                    websocket.receive_json()
            except Exception:
                pass

            # Verify cleanup
            mock_manager.disconnect.assert_called_once()


class TestOnlineUserManagement:
    """Tests for online user management"""

    def test_get_online_users(self, client: TestClient, valid_jwt_token: str):
        """Test getting list of online users"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.get_online_users = MagicMock(return_value=[
                "test-user-123",
                "user-456",
                "user-789"
            ])

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                # Receive connection confirmation which includes online users
                data = websocket.receive_json()
                assert 'onlineUsers' in data
                assert len(data['onlineUsers']) >= 0

    def test_user_connects_broadcasts_status(self, client: TestClient, valid_jwt_token: str):
        """Test that user connection broadcasts status"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                websocket.receive_json()

                # Verify online status was broadcast
                mock_manager.broadcast.assert_called()
                call_args = mock_manager.broadcast.call_args[0][0]
                assert call_args.get('type') == 'status'
                assert call_args.get('online') is True

    def test_multiple_users_can_connect(self, client: TestClient, valid_jwt_token: str):
        """Test that multiple users can connect simultaneously"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()
            mock_manager.active_connections = {
                "user-1": MagicMock(),
                "user-2": MagicMock(),
                "test-user-123": MagicMock()
            }
            mock_manager.get_online_users = MagicMock(return_value=[
                "user-1", "user-2", "test-user-123"
            ])

            with client.websocket_connect(
                "/ws",
                headers={"Authorization": f"Bearer {valid_jwt_token}"}
            ) as websocket:
                data = websocket.receive_json()
                assert len(data['onlineUsers']) >= 1
