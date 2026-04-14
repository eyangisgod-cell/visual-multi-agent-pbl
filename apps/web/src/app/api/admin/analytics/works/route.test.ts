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
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
  },
  workLike: {
    count: jest.fn(),
  },
  workReview: {
    count: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/analytics/works', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers(),
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return work submission trends', async () => {
    const mockWorksByDate = [
      { createdAt: '2026-04-01', _count: 5 },
      { createdAt: '2026-04-02', _count: 8 },
      { createdAt: '2026-04-03', _count: 12 },
    ]

    const mockWorksByStatus = [
      { status: 'published', _count: 150 },
      { status: 'draft', _count: 30 },
      { status: 'pending_review', _count: 20 },
      { status: 'rejected', _count: 10 },
    ]

    const mockProjectWorks = [
      { project: { subject: 'Math' } },
      { project: { subject: 'Science' } },
    ]

    mockPrisma.work.count.mockResolvedValue(210)
    // First call for trendData, second for statusDistribution, third for scoreDistribution
    mockPrisma.work.groupBy
      .mockResolvedValueOnce(mockWorksByDate)
      .mockResolvedValueOnce(mockWorksByStatus)
      .mockResolvedValueOnce([])
    mockPrisma.work.findMany.mockResolvedValue(mockProjectWorks)
    mockPrisma.workLike.count.mockResolvedValue(100)
    mockPrisma.workReview.count.mockResolvedValue(50)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/works')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.trendData).toBeDefined()
    expect(data.statusDistribution).toBeDefined()
    expect(data.totalWorks).toBe(210)
  })

  it('should return work statistics with scores', async () => {
    const mockWorksByScore = [
      { score: 5, _count: 50 },
      { score: 4, _count: 75 },
      { score: 3, _count: 30 },
    ]

    mockPrisma.work.count.mockResolvedValue(155)
    mockPrisma.work.groupBy.mockResolvedValue(mockWorksByScore)
    mockPrisma.work.findMany.mockResolvedValue([])

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/works')
    const response = await GET(request as NextRequest)
    await (response as any).json()

    expect(mockPrisma.work.groupBy).toHaveBeenCalled()
  })

  it('should return 500 on database error', async () => {
    mockPrisma.work.groupBy.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/works')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('获取作品统计失败')
  })
})
