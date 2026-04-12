import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/knowledge/documents - 获取知识库文档列表
// POST /api/admin/knowledge/documents - 上传新文档
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.knowledgeDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, metadata } = body;

    // 验证必填字段
    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const document = await prisma.knowledgeDocument.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        tags: tags || [],
        metadata: metadata || null,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'KNOWLEDGE_DOCUMENT_CREATED',
      entityType: 'KnowledgeDocument',
      entityId: document.id,
      metadata: {
        title: document.title,
        category: document.category,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge document' },
      { status: 500 }
    );
  }
}
