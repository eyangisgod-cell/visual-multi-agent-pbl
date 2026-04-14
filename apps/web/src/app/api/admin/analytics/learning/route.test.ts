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
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  work: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  project: {
    count: jest.fn(),
  },
  userAgent: {
    count: jest.fn(),
  },
  conversation: {
    count: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/analytics/learning', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers(),
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return learning analytics data', async () => {
    const mockTotalUsers = 100
    const mockActiveUsers = 45
    const mockTotalWorks = 250
    const mockTotalProjects = 20
    const mockCompletedProjects = 15
    const mockTotalConversations = 500
    const mockTotalAgentUsage = 800

    // In the API, Promise.all calls: user.count, work.count, project.count, conversation.count, userAgent.count
    // Then separately: activeUsers (user.count with filter), completedProjects (project.count with filter)
    // Using mockResolvedValueOnce for specific calls, then mockResolvedValue for default

    // First calls (from Promise.all) - use resolvedValueOnce
    // Then subsequent calls use resolvedValue
    mockPrisma.user.count.mockResolvedValueOnce(mockTotalUsers) // From Promise.all
      .mockResolvedValueOnce(mockActiveUsers) // Active users query
      .mockResolvedValue(mockTotalUsers) // Default
    mockPrisma.work.count.mockResolvedValue(mockTotalWorks)
    mockPrisma.project.count.mockResolvedValueOnce(mockTotalProjects) // From Promise.all
      .mockResolvedValueOnce(mockCompletedProjects) // Completed projects query
      .mockResolvedValue(mockTotalProjects) // Default
    mockPrisma.conversation.count.mockResolvedValue(mockTotalConversations)
    mockPrisma.userAgent.count.mockResolvedValue(mockTotalAgentUsage)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/learning')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.totalUsers).toBe(mockTotalUsers)
    expect(data.activeUsers).toBe(mockActiveUsers)
    expect(data.totalWorks).toBe(mockTotalWorks)
    expect(data.totalProjects).toBe(mockTotalProjects)
  })

  it('should support date range filtering', async () => {
    mockPrisma.work.count.mockResolvedValue(50)
    mockPrisma.user.count.mockResolvedValue(100)
    mockPrisma.project.count.mockResolvedValue(20)
    mockPrisma.conversation.count.mockResolvedValue(100)
    mockPrisma.userAgent.count.mockResolvedValue(150)
    mockPrisma.user.count.mockResolvedValueOnce(30)
    mockPrisma.project.count.mockResolvedValueOnce(10)

    const request = createMockRequest(
      'http://localhost:3000/api/admin/analytics/learning?startDate=2026-01-01&endDate=2026-03-31'
    )
    const response = await GET(request as NextRequest)

    expect((response as any).status).toBe(200)
    expect(mockPrisma.work.count).toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    mockPrisma.user.count.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/learning')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('获取学习数据失败')
  })
})
