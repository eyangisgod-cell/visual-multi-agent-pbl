import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, MemoryType } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Memory creation schema
const memoryCreateSchema = z.object({
  agentId: z.string().min(1),
  type: z.nativeEnum(MemoryType),
  content: z.string().min(1).max(10000),
  importance: z.number().min(1).max(10).optional().default(1),
  tags: z.array(z.string()).optional().default([]),
})

// Memory query schema
const memoryQuerySchema = z.object({
  agentId: z.string().nullish(),
  type: z.enum(['SHORT_TERM', 'LONG_TERM', 'EPISODIC', 'PROCEDURAL', 'SEMANTIC']).nullish(),
  tag: z.string().nullish(),
  limit: z.coerce.number().min(1).max(100).default(50).catch(50),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = memoryCreateSchema.safeParse(body)
    if (!validationResult.success) {
      const errorResult = validationResult as z.SafeParseError<{ agentId: string; type: MemoryType; content: string; importance: number; tags: string[] }>
      return NextResponse.json(
        { error: 'Invalid input', details: errorResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const memory = await prisma.agentMemory.create({
      data: {
        agentId: data.agentId,
        type: data.type,
        content: data.content,
        importance: data.importance,
        tags: data.tags,
      },
    })

    return NextResponse.json({ memory }, { status: 201 })
  } catch (error) {
    console.error('Error creating memory:', error)
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Validate query parameters
    const validationResult = memoryQuerySchema.safeParse({
      agentId: searchParams.get('agentId'),
      type: searchParams.get('type'),
      tag: searchParams.get('tag'),
      limit: searchParams.get('limit'),
    })

    if (!validationResult.success) {
      const errorResult = validationResult as z.SafeParseError<{ agentId?: string; type?: MemoryType; tag?: string; limit?: number }>
      return NextResponse.json(
        { error: 'Invalid query parameters', details: errorResult.error.errors },
        { status: 400 }
      )
    }

    const { agentId, type, tag, limit } = validationResult.data

    const where: Record<string, unknown> = {}

    if (agentId) {
      where.agentId = agentId
    }

    if (type) {
      where.type = type
    }

    if (tag) {
      where.tags = { has: tag }
    }

    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: { importance: 'desc' },
      take: typeof limit === 'number' ? limit : 50,
    })

    return NextResponse.json({ memories })
  } catch (error) {
    console.error('Error fetching memories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    )
  }
}
