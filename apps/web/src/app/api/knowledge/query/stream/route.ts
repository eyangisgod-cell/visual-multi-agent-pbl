import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Rate limiting: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - limit.count };
}

// POST /api/knowledge/query/stream - RAG 流式问答接口
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { query, context_limit = 3 } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 搜索相关文档
    const searchQuery = query.substring(0, 100);
    const where = {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' as const } },
        { content: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    };

    const documents = await prisma.knowledgeDocument.findMany({
      where,
      take: context_limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
      },
    });

    // 构建上下文
    const context = documents.map((doc: { id: string; title: string; content: string; category?: string | null }) => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''),
    }));

    // 构建 prompt
    let systemPrompt = '你是一个智能助手，基于提供的知识库信息回答用户问题。';
    let userPrompt = query;

    if (documents.length > 0) {
      const contextText = documents.map((doc: { id: string; title: string; content: string }, index: number) =>
        `[${index + 1}] ${doc.title}\n${doc.content}`
      ).join('\n\n');

      userPrompt = `基于以下知识库信息回答问题：

${contextText}

问题：${query}

请根据以上知识库信息，给出准确、详细的回答。`;
    }

    // 调用 AI Service 的 LLM 流式生成回答
    try {
      const aiResponse = await fetch(`${AI_SERVICE_URL}/api/v1/llm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
          stream: true,
        }),
        timeout: 30000,
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const answer = aiData.response || aiData.answer || aiData.content || '';

        // 创建流式响应
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            const chunks = answer.split(' ');
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(chunk + ' '));
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.enqueue(encoder.encode(JSON.stringify({
              sources: context,
              usage: aiData.usage || {},
            })));
            controller.close();
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    } catch (error) {
      console.error('AI Service stream call failed:', error);
    }

    // Fallback: 返回普通响应
    const answer = generateFallbackAnswer(documents);
    return NextResponse.json({
      answer,
      sources: context,
      query,
    });

  } catch (error) {
    console.error('Error streaming knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to stream knowledge' },
      { status: 500 }
    );
  }
}

// Fallback: 当 AI Service 不可用时使用
function generateFallbackAnswer(documents: Array<{ id: string; title: string; content: string }>): string {
  if (documents.length === 0) {
    return '抱歉，知识库中没有找到与您的问题相关的信息。';
  }

  let answer = '根据知识库检索，我找到了以下相关信息：\n\n';
  documents.forEach((doc, index) => {
    answer += `${index + 1}. **${doc.title}**\n`;
    answer += `${doc.content.substring(0, 200)}...\n\n`;
  });
  return answer;
}
