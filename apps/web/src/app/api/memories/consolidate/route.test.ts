/**
 * Memories Consolidation API Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the memory consolidation endpoint
 * correctly converts short-term memories to long-term memories.
 */

import { PrismaClient, MemoryType } from '@prisma/client'
import { NextRequest } from 'next/server'

// Mock Prisma - define before jest.mock
const mockFindMany = jest.fn()
const mockCreate = jest.fn()
const mockDelete = jest.fn()
const mockUpdate = jest.fn()

const mockPrismaInstance = {
  agentMemory: {
    findMany: mockFindMany,
    create: mockCreate,
    delete: mockDelete,
    update: mockUpdate,
  },
  $disconnect: jest.fn(),
}

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaInstance),
    MemoryType: {
      SHORT_TERM: 'SHORT_TERM',
      LONG_TERM: 'LONG_TERM',
      EPISODIC: 'EPISODIC',
      PROCEDURAL: 'PROCEDURAL',
      SEMANTIC: 'SEMANTIC',
    },
  }
})

import { POST } from './route'

describe('Memories Consolidation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/memories/consolidate', () => {
    it('should consolidate short-term memories to long-term', async () => {
      const shortTermMemories = [
        {
          id: 'st-1',
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          content: 'Important learning 1',
          importance: 8,
          tags: ['learning'],
          createdAt: new Date(),
        },
        {
          id: 'st-2',
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          content: 'Important learning 2',
          importance: 9,
          tags: ['learning'],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(shortTermMemories)
      mockCreate.mockImplementation(({ data }) => Promise.resolve({
        id: `lt-${Date.now()}`,
        ...data,
        type: MemoryType.LONG_TERM,
        createdAt: new Date(),
      }))
      mockDelete.mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/memories/consolidate', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'agent-123', minImportance: 7 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.consolidated).toBe(2)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          importance: { gte: 7 },
        },
      })
      expect(mockCreate).toHaveBeenCalledTimes(2)
      expect(mockDelete).toHaveBeenCalledTimes(2)
    })

    it('should only consolidate memories above minimum importance', async () => {
      // API filters by minImportance in the database query
      // So mockFindMany should return only memories meeting criteria
      const shortTermMemories = [
        {
          id: 'st-2',
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          content: 'High importance memory',
          importance: 8,
          tags: ['important'],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(shortTermMemories)
      mockCreate.mockImplementation(({ data }) => Promise.resolve({
        id: `lt-${Date.now()}`,
        ...data,
        type: MemoryType.LONG_TERM,
        createdAt: new Date(),
      }))

      const request = new NextRequest('http://localhost:3000/api/memories/consolidate', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'agent-123', minImportance: 5 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.consolidated).toBe(1)
      expect(mockCreate).toHaveBeenCalledTimes(1)
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: MemoryType.LONG_TERM,
          content: 'High importance memory',
          importance: 8,
        }),
      })
    })

    it('should return 0 consolidated when no memories meet criteria', async () => {
      mockFindMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/memories/consolidate', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'agent-123', minImportance: 10 }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.consolidated).toBe(0)
    })

    it('should reject request with missing agentId', async () => {
      const request = new NextRequest('http://localhost:3000/api/memories/consolidate', {
        method: 'POST',
        body: JSON.stringify({ minImportance: 5 }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
