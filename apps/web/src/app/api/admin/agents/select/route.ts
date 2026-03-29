import { NextRequest, NextResponse } from 'next/server'

export interface AgentSelectRequest {
  agentId: string
  projectId?: string
}

export interface AgentSelectResponse {
  success: boolean
  message?: string
}

/**
 * POST /api/admin/agents/select
 * 选择智能体
 */
export async function POST(request: NextRequest) {
  try {
    const body: AgentSelectRequest = await request.json()
    const { agentId, projectId } = body

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: '智能体 ID 不能为空' },
        { status: 400 }
      )
    }

    // TODO: Validate agent exists in database
    // TODO: Save selection to database

    console.log('Selecting agent:', agentId, 'for project:', projectId)

    return NextResponse.json({
      success: true,
      message: '智能体选择成功'
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

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: '项目 ID 不能为空' },
        { status: 400 }
      )
    }

    // TODO: Query database for selected agent

    return NextResponse.json({
      success: true,
      agent: null // Return selected agent if exists
    })
  } catch (error) {
    console.error('Error fetching selected agent:', error)
    return NextResponse.json(
      { success: false, message: '获取已选智能体失败' },
      { status: 500 }
    )
  }
}
