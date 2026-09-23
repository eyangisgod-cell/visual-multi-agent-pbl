import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/knowledge/query - RAG 问答接口
// 使用向量相似度检索相关知识并调用 AI Service 的 LLM 生成回答
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context_limit = 3 } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 生成 query 的 embedding
    let queryEmbedding: number[] | null = null;
    try {
      const embeddingResponse = await fetch(`${AI_SERVICE_URL}/api/v1/llm/embedding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
        timeout: 10000,
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        queryEmbedding = embeddingData.embedding;
      }
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      // Continue without embedding
    }

    let documents: any[] = [];

    // 使用向量相似度搜索或文本搜索
    if (queryEmbedding && queryEmbedding.length > 0) {
      const embeddingStr = JSON.stringify(queryEmbedding);

      const queryText = `
        SELECT
          d.id,
          d.title,
          d.content,
          d.category,
          1 - (d.embedding <=> '${embeddingStr}'::vector) as score
        FROM knowledge_documents d
        WHERE 1 - (d.embedding <=> '${embeddingStr}'::vector) > 0
        ORDER BY score DESC
        LIMIT ${context_limit}
      `;

      documents = await prisma.$queryRawUnsafe(queryText);
    } else {
      // Fallback: 文本搜索
      const searchQuery = query.substring(0, 100);
      const where = {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' as const } },
          { content: { contains: searchQuery, mode: 'insensitive' as const } },
        ],
      };

      documents = await prisma.knowledgeDocument.findMany({
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
    }

    // 构建上下文
    const context = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''),
      score: (doc as any).score || 0,
    }));

    // 构建 prompt
    let systemPrompt = '你是一个智能助手，基于提供的知识库信息回答用户问题。如果知识库中没有相关信息，请诚实地告知用户。';
    let userPrompt = query;

    if (documents.length > 0) {
      const contextText = documents.map((doc: any) =>
        `[${doc.id}] ${doc.title}\n${doc.content}`
      ).join('\n\n');

      userPrompt = `基于以下知识库信息回答问题：

${contextText}

问题：${query}

请根据以上知识库信息，给出准确、详细的回答。`;
    }

    // 调用 AI Service 的 LLM 生成回答
    let answer = '';
    let usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

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
        }),
        timeout: 30000,
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        answer = aiData.response || aiData.answer || aiData.content || '';
        usage = aiData.usage || usage;
      } else {
        // AI Service 不可用或返回错误，使用 fallback
        answer = generateFallbackAnswer(documents);
      }
    } catch (error) {
      console.error('AI Service call failed, using fallback:', error);
      // AI Service 调用失败，使用 fallback
      answer = generateFallbackAnswer(documents);
    }

    return NextResponse.json({
      answer,
      sources: context,
      query,
      usage,
    });
  } catch (error) {
    console.error('Error querying knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to query knowledge' },
      { status: 500 }
    );
  }
}

// Fallback: 当 AI Service 不可用时使用
function generateFallbackAnswer(documents: Array<{ id: string; title: string; content: string }>): string {
  if (documents.length === 0) {
    return '抱歉，知识库中没有找到与您的问题相关的信息。您可以：\n' +
      '1. 尝试使用不同的关键词搜索\n' +
      '2. 上传更多相关文档到知识库\n' +
      '3. 联系管理员获取帮助';
  }

  let answer = '根据知识库检索，我找到了以下相关信息：\n\n';
  documents.forEach((doc, index) => {
    answer += `${index + 1}. **${doc.title}**\n`;
    answer += `${doc.content.substring(0, 200)}...\n\n`;
  });
  answer += '\n以上信息来源于知识库，如需更详细的解答，请咨询相关专业人士。';
  return answer;
}
