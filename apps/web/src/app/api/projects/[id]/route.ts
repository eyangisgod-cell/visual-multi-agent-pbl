import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Project update schema
const projectUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  gradeMin: z.number().min(1).max(12).optional(),
  gradeMax: z.number().min(1).max(12).optional(),
  subject: z.string().max(50).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  rubricCriteria: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    maxScore: z.number().min(1).max(10)
  })).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        },
        works: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                nickname: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
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
    const validationResult = projectUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        rubricCriteria: data.rubricCriteria ? JSON.stringify(data.rubricCriteria) : undefined
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
