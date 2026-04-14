import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/llm/[provider]/test - 测试 LLM API 连接
export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const llmConfig = await prisma.llmConfig.findUnique({
      where: { provider: params.provider },
    });

    if (!llmConfig) {
      return NextResponse.json(
        { error: 'LLM config not found' },
        { status: 404 }
      );
    }

    // 根据不同的 provider 测试连接
    let testUrl: string;
    let headers: HeadersInit = {};
    let body: any = {};

    if (llmConfig.baseUrl) {
      testUrl = `${llmConfig.baseUrl}/chat/completions`;
    } else {
      switch (llmConfig.provider.toLowerCase()) {
        case 'anthropic':
          testUrl = 'https://api.anthropic.com/v1/messages';
          headers = {
            'x-api-key': llmConfig.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          };
          body = {
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hello' }],
          };
          break;
        case 'openai':
          testUrl = 'https://api.openai.com/v1/chat/completions';
          headers = {
            'Authorization': `Bearer ${llmConfig.apiKey}`,
            'content-type': 'application/json',
          };
          body = {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 1,
          };
          break;
        default:
          // 对于自定义 provider，只测试基本连接
          testUrl = llmConfig.baseUrl || 'https://httpbin.org/status/200';
      }
    }

    // 如果不是上面定义的 provider，只检查基本连接
    if (!headers['Authorization'] && !headers['x-api-key']) {
      headers = {
        'Authorization': `Bearer ${llmConfig.apiKey}`,
      };
    }

    // 发送测试请求
    const response = await fetch(testUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Connection successful' });
    } else {
      return NextResponse.json(
        { success: false, message: `Connection failed: ${response.status}` },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    return NextResponse.json(
      { error: 'Failed to test LLM connection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
