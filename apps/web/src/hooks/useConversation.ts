import { useState, useEffect, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  title?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface UseConversationOptions {
  userId?: string;
  agentId: string;
}

interface UseConversationReturn {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  createConversation: (agentId: string, title?: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, role?: 'user' | 'assistant' | 'system') => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
}

export function useConversation({
  userId = 'anonymous',
  agentId,
}: UseConversationOptions): UseConversationReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations?userId=${userId}&agentId=${agentId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversations');
      }

      setConversations(data.conversations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, agentId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 创建对话
  const createConversation = async (newAgentId: string, title?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          userId,
          agentId: newAgentId,
          title: title || `新对话`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create conversation');
      }

      await loadConversations();
      setCurrentConversation(data.conversation);
      setMessages([]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 选择对话
  const selectConversation = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversation');
      }

      setCurrentConversation(data.conversation);
      setMessages(data.conversation.messages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载消息
  const loadMessages = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load messages');
      }

      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 发送消息
  const sendMessage = async (
    content: string,
    role: 'user' | 'assistant' | 'system' = 'user'
  ) => {
    if (!currentConversation || !content.trim()) {
      throw new Error('No active conversation or empty content');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          role,
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // 更新消息列表
      setMessages((prev) => [...prev, data.message]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 删除对话
  const deleteConversation = async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': getCsrfToken(),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete conversation');
      }

      await loadConversations();

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCsrfToken = () => {
    return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
  };

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    createConversation,
    selectConversation,
    sendMessage,
    deleteConversation,
    loadMessages,
  };
}
