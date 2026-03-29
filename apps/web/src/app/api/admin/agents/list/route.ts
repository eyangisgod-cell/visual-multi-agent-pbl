import { NextRequest, NextResponse } from 'next/server'

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
}

/**
 * GET /api/admin/agents/list
 * 获取可用智能体列表
 */
export async function GET(request: NextRequest) {
  try {
    // Mock data - will be replaced with database query
    const agents: AgentListResponse['agents'] = [
      {
        id: 'agent-1',
        name: '导师智能体',
        role: '学习导师',
        description: '帮助学生制定学习计划，提供学习指导和反馈',
        avatarUrl: '/avatars/mentor.png',
        status: 'available'
      },
      {
        id: 'agent-2',
        name: '分析师智能体',
        role: '数据分析师',
        description: '分析项目数据，提供洞察和建议',
        avatarUrl: '/avatars/analyst.png',
        status: 'available'
      },
      {
        id: 'agent-3',
        name: '设计师智能体',
        role: 'UI/UX 设计师',
        description: '协助设计用户界面和体验',
        avatarUrl: '/avatars/designer.png',
        status: 'busy'
      },
      {
        id: 'agent-4',
        name: '市场智能体',
        role: '市场营销专家',
        description: '提供市场推广和品牌建设建议',
        avatarUrl: '/avatars/marketer.png',
        status: 'available'
      },
      {
        id: 'agent-5',
        name: '助手智能体',
        role: '通用助手',
        description: '处理日常任务和协调工作',
        avatarUrl: '/avatars/assistant.png',
        status: 'offline'
      }
    ]

    return NextResponse.json({
      success: true,
      agents
    })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { success: false, error: '获取智能体列表失败' },
      { status: 500 }
    )
  }
}
