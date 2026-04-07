"""
Tests for WebSocket server functionality
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app


class TestWebSocketConnection:
    """Tests for WebSocket connection endpoint"""

    def test_websocket_connect_success(self, client: TestClient, valid_jwt_token: str):
        """Test successful WebSocket connection"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                websocket.send_text({"type": "connect", "userId": "test-user-123"})
                data = websocket.receive_text()
                assert data is not None

    def test_websocket_connect_no_auth(self, client: TestClient):
        """Test WebSocket connection without authentication"""
        with pytest.raises(Exception):
            with client.websocket_connect("/ws") as websocket:
                websocket.send_text({"type": "connect"})

    def test_websocket_connect_invalid_token(self, client: TestClient, invalid_jwt_token: str):
        """Test WebSocket connection with invalid token"""
        with pytest.raises(Exception):
            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {invalid_jwt_token}"}) as websocket:
                websocket.send_text({"type": "connect"})


class TestWebSocketMessageSend:
    """Tests for sending messages via WebSocket"""

    def test_send_message_success(self, client: TestClient, valid_jwt_token: str):
        """Test sending a message successfully"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.send_personal_message = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                message = {
                    "type": "message",
                    "to": "user-456",
                    "content": "Hello!",
                    "messageType": "chat"
                }
                websocket.send_text(message)

                # Verify message was sent
                mock_manager.send_personal_message.assert_called()

    def test_send_message_to_nonexistent_user(self, client: TestClient, valid_jwt_token: str):
        """Test sending a message to non-existent user"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.get_receiver_ws.side_effect = KeyError("User not found")

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                message = {
                    "type": "message",
                    "to": "nonexistent-user",
                    "content": "Hello!",
                    "messageType": "chat"
                }
                websocket.send_text(message)


class TestWebSocketMessageReceive:
    """Tests for receiving messages via WebSocket"""

    def test_receive_message_from_another_user(self, client: TestClient, valid_jwt_token: str):
        """Test receiving a message from another user"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                # Simulate receiving a message
                test_message = {
                    "type": "message",
                    "from": "user-456",
                    "content": "Hello back!",
                    "messageType": "chat"
                }
                websocket.send_text(test_message)
                data = websocket.receive_text()
                assert data is not None

    def test_receive_broadcast_message(self, client: TestClient, valid_jwt_token: str):
        """Test receiving a broadcast message"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                broadcast_message = {
                    "type": "broadcast",
                    "content": "System announcement",
                    "messageType": "system"
                }
                websocket.send_text(broadcast_message)
                data = websocket.receive_text()
                assert data is not None


class TestWebSocketDisconnect:
    """Tests for WebSocket disconnection"""

    def test_websocket_disconnect(self, client: TestClient, valid_jwt_token: str):
        """Test WebSocket disconnection"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                websocket.send_text({"type": "connect", "userId": "test-user-123"})

            # Verify disconnect was called
            mock_manager.disconnect.assert_called()

    def test_websocket_disconnect_removes_from_active_connections(self, client: TestClient, valid_jwt_token: str):
        """Test that disconnect removes user from active connections"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.active_connections = {"test-user-123": MagicMock()}
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock(side_effect=lambda conn, user_id: mock_manager.active_connections.pop(user_id, None))

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                websocket.send_text({"type": "connect", "userId": "test-user-123"})

            # Verify user was removed from active connections
            assert "test-user-123" not in mock_manager.active_connections


class TestWebSocketBroadcast:
    """Tests for WebSocket broadcast functionality"""

    def test_broadcast_message_to_all_users(self, client: TestClient, valid_jwt_token: str):
        """Test broadcasting a message to all connected users"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.active_connections = {
                "user-1": MagicMock(),
                "user-2": MagicMock(),
                "user-3": MagicMock()
            }
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                broadcast_data = {
                    "type": "broadcast",
                    "content": "Hello everyone!",
                    "messageType": "announcement"
                }
                websocket.send_text(broadcast_data)

                # Verify broadcast was called
                mock_manager.broadcast.assert_called()

    def test_broadcast_online_status(self, client: TestClient, valid_jwt_token: str):
        """Test broadcasting online status to all users"""
        with patch('app.api.websocket.manager') as mock_manager:
            mock_manager.active_connections = {"user-1": MagicMock()}
            mock_manager.connect = AsyncMock()
            mock_manager.disconnect = AsyncMock()
            mock_manager.broadcast = AsyncMock()

            with client.websocket_connect("/ws", headers={"Authorization": f"Bearer {valid_jwt_token}"}) as websocket:
                status_data = {
                    "type": "status",
                    "userId": "test-user-123",
                    "online": True
                }
                websocket.send_text(status_data)

                # Verify broadcast was called for status update
                mock_manager.broadcast.assert_called()
