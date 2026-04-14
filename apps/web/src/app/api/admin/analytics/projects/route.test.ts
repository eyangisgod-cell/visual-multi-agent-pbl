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
  project: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/analytics/projects', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers(),
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return project completion statistics', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Project One',
        status: 'published',
        completed_count: 10,
        like_count: 5,
        _count: { works: 15, tasks: 8 },
      },
      {
        id: 'project-2',
        title: 'Project Two',
        status: 'published',
        completed_count: 8,
        like_count: 3,
        _count: { works: 12, tasks: 6 },
      },
    ]

    mockPrisma.project.findMany.mockResolvedValue(mockProjects)
    mockPrisma.project.count.mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/projects')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.projects).toHaveLength(2)
    expect(data.projects[0].completionRate).toBeCloseTo(125)
    expect(data.projects[1].completionRate).toBeCloseTo(133.33)
  })

  it('should calculate overall completion rate', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Project One',
        status: 'published',
        completed_count: 20,
        like_count: 10,
        _count: { works: 30, tasks: 10 },
      },
    ]

    mockPrisma.project.findMany.mockResolvedValue(mockProjects)
    mockPrisma.project.count.mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/projects')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.overallCompletionRate).toBeCloseTo(200)
  })

  it('should support pagination', async () => {
    const mockProjects = [
      {
        id: 'project-1',
        title: 'Project One',
        status: 'published',
        completed_count: 10,
        like_count: 5,
        _count: { works: 15, tasks: 8 },
      },
    ]

    mockPrisma.project.findMany.mockResolvedValue(mockProjects)
    mockPrisma.project.count.mockResolvedValue(25)

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/projects?page=1&limit=10')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.total).toBe(25)
  })

  it('should return 500 on database error', async () => {
    mockPrisma.project.findMany.mockRejectedValue(new Error('Database error'))

    const request = createMockRequest('http://localhost:3000/api/admin/analytics/projects')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('获取项目统计失败')
  })
})
