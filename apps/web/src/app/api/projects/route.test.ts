import { POST } from './route'
import { NextRequest, NextResponse } from 'next/server'

// Mock Prisma
const mockPrisma = {
  project: {
    findMany: jest.fn(),
    create: jest.fn()
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

describe('POST /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body
    } as unknown as NextRequest
  }

  it('should reject request without title', async () => {
    const request = createMockRequest({ description: 'No title' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with title too long', async () => {
    const request = createMockRequest({
      title: 'a'.repeat(256),
      description: 'Test'
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with invalid grade range', async () => {
    const request = createMockRequest({
      title: 'Test Project',
      gradeMin: 10,
      gradeMax: 5
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with invalid difficulty', async () => {
    const request = createMockRequest({
      title: 'Test Project',
      difficulty: 10
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should create project successfully with minimal data', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'project-123',
      title: 'New Project',
      description: null,
      gradeMin: null,
      gradeMax: null,
      subject: null,
      difficulty: 1,
      status: 'draft',
      rubricCriteria: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: []
    })

    const request = createMockRequest({ title: 'New Project' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.project).toBeDefined()
    expect(data.project.title).toBe('New Project')
    expect(data.project.status).toBe('draft')
  })

  it('should create project with all optional fields', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'project-123',
      title: 'Science Project',
      description: 'A science project description',
      gradeMin: 3,
      gradeMax: 6,
      subject: 'Science',
      difficulty: 3,
      status: 'draft',
      rubricCriteria: JSON.stringify([
        { id: '1', name: 'Creativity', maxScore: 10 }
      ]),
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: []
    })

    const request = createMockRequest({
      title: 'Science Project',
      description: 'A science project description',
      gradeMin: 3,
      gradeMax: 6,
      subject: 'Science',
      difficulty: 3,
      rubricCriteria: [
        { id: '1', name: 'Creativity', description: 'Be creative', maxScore: 10 }
      ]
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.project).toBeDefined()
    expect(data.project.subject).toBe('Science')
  })
})
