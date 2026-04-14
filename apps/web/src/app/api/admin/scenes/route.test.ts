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

// Mock Prisma - MUST be before importing the route
const mockPrisma = {
  scene: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Mock createAuditLog
jest.mock('@/lib/audit-logger', () => ({
  createAuditLog: jest.fn(),
  extractIpAddress: jest.fn(() => '127.0.0.1'),
  extractUserAgent: jest.fn(() => 'test-agent')
}))

// Import after mocks
import { GET, POST } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/scenes', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return success with scenes list', async () => {
    const mockScenes = [
      {
        id: 'scene-1',
        name: '森林场景',
        description: '一个神秘的森林场景',
        elements: { trees: 10, animals: 5 },
        resources: ['tree.png', 'animal.png'],
        isActive: true,
        createdAt: new Date('2026-04-10'),
        updatedAt: new Date('2026-04-10'),
      },
      {
        id: 'scene-2',
        name: '沙漠场景',
        description: '炎热的沙漠场景',
        elements: { cacti: 3, dunes: 8 },
        resources: ['cactus.png', 'sand.png'],
        isActive: true,
        createdAt: new Date('2026-04-11'),
        updatedAt: new Date('2026-04-11'),
      },
    ]

    mockPrisma.scene.findMany.mockResolvedValue(mockScenes)
    mockPrisma.scene.count.mockResolvedValue(2)

    const request = createMockRequest('http://localhost:3000/api/admin/scenes')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.scenes).toHaveLength(2)
    expect(data.scenes[0].id).toBe('scene-1')
    expect(data.scenes[0].name).toBe('森林场景')
    expect(data.pagination).toBeDefined()
    expect(data.pagination.total).toBe(2)
  })

  it('should only return active scenes when isActive=true', async () => {
    const mockScenes = [
      {
        id: 'scene-1',
        name: 'Active Scene',
        description: 'An active scene',
        elements: {},
        resources: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.scene.findMany.mockResolvedValue(mockScenes)
    mockPrisma.scene.count.mockResolvedValue(1)

    const request = createMockRequest('http://localhost:3000/api/admin/scenes?isActive=true')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.scenes).toHaveLength(1)
    expect(data.scenes[0].isActive).toBe(true)
  })

  it('should support pagination', async () => {
    const mockScenes = [
      {
        id: 'scene-1',
        name: 'Scene 1',
        description: 'First scene',
        elements: {},
        resources: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockPrisma.scene.findMany.mockResolvedValue(mockScenes)
    mockPrisma.scene.count.mockResolvedValue(10)

    const request = createMockRequest('http://localhost:3000/api/admin/scenes?page=1&limit=1')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.scenes).toHaveLength(1)
    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(1)
    expect(data.pagination.total).toBe(10)
    expect(data.pagination.totalPages).toBe(10)
  })

  it('should return empty array when no scenes exist', async () => {
    mockPrisma.scene.findMany.mockResolvedValue([])
    mockPrisma.scene.count.mockResolvedValue(0)

    const request = createMockRequest('http://localhost:3000/api/admin/scenes')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(200)
    expect(data.scenes).toEqual([])
    expect(data.pagination.total).toBe(0)
  })

  it('should return 500 on database error', async () => {
    mockPrisma.scene.findMany.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest('http://localhost:3000/api/admin/scenes')
    const response = await GET(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('获取场景列表失败')
  })
})

describe('POST /api/admin/scenes', () => {
  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      url: 'http://localhost:3000/api/admin/scenes',
      json: async () => body,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if name is missing', async () => {
    const request = createMockRequest({ description: 'A scene without name' })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(400)
    expect(data.error).toBe('场景名称是必填的')
  })

  it('should return 400 if name exceeds 100 characters', async () => {
    const longName = 'a'.repeat(101)
    const request = createMockRequest({ name: longName })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(400)
    expect(data.error).toBe('场景名称不能超过 100 个字符')
  })

  it('should create scene successfully with minimal data', async () => {
    mockPrisma.scene.create.mockResolvedValue({
      id: 'new-scene',
      name: 'New Scene',
      description: null,
      elements: null,
      resources: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest({ name: 'New Scene' })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(201)
    expect(data.id).toBe('new-scene')
    expect(data.name).toBe('New Scene')
    expect(data.isActive).toBe(true)
  })

  it('should create scene with all fields', async () => {
    mockPrisma.scene.create.mockResolvedValue({
      id: 'full-scene',
      name: 'Full Scene',
      description: 'A scene with all fields',
      elements: { trees: 5, flowers: 10 },
      resources: ['tree.png', 'flower.png'],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest({
      name: 'Full Scene',
      description: 'A scene with all fields',
      elements: { trees: 5, flowers: 10 },
      resources: ['tree.png', 'flower.png'],
      isActive: false,
    })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(201)
    expect(data.id).toBe('full-scene')
    expect(data.description).toBe('A scene with all fields')
    expect(data.elements).toEqual({ trees: 5, flowers: 10 })
    expect(data.isActive).toBe(false)
  })

  it('should create scene with exactly 100 character name', async () => {
    const exactName = 'a'.repeat(100)
    mockPrisma.scene.create.mockResolvedValue({
      id: 'exact-scene',
      name: exactName,
      description: null,
      elements: null,
      resources: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest({ name: exactName })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(201)
    expect(data.name).toBe(exactName)
  })

  it('should return 500 on database error', async () => {
    mockPrisma.scene.create.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({ name: 'Test Scene' })
    const response = await POST(request as NextRequest)
    const data = await (response as any).json()

    expect((response as any).status).toBe(500)
    expect(data.error).toBe('创建场景失败')
  })
})
