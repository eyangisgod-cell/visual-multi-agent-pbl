import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/agents - 获取智能体列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isEnabled = searchParams.get('isEnabled');

    const where = isEnabled !== null ? { isEnabled: isEnabled === 'true' } : {};

    const agents = await prisma.agentConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST /api/admin/agents - 创建新智能体
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentType,
      name,
      description,
      personality,
      skills,
      appearance,
    } = body;

    if (!agentType || !name) {
      return NextResponse.json(
        { error: 'Agent type and name are required' },
        { status: 400 }
      );
    }

    const existingAgent = await prisma.agentConfig.findUnique({
      where: { agentType },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: 'Agent type already exists' },
        { status: 409 }
      );
    }

    const agent = await prisma.agentConfig.create({
      data: {
        agentType,
        name,
        description,
        personality,
        skills,
        appearance,
        isEnabled: true,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
