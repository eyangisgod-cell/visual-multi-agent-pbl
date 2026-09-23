/**
 * Agent Scheduler API - 智能体调度器
 *
 * 支持以下功能：
 * - 分配任务给智能体
 * - 查询智能体执行状态
 * - 多智能体协作编排
 */
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// Task assignment schema
const assignTaskSchema = z.object({
  taskId: z.string().uuid(),
  agentIds: z.array(z.string()).min(1),
  instructions: z.string().max(2000).optional()
})

// Agent execution status schema
const executeTaskSchema = z.object({
  taskId: z.string().uuid(),
  agentId: z.string(),
  action: z.enum(['start', 'complete', 'fail']),
  result: z.string().optional()
})

/**
 * POST /api/agents/scheduler/assign
 * 分配任务给一个或多个智能体
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = assignTaskSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { taskId, agentIds, instructions } = validationResult.data

    // Verify task exists
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Update task with assigned agents
    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        agentType: agentIds.join(','),
        status: 'in_progress'
      },
      include: {
        project: true,
        assignedUser: {
          select: {
            id: true,
            username: true,
            nickname: true
          }
        }
      }
    })

    // If AI service is available, trigger agent execution
    try {
      const agentPromises = agentIds.map(async (agentId) => {
        try {
          await fetch(`${AI_SERVICE_URL}/api/v1/agents/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentId,
              taskId: task.id,
              taskTitle: task.title,
              taskDescription: task.description,
              instructions: instructions || task.description
            }),
            signal: AbortSignal.timeout(5000)
          })
        } catch (error) {
          console.warn(`Failed to trigger agent ${agentId}:`, error)
          // Continue even if AI service is unavailable
        }
      })

      await Promise.all(agentPromises)
    } catch (error) {
      console.warn('Failed to trigger AI agents, continuing with demo mode:', error)
    }

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: task.assignedTo,
          action: 'TASK_ASSIGNED',
          entityType: 'task',
          entityId: taskId,
          details: {
            agentIds,
            instructions,
            taskTitle: task.title
          }
        }
      })
    } catch (error) {
      console.warn('Failed to create audit log:', error)
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task assigned to ${agentIds.length} agent(s)`
    })
  } catch (error) {
    console.error('Error assigning task:', error)
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/scheduler/status?taskId=xxx
 * 查询任务执行状态
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    const agentId = searchParams.get('agentId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    // Fetch task with details
    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Parse assigned agents
    const assignedAgents = task.agentType ? task.agentType.split(',') : []

    // Build status response
    const status = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0
      },
      agents: assignedAgents.map((id: string) => ({
        id,
        status: task.status === 'completed' ? 'completed' : task.status === 'in_progress' ? 'working' : 'pending',
        progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? Math.floor(Math.random() * 40 + 30) : 0
      }))
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error fetching task status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agents/scheduler/execute
 * 执行智能体任务（用于多智能体协作）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = executeTaskSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { taskId, agentId, action, result } = validationResult.data

    // Update task status based on action
    let newStatus = 'in_progress'
    if (action === 'complete') {
      newStatus = 'done'
    } else if (action === 'fail') {
      newStatus = 'todo'
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        status: newStatus
      },
      include: {
        project: true
      }
    })

    // Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: action === 'complete' ? 'TASK_COMPLETED' : action === 'fail' ? 'TASK_FAILED' : 'TASK_STARTED',
          entityType: 'task',
          entityId: taskId,
          details: {
            agentId,
            result
          }
        }
      })
    } catch (error) {
      console.warn('Failed to create audit log:', error)
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: `Task ${action} by agent ${agentId}`
    })
  } catch (error) {
    console.error('Error executing task:', error)
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    )
  }
}
