/**
 * Memories API Test
 *
 * RED PHASE: Write failing test first
 *
 * This test verifies that the memories API endpoints correctly
 * handle creation and querying of agent memories.
 */

import { POST, GET } from './route'
import { PrismaClient, MemoryType } from '@prisma/client'
import { NextRequest } from 'next/server'

// Mock Prisma
const mockCreate = jest.fn()
const mockFindMany = jest.fn()
const mockDelete = jest.fn()

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      agentMemory: {
        create: mockCreate,
        findMany: mockFindMany,
        delete: mockDelete,
      },
      $disconnect: jest.fn(),
    })),
    MemoryType: {
      SHORT_TERM: 'SHORT_TERM',
      LONG_TERM: 'LONG_TERM',
      EPISODIC: 'EPISODIC',
      PROCEDURAL: 'PROCEDURAL',
      SEMANTIC: 'SEMANTIC',
    },
  }
})

describe('Memories API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/memories', () => {
    it('should create a new memory with valid data', async () => {
      const requestBody = {
        agentId: 'test-agent-123',
        type: MemoryType.SHORT_TERM,
        content: 'User prefers dark mode',
        importance: 5,
        tags: ['preference', 'ui'],
      }

      mockCreate.mockResolvedValue({
        id: 'memory-id-123',
        ...requestBody,
        createdAt: new Date(),
      })

      const request = new NextRequest('http://localhost:3000/api/memories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('memory-id-123')
      expect(data.agentId).toBe(requestBody.agentId)
      expect(mockCreate).toHaveBeenCalledWith({
        data: requestBody,
      })
    })

    it('should reject request with missing required fields', async () => {
      const requestBody = {
        // Missing agentId and type
        content: 'Test content',
      }

      const request = new NextRequest('http://localhost:3000/api/memories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject request with invalid importance value', async () => {
      const requestBody = {
        agentId: 'test-agent',
        type: MemoryType.SHORT_TERM,
        content: 'Test',
        importance: 15, // Invalid: should be 1-10
      }

      const request = new NextRequest('http://localhost:3000/api/memories', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/memories', () => {
    it('should return memories filtered by agentId', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          content: 'Memory 1',
          importance: 5,
          tags: ['tag1'],
          createdAt: new Date(),
        },
        {
          id: 'mem-2',
          agentId: 'agent-123',
          type: MemoryType.LONG_TERM,
          content: 'Memory 2',
          importance: 8,
          tags: ['tag2'],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories?agentId=agent-123')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toHaveLength(2)
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-123' },
        orderBy: { importance: 'desc' },
      })
    })

    it('should return memories filtered by type', async () => {
      const mockMemories = [
        {
          id: 'mem-1',
          agentId: 'agent-123',
          type: MemoryType.SHORT_TERM,
          content: 'Short term memory',
          importance: 5,
          tags: [],
          createdAt: new Date(),
        },
      ]

      mockFindMany.mockResolvedValue(mockMemories)

      const request = new NextRequest('http://localhost:3000/api/memories?agentId=agent-123&type=SHORT_TERM')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toHaveLength(1)
    })

    it('should return empty array when no memories found', async () => {
      mockFindMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/memories?agentId=non-existent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.memories).toEqual([])
    })
  })
})
