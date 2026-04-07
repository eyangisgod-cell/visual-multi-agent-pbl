"""
WebSocket API endpoints for real-time communication
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Header
from typing import Optional
import jwt
from app.websocket import manager
from app.config import settings

router = APIRouter()

JWT_SECRET = settings.JWT_SECRET if hasattr(settings, 'JWT_SECRET') else 'visual-pbl-jwt-secret-key-change-in-production'


async def get_user_from_token(authorization: Optional[str] = None) -> Optional[str]:
    """Extract user ID from JWT token"""
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload.get('userId')
    except jwt.InvalidTokenError:
        return None


@router.websocket('/ws')
async def websocket_endpoint(
    websocket: WebSocket,
    authorization: Optional[str] = Header(None)
):
    """
    WebSocket endpoint for real-time communication

    Messages format:
    - Connect: {"type": "connect", "userId": "user-123"}
    - Message: {"type": "message", "to": "user-456", "content": "Hello!", "messageType": "chat"}
    - Broadcast: {"type": "broadcast", "content": "Announcement", "messageType": "system"}
    - Status: {"type": "status", "userId": "user-123", "online": true}
    """
    # Verify authentication
    user_id = await get_user_from_token(authorization)
    if not user_id:
        await websocket.close(code=4001, reason='Unauthorized')
        return

    # Connect
    await manager.connect(websocket, user_id)

    # Send connection confirmation
    await websocket.send_json({
        'type': 'connected',
        'userId': user_id,
        'onlineUsers': manager.get_online_users()
    })

    # Broadcast user online status
    await manager.broadcast({
        'type': 'status',
        'userId': user_id,
        'online': True
    })

    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            msg_type = data.get('type')

            if msg_type == 'connect':
                # Connection already handled
                await websocket.send_json({
                    'type': 'ack',
                    'message': 'Connected successfully'
                })

            elif msg_type == 'message':
                # Send personal message to another user
                to_user = data.get('to')
                content = data.get('content')
                message_type = data.get('messageType', 'chat')

                try:
                    receiver_ws = manager.get_receiver_ws(to_user)
                    await manager.send_personal_message({
                        'type': 'message',
                        'from': user_id,
                        'content': content,
                        'messageType': message_type
                    }, to_user)

                    # Send confirmation to sender
                    await websocket.send_json({
                        'type': 'ack',
                        'message': f'Message sent to {to_user}'
                    })
                except KeyError:
                    # User not online, store message for later delivery
                    await websocket.send_json({
                        'type': 'error',
                        'message': f'User {to_user} is offline'
                    })

            elif msg_type == 'broadcast':
                # Broadcast message to all users
                content = data.get('content')
                message_type = data.get('messageType', 'announcement')

                await manager.broadcast({
                    'type': 'broadcast',
                    'from': user_id,
                    'content': content,
                    'messageType': message_type
                })

            elif msg_type == 'status':
                # Broadcast status update
                online = data.get('online', True)
                await manager.broadcast({
                    'type': 'status',
                    'userId': user_id,
                    'online': online
                })

    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
        # Broadcast user offline status
        await manager.broadcast({
            'type': 'status',
            'userId': user_id,
            'online': False
        })
