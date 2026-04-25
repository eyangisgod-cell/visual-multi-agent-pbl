import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Task creation schema
const taskCreateSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  orderIndex: z.number().int().min(0),
  agentType: z.string().max(50).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional()
})

// Task update schema
const taskUpdateSchema = taskCreateSchema.partial()

// Task submission schema
const taskSubmissionSchema = z.object({
  submissionContent: z.string(),
  rubricScores: z.array(z.object({
    criterionId: z.string(),
    score: z.number().min(0).max(10)
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')
    const agentType = searchParams.get('agentType')

    const where: Record<string, unknown> = {}

    if (projectId) {
      where.projectId = projectId
    }

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    if (status) {
      where.status = status
    }

    if (agentType) {
      where.agentType = agentType
    }

    const tasks = await prisma.projectTask.findMany({
      where,
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
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = taskCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        orderIndex: data.orderIndex,
        agentType: data.agentType,
        assignedTo: data.assignedTo,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'todo'
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

    // Launch AI agent if agentType is specified
    if (data.agentType) {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000'
      fetch(`${aiServiceUrl}/api/v1/agents/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: data.agentType,
          taskId: task.id,
          taskTitle: task.title,
          taskDescription: task.description
        })
      }).catch(err => {
        console.error('Failed to launch agent:', err)
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
