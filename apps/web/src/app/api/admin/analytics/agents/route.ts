import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/admin/analytics/agents - 获取智能体使用统计
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // 计算起始日期
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 获取智能体使用总数
    const totalAgentUsage = await prisma.userAgent.count()

    // 获取对话总数
    const totalConversations = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // 按智能体分组统计使用次数
    const topAgents = await prisma.userAgent.groupBy({
      by: ['agentId'],
      _count: true,
      orderBy: {
        _count: {
          agentId: 'desc',
        },
      },
      take: 10,
    })

    // 按智能体类型分组统计
    const agentTypeUsage = await prisma.userAgent.groupBy({
      by: ['agentId'],
      _count: true,
    })

    // 获取智能体详情
    const agentIds = agentTypeUsage.map((item) => item.agentId)
    const agents = await prisma.agent.findMany({
      where: {
        id: {
          in: agentIds,
        },
      },
      select: {
        id: true,
        name: true,
        agentType: true,
      },
    })

    // 按类型聚合
    const typeDistribution: Record<string, number> = {}
    agents.forEach((agent) => {
      const usage = agentTypeUsage.find((u) => u.agentId === agent.id)
      const count = usage?._count || 0
      typeDistribution[agent.agentType] = (typeDistribution[agent.agentType] || 0) + count
    })

    // 获取对话趋势（按日期）
    const conversationTrend = await prisma.conversation.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
    })

    // 处理对话趋势数据
    const dailyConversationTrend: Record<string, number> = {}
    conversationTrend.forEach((item) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      dailyConversationTrend[date] = (dailyConversationTrend[date] || 0) + item._count
    })

    // 构建顶级智能体列表（带名称）
    const topAgentsWithDetails = await Promise.all(
      topAgents.map(async (item) => {
        const agent = await prisma.agent.findUnique({
          where: { id: item.agentId },
          select: { name: true, agentType: true },
        })
        return {
          agentId: item.agentId,
          name: agent?.name || 'Unknown',
          agentType: agent?.agentType || 'unknown',
          usageCount: item._count,
        }
      })
    )

    return NextResponse.json({
      totalAgentUsage,
      totalConversations,
      topAgents: topAgentsWithDetails,
      typeDistribution,
      conversationTrend: dailyConversationTrend,
    })
  } catch (error) {
    console.error('Error fetching agent analytics:', error)
    return NextResponse.json(
      { error: '获取智能体使用统计失败' },
      { status: 500 }
    )
  }
}
