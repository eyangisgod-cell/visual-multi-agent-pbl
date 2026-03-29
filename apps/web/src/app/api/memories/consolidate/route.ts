import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, MemoryType } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Consolidation request schema
const consolidationSchema = z.object({
  agentId: z.string().min(1),
  minImportance: z.number().min(1).max(10).optional().default(7),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = consolidationSchema.safeParse(body)
    if (!validationResult.success) {
      const errorResult = validationResult as z.SafeParseError<{ agentId: string; minImportance?: number }>
      return NextResponse.json(
        { error: 'Invalid input', details: errorResult.error.errors },
        { status: 400 }
      )
    }

    const { agentId, minImportance } = validationResult.data

    // Find short-term memories meeting criteria
    const shortTermMemories = await prisma.agentMemory.findMany({
      where: {
        agentId,
        type: MemoryType.SHORT_TERM,
        importance: { gte: minImportance },
      },
    })

    let consolidated = 0

    // Convert each short-term memory to long-term
    for (const memory of shortTermMemories) {
      await prisma.agentMemory.create({
        data: {
          agentId: memory.agentId,
          type: MemoryType.LONG_TERM,
          content: memory.content,
          importance: memory.importance,
          tags: memory.tags,
        },
      })

      // Delete the original short-term memory
      await prisma.agentMemory.delete({
        where: { id: memory.id },
      })

      consolidated++
    }

    return NextResponse.json({
      consolidated,
      message: `Successfully consolidated ${consolidated} memories`,
    })
  } catch (error) {
    console.error('Error consolidating memories:', error)
    return NextResponse.json(
      { error: 'Failed to consolidate memories' },
      { status: 500 }
    )
  }
}
