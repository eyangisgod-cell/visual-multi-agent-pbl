import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createAuditLog, extractIpAddress, extractUserAgent } from '@/lib/audit-logger';

const prisma = new PrismaClient();

// GET /api/admin/agents/[id] - 获取智能体详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agent = await prisma.agentConfig.findUnique({
      where: { id: params.id },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/agents/[id] - 更新智能体
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      personality,
      skills,
      appearance,
      isEnabled,
    } = body;

    const existingAgent = await prisma.agentConfig.findUnique({
      where: { id: params.id },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const updatedAgent = await prisma.agentConfig.update({
      where: { id: params.id },
      data: {
        name,
        description,
        personality,
        skills,
        appearance,
        isEnabled,
      },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'UPDATE_AGENT',
      entityType: 'AgentConfig',
      entityId: params.id,
      metadata: {
        name,
        description,
        changes: {
          name: name !== existingAgent.name,
          description: description !== existingAgent.description,
          personality: JSON.stringify(personality) !== JSON.stringify(existingAgent.personality),
          skills: JSON.stringify(skills) !== JSON.stringify(existingAgent.skills),
          appearance: JSON.stringify(appearance) !== JSON.stringify(existingAgent.appearance),
          isEnabled: isEnabled !== existingAgent.isEnabled,
        },
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json(updatedAgent);
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/agents/[id] - 删除智能体
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingAgent = await prisma.agentConfig.findUnique({
      where: { id: params.id },
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    await prisma.agentConfig.delete({
      where: { id: params.id },
    });

    // 创建审计日志
    await createAuditLog({
      action: 'DELETE_AGENT',
      entityType: 'AgentConfig',
      entityId: params.id,
      metadata: {
        agentType: existingAgent.agentType,
        name: existingAgent.name,
      },
      ipAddress: extractIpAddress(request.headers),
      userAgent: extractUserAgent(request.headers),
    });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
