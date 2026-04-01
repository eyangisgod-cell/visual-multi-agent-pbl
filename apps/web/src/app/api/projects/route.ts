import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Project creation schema
const projectCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  gradeMin: z.number().min(1).max(12).optional(),
  gradeMax: z.number().min(1).max(12).optional(),
  subject: z.string().max(50).optional(),
  difficulty: z.number().min(1).max(5).optional(),
  rubricCriteria: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    maxScore: z.number().min(1).max(10)
  })).optional()
})

// Project update schema
const projectUpdateSchema = projectCreateSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const subject = searchParams.get('subject')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (subject) {
      where.subject = subject
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        tasks: {
          orderBy: { orderIndex: 'asc' }
        },
        works: {
          select: {
            id: true,
            title: true,
            status: true,
            score: true,
            user: {
              select: {
                id: true,
                username: true,
                nickname: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = projectCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const project = await prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        gradeMin: data.gradeMin,
        gradeMax: data.gradeMax,
        subject: data.subject,
        difficulty: data.difficulty ?? 1,
        rubricCriteria: data.rubricCriteria ? JSON.stringify(data.rubricCriteria) : undefined,
        status: 'draft'
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
