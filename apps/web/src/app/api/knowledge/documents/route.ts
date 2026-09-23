import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/knowledge/documents - 创建知识库文档
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, generate_embedding = false } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // 生成 embedding（如果请求）
    let embedding: number[] | null = null;
    if (generate_embedding) {
      try {
        const embeddingResponse = await fetch(`${AI_SERVICE_URL}/api/v1/llm/embedding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: `${title} ${content}` }),
          timeout: 30000,
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          embedding = embeddingData.embedding;
        } else {
          console.warn('Failed to generate embedding, proceeding without it');
        }
      } catch (error) {
        console.error('Embedding generation failed:', error);
        // Continue without embedding
      }
    }

    // 将 embedding 转换为 Float32Array 用于 ByteA 存储
    let embeddingBytes: Uint8Array | null = null;
    if (embedding) {
      const float32Array = new Float32Array(embedding);
      embeddingBytes = new Uint8Array(float32Array.buffer);
    }

    // 创建文档
    const document = await prisma.knowledgeDocument.create({
      data: {
        title,
        content,
        category: category || null,
        tags: tags || [],
        embedding: embeddingBytes,
      },
    });

    return NextResponse.json({
      id: document.id,
      title: document.title,
      content: document.content,
      category: document.category,
      tags: document.tags,
      embedding: embedding || null,
      createdAt: document.createdAt,
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

// GET /api/knowledge/documents - 获取知识库文档列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = category ? { category } : {};

    const documents = await prisma.knowledgeDocument.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge/documents - 删除文档（支持批量删除）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',');

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: 'Document IDs are required' },
        { status: 400 }
      );
    }

    await prisma.knowledgeDocument.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Error deleting documents:', error);
    return NextResponse.json(
      { error: 'Failed to delete documents' },
      { status: 500 }
    );
  }
}
