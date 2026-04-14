// Mock Next.js server
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !(init?.status && init.status >= 400),
    })),
  },
}))

// Mock Prisma
const mockPrisma = {
  work: {
    findMany: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
  },
  agent: {
    findMany: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/analytics/export', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers(),
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return works export data', async () => {
    const mockWorks = [
      {
        id: 'work-1',
        title: 'Work 1',
        status: 'published',
        user: { username: 'user1' },
        project: { title: 'Project 1' },
        createdAt: new Date('2026-04-01'),
      },
    ]

    mockPrisma.work.findMany.mockResolvedValue(mockWorks)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=works')
    const response = await GET(request as NextRequest)

    expect((response as any).status).toBe(200)
    expect(mockPrisma.work.findMany).toHaveBeenCalled()
  })

  it('should return users export data', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        username: 'user1',
        works: [{ id: 'work-1' }],
      },
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockUsers)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=users')
    const response = await GET(request as NextRequest)

    expect((response as any).status).toBe(200)
    expect(mockPrisma.user.findMany).toHaveBeenCalled()
  })

  it('should return projects export data', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Project 1',
        works: [{ id: 'work-1' }],
        tasks: [{ id: 'task-1' }],
      },
    ]

    mockPrisma.project.findMany.mockResolvedValue(mockProjects)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=projects')
    const response = await GET(request as NextRequest)

    expect((response as any).status).toBe(200)
    expect(mockPrisma.project.findMany).toHaveBeenCalled()
  })

  it('should return agents export data', async () => {
    const mockAgents = [
      {
        id: 'agent-1',
        name: 'Agent 1',
        UserAgent: [{ userId: 'user-1', usage_count: 10 }],
      },
    ]

    mockPrisma.agent.findMany.mockResolvedValue(mockAgents)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=agents')
    const response = await GET(request as NextRequest)

    expect((response as any).status).toBe(200)
    expect(mockPrisma.agent.findMany).toHaveBeenCalled()
  })

  it('should return 400 for invalid export type', async () => {
    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=invalid')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(400)
    expect(data.error).toBe('不支持的导出类型')
  })

  it('should return 500 on database error', async () => {
    mockPrisma.work.findMany.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/export?type=works')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('导出数据失败')
  })
})
