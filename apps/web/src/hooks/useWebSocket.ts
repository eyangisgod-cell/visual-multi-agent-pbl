/**
 * WebSocket hook for real-time communication
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export interface WebSocketMessage {
  type: 'connect' | 'message' | 'broadcast' | 'status' | 'ack' | 'error' | 'connected';
  from?: string;
  to?: string;
  userId?: string;
  content?: string;
  messageType?: string;
  online?: boolean;
  message?: string;
  onlineUsers?: string[];
}

export interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Get JWT token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!token) {
      console.warn('WebSocket: No token found, skipping connection');
      return;
    }

    // Build WebSocket URL with auth header simulation via query param
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/ws`;

    try {
      const ws = new WebSocket(wsUrl, ['bearer', token]);

      ws.onopen = () => {
        console.log('WebSocket: Connected');
        setConnected(true);
        reconnectAttempts.current = 0;
        onConnect?.();

        // Send connect message
        ws.send(JSON.stringify({ type: 'connect' }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket: Received message', message);

          if (message.type === 'connected') {
            setOnlineUsers(message.onlineUsers || []);
          }

          if (message.type === 'status') {
            if (message.online) {
              setOnlineUsers(prev => [...prev, message.userId!]);
            } else {
              setOnlineUsers(prev => prev.filter(id => id !== message.userId));
            }
          }

          onMessage?.(message);
        } catch (error) {
          console.error('WebSocket: Error parsing message', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket: Disconnected');
        setConnected(false);
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          console.log(`WebSocket: Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          reconnectTimer.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket: Error', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket: Connection error', error);
    }
  }, [onConnect, onDisconnect, onMessage, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    setOnlineUsers([]);
  }, []);

  const sendMessage = useCallback((to: string, content: string, messageType: string = 'chat') => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        to,
        content,
        messageType,
      }));
      return true;
    }
    console.warn('WebSocket: Not connected');
    return false;
  }, [connected]);

  const broadcastMessage = useCallback((content: string, messageType: string = 'announcement') => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'broadcast',
        content,
        messageType,
      }));
      return true;
    }
    console.warn('WebSocket: Not connected');
    return false;
  }, [connected]);

  const updateStatus = useCallback((online: boolean) => {
    if (wsRef.current && connected) {
      wsRef.current.send(JSON.stringify({
        type: 'status',
        online,
      }));
      return true;
    }
    return false;
  }, [connected]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    onlineUsers,
    connect,
    disconnect,
    sendMessage,
    broadcastMessage,
    updateStatus,
  };
}
