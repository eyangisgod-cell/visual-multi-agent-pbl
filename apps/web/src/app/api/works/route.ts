import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Work creation schema
const workCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  content: z.string().max(50000).optional(),
  coverImageUrl: z.string().url().optional(),
  projectId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'submitted']).optional().default('published')
})

/**
 * POST /api/works - 创建作品（学生端）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = workCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // TODO: Get user ID from session/token
    // For now, use a placeholder - in production, extract from auth token
    const userId = '00000000-0000-0000-0000-000000000001' // Placeholder

    const work = await prisma.work.create({
      data: {
        title: data.title,
        description: data.description,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        projectId: data.projectId,
        userId,
        status: data.status
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar_url: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json({ work }, { status: 201 })
  } catch (error) {
    console.error('Error creating work:', error)
    return NextResponse.json(
      { error: 'Failed to create work' },
      { status: 500 }
    )
  }
}
