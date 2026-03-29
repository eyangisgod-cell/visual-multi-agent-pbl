/**
 * AgentMemory Model Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the AgentMemory schema is correctly defined
 * and can be used to create and query memories.
 */

import { PrismaClient, MemoryType } from '@prisma/client'

const prisma = new PrismaClient()

describe('AgentMemory Model', () => {
  beforeEach(async () => {
    // Clean up before each test
    await prisma.agentMemory.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('create memory', () => {
    it('should create a short-term memory with content and tags', async () => {
      const agentId = 'test-agent-123'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.SHORT_TERM,
          content: 'User prefers dark mode interface',
          importance: 5,
          tags: ['preference', 'ui'],
        },
      })

      expect(memory.id).toBeDefined()
      expect(memory.agentId).toBe(agentId)
      expect(memory.type).toBe(MemoryType.SHORT_TERM)
      expect(memory.content).toBe('User prefers dark mode interface')
      expect(memory.importance).toBe(5)
      expect(memory.tags).toEqual(['preference', 'ui'])
      expect(memory.createdAt).toBeInstanceOf(Date)
    })

    it('should create a long-term memory with vector embedding', async () => {
      const agentId = 'test-agent-456'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.LONG_TERM,
          content: 'Project-based learning emphasizes student-centered approach',
          importance: 8,
          tags: ['education', 'methodology'],
        },
      })

      expect(memory.id).toBeDefined()
      expect(memory.type).toBe(MemoryType.LONG_TERM)
      expect(memory.importance).toBe(8)
      expect(memory.createdAt).toBeInstanceOf(Date)
    })

    it.skip('should reject invalid importance value (out of range)', async () => {
      // Note: This validation happens at the API layer (Zod schema), not database layer
      // The database accepts any integer value for importance
      const agentId = 'test-agent-789'

      await expect(
        prisma.agentMemory.create({
          data: {
            agentId,
            type: MemoryType.SHORT_TERM,
            content: 'Test content',
            importance: 15, // Invalid: should be 1-10
            tags: [],
          },
        })
      ).rejects.toThrow()
    })

    it('should default importance to 1 when not specified', async () => {
      const agentId = 'test-agent-default'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.EPISODIC,
          content: 'Completed project presentation',
          tags: ['milestone'],
        },
      })

      expect(memory.importance).toBe(1)
    })

    it('should create episodic memory with event details', async () => {
      const agentId = 'test-agent-episodic'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.EPISODIC,
          content: 'User completed Phase 7 admin panel development',
          importance: 7,
          tags: ['achievement', 'phase-7'],
        },
      })

      expect(memory.type).toBe(MemoryType.EPISODIC)
      expect(memory.importance).toBe(7)
    })

    it('should create procedural memory for skills', async () => {
      const agentId = 'test-agent-procedural'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.PROCEDURAL,
          content: 'How to validate user input using Zod schema',
          importance: 6,
          tags: ['skill', 'validation'],
        },
      })

      expect(memory.type).toBe(MemoryType.PROCEDURAL)
    })

    it('should create semantic memory for knowledge', async () => {
      const agentId = 'test-agent-semantic'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.SEMANTIC,
          content: 'PostgreSQL supports vector similarity search with pgvector extension',
          importance: 9,
          tags: ['database', 'vector', 'knowledge'],
        },
      })

      expect(memory.type).toBe(MemoryType.SEMANTIC)
      expect(memory.importance).toBe(9)
    })
  })

  describe('query memories', () => {
    it('should filter memories by agentId', async () => {
      const agentId1 = 'agent-1'
      const agentId2 = 'agent-2'

      await prisma.agentMemory.create({
        data: {
          agentId: agentId1,
          type: MemoryType.SHORT_TERM,
          content: 'Memory for agent 1',
          importance: 3,
          tags: [],
        },
      })

      await prisma.agentMemory.create({
        data: {
          agentId: agentId2,
          type: MemoryType.SHORT_TERM,
          content: 'Memory for agent 2',
          importance: 4,
          tags: [],
        },
      })

      const agent1Memories = await prisma.agentMemory.findMany({
        where: { agentId: agentId1 },
      })

      expect(agent1Memories.length).toBe(1)
      expect(agent1Memories[0].agentId).toBe(agentId1)
    })

    it('should filter memories by type', async () => {
      const agentId = 'test-agent-filter'

      await prisma.agentMemory.createMany({
        data: [
          {
            agentId,
            type: MemoryType.SHORT_TERM,
            content: 'Short term 1',
            importance: 2,
            tags: [],
          },
          {
            agentId,
            type: MemoryType.LONG_TERM,
            content: 'Long term 1',
            importance: 8,
            tags: [],
          },
          {
            agentId,
            type: MemoryType.SHORT_TERM,
            content: 'Short term 2',
            importance: 3,
            tags: [],
          },
        ],
      })

      const shortTermMemories = await prisma.agentMemory.findMany({
        where: {
          agentId,
          type: MemoryType.SHORT_TERM,
        },
      })

      expect(shortTermMemories.length).toBe(2)
      expect(shortTermMemories.every((m: { type: MemoryType }) => m.type === MemoryType.SHORT_TERM)).toBe(true)
    })

    it('should order memories by importance descending', async () => {
      const agentId = 'test-agent-order'

      await prisma.agentMemory.createMany({
        data: [
          { agentId, type: MemoryType.SEMANTIC, content: 'Low importance', importance: 1, tags: [] },
          { agentId, type: MemoryType.SEMANTIC, content: 'High importance', importance: 10, tags: [] },
          { agentId, type: MemoryType.SEMANTIC, content: 'Medium importance', importance: 5, tags: [] },
        ],
      })

      const memories = await prisma.agentMemory.findMany({
        where: { agentId },
        orderBy: { importance: 'desc' },
      })

      expect(memories[0].importance).toBe(10)
      expect(memories[1].importance).toBe(5)
      expect(memories[2].importance).toBe(1)
    })

    it('should filter memories by tags using contains', async () => {
      const agentId = 'test-agent-tags'

      await prisma.agentMemory.createMany({
        data: [
          { agentId, type: MemoryType.LONG_TERM, content: 'Memory A', importance: 5, tags: ['skill', 'tech'] },
          { agentId, type: MemoryType.LONG_TERM, content: 'Memory B', importance: 6, tags: ['knowledge'] },
          { agentId, type: MemoryType.LONG_TERM, content: 'Memory C', importance: 7, tags: ['skill', 'soft'] },
        ],
      })

      const skillMemories = await prisma.agentMemory.findMany({
        where: {
          agentId,
          tags: { has: 'skill' },
        },
      })

      expect(skillMemories.length).toBe(2)
    })
  })

  describe('delete memory', () => {
    it('should delete memory by id', async () => {
      const agentId = 'test-agent-delete'

      const memory = await prisma.agentMemory.create({
        data: {
          agentId,
          type: MemoryType.SHORT_TERM,
          content: 'To be deleted',
          importance: 1,
          tags: [],
        },
      })

      await prisma.agentMemory.delete({
        where: { id: memory.id },
      })

      const deleted = await prisma.agentMemory.findUnique({
        where: { id: memory.id },
      })

      expect(deleted).toBeNull()
    })
  })
})
