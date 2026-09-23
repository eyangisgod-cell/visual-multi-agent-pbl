import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/knowledge/search - 知识库向量搜索
// 使用 pgvector 余弦相似度搜索
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category, limit = 10, include_embeddings = false } = body;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 调用 AI Service 生成 query 的 embedding
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
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
      console.error('Failed to generate query embedding, falling back to text search:', error);
      // Continue with text search if embedding fails
    }

    let results: any[] = [];

    if (queryEmbedding && queryEmbedding.length > 0) {
      // 使用 pgvector 向量相似度搜索
      const embeddingStr = JSON.stringify(queryEmbedding);
      const categoryFilter = category ? `AND d.category = '${category}'` : '';

      const queryText = `
        SELECT
          d.id,
          d.title,
          d.content,
          d.category,
          d.tags,
          1 - (d.embedding <=> '${embeddingStr}'::vector) as score
        FROM knowledge_documents d
        WHERE 1 - (d.embedding <=> '${embeddingStr}'::vector) > 0
          ${categoryFilter}
        ORDER BY score DESC
        LIMIT ${limit}
      `;

      const documents = await prisma.$queryRawUnsafe(queryText);
      results = documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content.length > 500 ? doc.content.substring(0, 500) + '...' : doc.content,
        category: doc.category,
        tags: doc.tags || [],
        score: parseFloat((doc.score || 0).toFixed(4)),
      }));
    } else {
      // Fallback: 使用文本相似度搜索（ILIKE）
      const where: any = {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { content: { contains: query, mode: 'insensitive' as const } },
        ],
      };

      if (category) {
        where.category = category;
      }

      const documents = await prisma.knowledgeDocument.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // 计算相关性分数（简化版本：基于匹配位置）
      results = documents.map((doc: any) => {
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
          tags: doc.tags || [],
          score: parseFloat(score.toFixed(2)),
        };
      });
    }

    // 按分数排序
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge' },
      { status: 500 }
    );
  }
}
