import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AgentListResponse {
  success: boolean
  agents: Array<{
    id: string
    name: string
    role: string
    description: string
    avatarUrl: string
    status: 'available' | 'busy' | 'offline'
  }>
  error?: string
}

/**
 * GET /api/admin/agents/list
 * 获取可用智能体列表
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch agents from database
    const agents = await prisma.agent.findMany({
      where: {
        is_active: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map database agents to frontend format
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.agentType,
      description: agent.description || '',
      avatarUrl: agent.avatarUrl || '/avatars/default.png',
      status: agent.isPlatform ? 'available' : 'offline' as 'available' | 'busy' | 'offline'
    }))

    return NextResponse.json({
      success: true,
      agents: formattedAgents
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      {
        success: false,
        agents: [],
        error: '获取智能体列表失败'
      },
      { status: 500 }
    )
  }
}
