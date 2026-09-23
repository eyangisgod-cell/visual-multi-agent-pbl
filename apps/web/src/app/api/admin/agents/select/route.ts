import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AgentSelectRequest {
  agentId: string
  projectId?: string
}

export interface AgentSelectResponse {
  success: boolean
  message?: string
  agent?: {
    id: string
    name: string
    role: string
    description: string
    avatarUrl: string
  }
}

/**
 * POST /api/admin/agents/select
 * 选择智能体
 */
export async function POST(request: NextRequest) {
  try {
    const body: AgentSelectRequest = await request.json()
    const { agentId, projectId } = body

    // 从 session 获取当前用户 ID
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    // 验证 session 并获取用户 ID
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: '会话已过期' },
        { status: 401 }
      )
    }

    const userId = session.userId

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: '智能体 ID 不能为空' },
        { status: 400 }
      )
    }

    // 验证智能体是否存在
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    })

    if (!agent) {
      return NextResponse.json(
        { success: false, message: '智能体不存在' },
        { status: 404 }
      )
    }

    // 保存智能体选择到 UserAgent 表
    const userAgent = await prisma.userAgent.upsert({
      where: {
        userId_agentId: {
          userId,
          agentId,
        },
      },
      update: {
        usage_count: { increment: 1 },
      },
      create: {
        userId,
        agentId,
        usage_count: 1,
      },
    })

    console.log('UserAgent created/updated:', userAgent.id)

    // 如果关联了项目，更新 ProjectTask 的 agentType
    if (projectId) {
      await prisma.projectTask.updateMany({
        where: { projectId },
        data: { agentType: agent.agentType },
      })
      console.log('ProjectTask updated for project:', projectId)
    }

    return NextResponse.json({
      success: true,
      message: '智能体选择成功',
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.agentType,
        description: agent.description || '',
        avatarUrl: agent.avatarUrl || '/avatars/default.png',
      }
    })
  } catch (error) {
    console.error('Error selecting agent:', error)
    return NextResponse.json(
      { success: false, message: '选择智能体失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/agents/select
 * 获取当前选择的智能体
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')

    if (!projectId && !userId) {
      return NextResponse.json(
        { success: false, message: '项目 ID 或用户 ID 不能为空' },
        { status: 400 }
      )
    }

    // Query UserAgent table for selected agent
    let selectedAgent = null

    if (projectId) {
      // Find agent selected for specific project
      const projectTask = await prisma.projectTask.findFirst({
        where: {
          projectId,
          agentType: { not: null },
        },
        select: { agentType: true },
      })

      if (projectTask && projectTask.agentType) {
        selectedAgent = await prisma.agent.findFirst({
          where: { agentType: projectTask.agentType },
        })
      }
    } else if (userId) {
      // Find user's selected agent
      const userAgent = await prisma.userAgent.findFirst({
        where: { userId },
        select: { agent: true },
      })

      if (userAgent) {
        selectedAgent = userAgent.agent
      }
    }

    if (!selectedAgent) {
      return NextResponse.json({
        success: true,
        agent: null
      })
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        role: selectedAgent.agentType,
        description: selectedAgent.description || '',
        avatarUrl: selectedAgent.avatarUrl || '/avatars/default.png',
      }
    })
  } catch (error) {
    console.error('Error fetching selected agent:', error)
    return NextResponse.json(
      { success: false, message: '获取已选智能体失败' },
      { status: 500 }
    )
  }
}
