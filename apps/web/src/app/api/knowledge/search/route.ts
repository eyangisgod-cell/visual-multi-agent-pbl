import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/knowledge/search - 知识库向量搜索
// 当前实现：使用文本相似度搜索（ILIKE）
// TODO: 集成 pgvector 实现真正的向量相似度搜索
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category, limit = 10 } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 构建查询条件
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { content: { contains: query, mode: 'insensitive' as const } },
      ],
    };

    if (category) {
      where.category = category;
    }

    // 搜索文档
    const documents = await prisma.knowledgeDocument.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // 计算相关性分数（简化版本：基于匹配位置）
    const results = documents.map((doc: { id: string; title: string; content: string; category?: string | null; tags: string[] }) => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      // 标题匹配权重更高
      if (titleLower.includes(queryLower)) {
        score += 3;
      }

      // 内容匹配
      const contentIndex = contentLower.indexOf(queryLower);
      if (contentIndex >= 0) {
        score += 1;
        // 出现位置越前，分数越高
        if (contentIndex < 100) {
          score += 1;
        }
      }

      // 计算出现次数
      const matches = contentLower.split(queryLower).length - 1;
      score += Math.min(matches * 0.5, 2);

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content.length > 500 ? doc.content.substring(0, 500) + '...' : doc.content,
        category: doc.category,
        tags: doc.tags,
        score,
      };
    });

    // 按分数排序
    results.sort((a: { score: number }, b: { score: number }) => b.score - a.score);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge' },
      { status: 500 }
    );
  }
}
