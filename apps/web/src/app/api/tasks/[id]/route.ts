import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Task update schema
const taskUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  orderIndex: z.number().int().min(0).optional(),
  agentType: z.string().max(50).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  rubricScores: z.any().optional()
})

// Task submission schema
const taskSubmissionSchema = z.object({
  submissionContent: z.string(),
  rubricScores: z.array(z.object({
    criterionId: z.string(),
    score: z.number().min(0).max(10)
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.projectTask.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            rubricCriteria: true
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

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = taskUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if task exists
    const existingTask = await prisma.projectTask.findUnique({
      where: { id: params.id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const task = await prisma.projectTask.update({
      where: { id: params.id },
      data: {
        ...data,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        rubricScores: data.rubricScores !== undefined ? JSON.stringify(data.rubricScores) : undefined
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

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.projectTask.findUnique({
      where: { id: params.id }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await prisma.projectTask.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate submission
    const validationResult = taskSubmissionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { submissionContent, rubricScores } = validationResult.data

    const task = await prisma.projectTask.update({
      where: { id: params.id },
      data: {
        submissionContent,
        rubricScores: rubricScores ? JSON.stringify(rubricScores) : undefined,
        submittedAt: new Date(),
        status: 'review'
      },
      include: {
        project: true
      }
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error submitting task:', error)
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    )
  }
}
