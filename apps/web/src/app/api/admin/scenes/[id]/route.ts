import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// 验证 UUID 格式
function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/admin/scenes/:id - 获取场景详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: '无效的场景 ID' },
        { status: 400 }
      );
    }

    const scene = await prisma.scene.findUnique({
      where: { id },
    });

    if (!scene) {
      return NextResponse.json(
        { error: '场景不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(scene);
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: '获取场景详情失败' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/scenes/:id - 更新场景
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: '无效的场景 ID' },
        { status: 400 }
      );
    }

    // 检查场景是否存在
    const existingScene = await prisma.scene.findUnique({
      where: { id },
    });

    if (!existingScene) {
      return NextResponse.json(
        { error: '场景不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      elements,
      resources,
      isActive,
    } = body;

    // 验证字段
    if (name !== undefined) {
      if (name.length > 100) {
        return NextResponse.json(
          { error: '场景名称不能超过 100 个字符' },
          { status: 400 }
        );
      }
    }

    const updatedScene = await prisma.scene.update({
      where: { id },
      data: {
        name,
        description,
        elements,
        resources,
        isActive,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'SCENE_UPDATED',
      entityType: 'Scene',
      entityId: updatedScene.id,
      metadata: {
        name,
        description,
        isActive,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json(updatedScene);
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: '更新场景失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/scenes/:id - 删除场景
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: '无效的场景 ID' },
        { status: 400 }
      );
    }

    // 检查场景是否存在
    const existingScene = await prisma.scene.findUnique({
      where: { id },
    });

    if (!existingScene) {
      return NextResponse.json(
        { error: '场景不存在' },
        { status: 404 }
      );
    }

    await prisma.scene.delete({
      where: { id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'SCENE_DELETED',
      entityType: 'Scene',
      entityId: id,
      metadata: {
        deletedSceneId: id,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: '场景已删除' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: '删除场景失败' },
      { status: 500 }
    );
  }
}
