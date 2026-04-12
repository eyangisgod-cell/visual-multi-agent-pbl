import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/knowledge/documents/[id] - 获取文档详情
// PUT /api/admin/knowledge/documents/[id] - 更新文档
// DELETE /api/admin/knowledge/documents/[id] - 删除文档
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, category, tags } = body;

    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const updatedDocument = await prisma.knowledgeDocument.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title.trim() : document.title,
        content: content !== undefined ? content.trim() : document.content,
        category: category !== undefined ? category.trim() : document.category,
        tags: tags !== undefined ? tags : document.tags,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'KNOWLEDGE_DOCUMENT_UPDATED',
      entityType: 'KnowledgeDocument',
      entityId: params.id,
      metadata: {
        changes: { title, content, category, tags },
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ document: updatedDocument });
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.knowledgeDocument.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    await prisma.knowledgeDocument.delete({
      where: { id: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'KNOWLEDGE_DOCUMENT_DELETED',
      entityType: 'KnowledgeDocument',
      entityId: params.id,
      metadata: {
        title: document.title,
        category: document.category,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge document' },
      { status: 500 }
    );
  }
}
