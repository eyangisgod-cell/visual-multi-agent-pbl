"""
WebSocket connection manager for real-time communication
"""
from typing import Dict, Set
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        # user_id -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
        # user_id -> set of connected WebSocket instances (for multiple sessions)
        self.user_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and register user"""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Disconnect WebSocket and remove from registry"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected users"""
        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
            except Exception:
                # Connection might be closed, ignore
                pass

    async def broadcast_except(self, message: dict, exclude_user_id: str):
        """Broadcast message to all users except one"""
        for user_id, websocket in self.active_connections.items():
            if user_id != exclude_user_id:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass

    def get_receiver_ws(self, user_id: str) -> WebSocket:
        """Get WebSocket connection for a user"""
        if user_id not in self.active_connections:
            raise KeyError(f"User {user_id} not found")
        return self.active_connections[user_id]

    def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        return user_id in self.active_connections

    def get_online_users(self) -> list:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())


# Global manager instance
manager = ConnectionManager()
