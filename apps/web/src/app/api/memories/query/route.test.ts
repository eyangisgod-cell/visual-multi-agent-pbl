/**
 * Memories Query API Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the memory query endpoint correctly
 * searches for memories by similarity and filters.
 */

import { PrismaClient, MemoryType } from '@prisma/client'
import { NextRequest } from 'next/server'

// Mock Prisma - define before jest.mock
const mockFindMany = jest.fn()

const mockPrismaInstance = {
  agentMemory: {
    findMany: mockFindMany,
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

describe('Memories Query API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/memories/query', () => {
    it('should search memories by keyword', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          agentId: 'agent-123',
          type: MemoryType.SEMANTIC,
          content: 'PostgreSQL supports vector similarity search',
          importance: 9,
          tags: ['database', 'vector'],
          createdAt: new Date(),
        },
        {
          id: 'mem-2',
          agentId: 'agent-123',
          type: MemoryType.SEMANTIC,
          content: 'Vector databases enable semantic search',
          importance: 8,
          tags: ['database', 'search'],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'agent-123',
          query: 'vector database',
          limit: 10,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toHaveLength(2)
    })

    it('should filter memories by type', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          agentId: 'agent-123',
          type: MemoryType.LONG_TERM,
          content: 'Long term memory',
          importance: 8,
          tags: [],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'agent-123',
          type: 'LONG_TERM',
          query: 'memory',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toHaveLength(1)
      expect(data.memories[0].type).toBe('LONG_TERM')
    })

    it('should filter memories by tags', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          agentId: 'agent-123',
          type: MemoryType.SEMANTIC,
          content: 'Skill memory',
          importance: 7,
          tags: ['skill', 'tech'],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({
          agentId: 'agent-123',
          tags: ['skill'],
          query: 'memory',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toHaveLength(1)
    })

    it('should return memories ordered by importance', async () => {
      const mockMemories = [
        { id: 'mem-1', agentId: 'agent-123', type: MemoryType.SEMANTIC, content: 'High importance', importance: 10, tags: [], createdAt: new Date() },
        { id: 'mem-2', agentId: 'agent-123', type: MemoryType.SEMANTIC, content: 'Medium importance', importance: 5, tags: [], createdAt: new Date() },
        { id: 'mem-3', agentId: 'agent-123', type: MemoryType.SEMANTIC, content: 'Low importance', importance: 1, tags: [], createdAt: new Date() },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'agent-123', query: 'importance' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories[0].importance).toBe(10)
      expect(data.memories[2].importance).toBe(1)
    })

    it('should reject request with missing agentId', async () => {
      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({ query: 'test' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject request with empty query', async () => {
      const request = new NextRequest('http://localhost:3000/api/memories/query', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'agent-123', query: '' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
