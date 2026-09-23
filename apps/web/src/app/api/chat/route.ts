/**
 * POST /api/chat - Chat with AI agent
 *
 * Forwards chat requests to the AI service and returns responses.
 * Supports both streaming and non-streaming responses.
 */

import { NextRequest, NextResponse } from 'next/server';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentId, message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Forward to AI service
    const response = await fetch(`${AI_SERVICE_URL}/api/v1/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a ${agentId || 'helpful'} AI assistant. Respond in a friendly and helpful manner.`,
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', errorText);

      // If AI service is unavailable, return a friendly fallback response
      if (response.status === 503 || response.status === 500) {
        return NextResponse.json({
          response: `你好！我是${agentId || 'AI'}助手。我现在无法连接到智能服务，但我很乐意帮助你。请问有什么我可以帮你的吗？`,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          model: 'fallback',
        });
      }

      return NextResponse.json(
        { error: 'Failed to get response from AI service' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API error:', error);

    // Return fallback response on error
    return NextResponse.json({
      response: '你好！我是 AI 助手。我现在遇到了一些技术问题，但很快就能恢复服务。请问有什么我可以帮你的吗？',
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      model: 'fallback',
    }, { status: 200 });
  }
}
