'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  title?: string;
  messages?: Message[];
}

interface ChatInterfaceProps {
  agentId: string;
  agentName: string;
  userId?: string;
}

export default function ChatInterface({ agentId, agentName, userId = 'anonymous' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载或创建对话
  useEffect(() => {
    loadOrCreateConversation();
  }, [agentId]);

  const loadOrCreateConversation = async () => {
    try {
      // 尝试获取用户的对话列表
      const response = await fetch(`/api/conversations?userId=${userId}&agentId=${agentId}`);
      const data = await response.json();

      if (data.conversations && data.conversations.length > 0) {
        // 使用最近的对话
        setConversationId(data.conversations[0].id);
        loadMessages(data.conversations[0].id);
      } else {
        // 创建新对话
        await createConversation();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      await createConversation();
    }
  };

  const createConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          userId,
          agentId,
          title: `与 ${agentName} 的对话`,
        }),
      });

      const data = await response.json();
      setConversationId(data.conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isLoading) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      role: 'user' as const,
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    // 立即显示用户消息
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 保存用户消息到服务器
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          role: 'user',
          content: userMessage.content,
        }),
      });

      // 调用 AI service 获取回复
      const aiResponse = await fetch('/api/conversations/[id]/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          role: 'assistant',
          content: `【智能体回复 - 模拟】我收到了你的消息："${userMessage.content}"`,
        }),
      });

      // TODO: 实际应该调用 AI service 的 WebSocket 或 chat API
      const assistantMessage: Message = {
        id: `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: `【智能体回复 - 模拟】我收到了你的消息："${userMessage.content}"`,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // 保存助理消息到服务器
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({
          role: 'assistant',
          content: assistantMessage.content,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // 显示错误消息
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: '发送失败，请重试',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCsrfToken = () => {
    return document.cookie.split('csrf-token=')[1]?.split(';')[0] || '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg">
      {/* 头部 */}
      <div className="flex items-center px-4 py-3 border-b border-gray-200">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-xl">🤖</span>
        </div>
        <div className="ml-3">
          <h3 className="font-semibold text-gray-900">{agentName}</h3>
          <p className="text-xs text-green-600">在线</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>开始与 {agentName} 对话吧！</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">按 Enter 发送，Shift+Enter 换行</p>
      </div>
    </div>
  );
}
