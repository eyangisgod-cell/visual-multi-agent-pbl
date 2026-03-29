import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, MemoryType } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query request schema
const querySchema = z.object({
  agentId: z.string().min(1),
  query: z.string().min(1),
  type: z.nativeEnum(MemoryType).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).optional().default(10),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = querySchema.safeParse(body)
    if (!validationResult.success) {
      const errorResult = validationResult as z.SafeParseError<{ agentId: string; query: string; type?: MemoryType; tags?: string[]; limit?: number }>
      return NextResponse.json(
        { error: 'Invalid input', details: errorResult.error.errors },
        { status: 400 }
      )
    }

    const { agentId, query, type, tags, limit } = validationResult.data

    // Build where clause
    const where: Record<string, unknown> = {
      agentId,
    }

    if (type) {
      where.type = type
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    // Search by content similarity (case-insensitive)
    // In production with pgvector, this would use vector similarity
    const searchTerms = query.split(' ').filter(term => term.length > 0)

    const orConditions = searchTerms.map(term => ({
      content: {
        contains: term,
        mode: 'insensitive' as const,
      },
    }))

    if (orConditions.length > 0) {
      where.OR = orConditions
    }

    // Execute query
    const memories = await prisma.agentMemory.findMany({
      where,
      orderBy: { importance: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      memories,
      count: memories.length,
    })
  } catch (error) {
    console.error('Error querying memories:', error)
    return NextResponse.json(
      { error: 'Failed to query memories' },
      { status: 500 }
    )
  }
}
