import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/knowledge/query - RAG 问答接口
// 检索相关知识并生成回答
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

    // 搜索相关文档
    const searchQuery = query.substring(0, 100); // 限制搜索关键词长度
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

    // 生成回答（简化版本：返回检索到的内容）
    // TODO: 集成 LLM 生成真正的回答
    let answer = '根据知识库检索，我找到了以下相关信息：\n\n';

    if (documents.length === 0) {
      answer = '抱歉，知识库中没有找到与您的问题相关的信息。您可以：\n' +
        '1. 尝试使用不同的关键词搜索\n' +
        '2. 上传更多相关文档到知识库\n' +
        '3. 联系管理员获取帮助';
    } else {
      documents.forEach((doc: { id: string; title: string; content: string; category?: string | null }, index: number) => {
        answer += `${index + 1}. **${doc.title}**\n`;
        answer += `${doc.content.substring(0, 200)}...\n\n`;
      });

      answer += '\n以上信息来源于知识库，如需更详细的解答，请咨询相关专业人士。';
    }

    return NextResponse.json({
      answer,
      sources: context,
      query,
    });
  } catch (error) {
    console.error('Error querying knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to query knowledge' },
      { status: 500 }
    );
  }
}
