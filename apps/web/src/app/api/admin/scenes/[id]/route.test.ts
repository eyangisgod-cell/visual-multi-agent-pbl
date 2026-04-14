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
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
import { GET, PUT, DELETE } from './route'
import { NextRequest } from 'next/server'

describe('GET /api/admin/scenes/:id', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if scene ID is invalid', async () => {
    const request = createMockRequest('http://localhost:3000/api/admin/scenes/invalid-id')
    const response = await GET(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('无效的场景 ID')
  })

  it('should return 404 if scene does not exist', async () => {
    const sceneId = '550e8400-e29b-41d4-a716-446655440001'
    mockPrisma.scene.findUnique.mockResolvedValue(null)

    const request = createMockRequest(`http://localhost:3000/api/admin/scenes/${sceneId}`)
    const response = await GET(request, { params: { id: sceneId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('场景不存在')
  })

  it('should return scene successfully', async () => {
    const sceneId = '550e8400-e29b-41d4-a716-446655440001'
    const mockScene = {
      id: sceneId,
      name: 'Test Scene',
      description: 'A test scene',
      elements: { trees: 5 },
      resources: ['tree.png'],
      isActive: true,
      createdAt: new Date('2026-04-10'),
      updatedAt: new Date('2026-04-10'),
    }

    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)

    const request = createMockRequest(`http://localhost:3000/api/admin/scenes/${sceneId}`)
    const response = await GET(request, { params: { id: sceneId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(sceneId)
    expect(data.name).toBe('Test Scene')
    expect(data.description).toBe('A test scene')
    expect(data.elements).toEqual({ trees: 5 })
  })

  it('should return 500 on database error', async () => {
    const sceneId = '550e8400-e29b-41d4-a716-446655440001'
    mockPrisma.scene.findUnique.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest(`http://localhost:3000/api/admin/scenes/${sceneId}`)
    const response = await GET(request, { params: { id: sceneId } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('获取场景详情失败')
  })
})

describe('PUT /api/admin/scenes/:id', () => {
  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      url: 'http://localhost:3000/api/admin/scenes/scene-id',
      json: async () => body,
      headers: new Headers()
    } as unknown as NextRequest
  }

  const validSceneId = '550e8400-e29b-41d4-a716-446655440001'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if scene ID is invalid', async () => {
    const request = createMockRequest({ name: 'Updated Name' })
    const response = await PUT(request, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('无效的场景 ID')
  })

  it('should return 404 if scene does not exist', async () => {
    mockPrisma.scene.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ name: 'Updated Name' })
    const response = await PUT(request, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('场景不存在')
  })

  it('should return 400 if name exceeds 100 characters', async () => {
    const mockScene = {
      id: validSceneId,
      name: 'Old Name',
      description: 'Description',
      isActive: true,
    }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)

    const longName = 'a'.repeat(101)
    const request = createMockRequest({ name: longName })
    const response = await PUT(request, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('场景名称不能超过 100 个字符')
  })

  it('should update scene successfully', async () => {
    const mockScene = {
      id: validSceneId,
      name: 'Old Name',
      description: 'Old Description',
      isActive: true,
    }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)

    mockPrisma.scene.update.mockResolvedValue({
      id: validSceneId,
      name: 'Updated Name',
      description: 'Updated Description',
      elements: { trees: 10 },
      resources: ['new.png'],
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest({
      name: 'Updated Name',
      description: 'Updated Description',
      elements: { trees: 10 },
      resources: ['new.png'],
      isActive: false,
    })
    const response = await PUT(request, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(validSceneId)
    expect(data.name).toBe('Updated Name')
    expect(data.description).toBe('Updated Description')
    expect(data.isActive).toBe(false)
  })

  it('should update scene with partial data', async () => {
    const mockScene = {
      id: validSceneId,
      name: 'Old Name',
      description: 'Old Description',
      isActive: true,
    }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)

    mockPrisma.scene.update.mockResolvedValue({
      id: validSceneId,
      name: 'Old Name',
      description: 'Updated Description',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = createMockRequest({ description: 'Updated Description' })
    const response = await PUT(request, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.description).toBe('Updated Description')
  })

  it('should return 500 on database error', async () => {
    const mockScene = {
      id: validSceneId,
      name: 'Old Name',
    }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)
    mockPrisma.scene.update.mockRejectedValue(new Error('Database connection failed'))

    const request = createMockRequest({ name: 'New Name' })
    const response = await PUT(request, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('更新场景失败')
  })
})

describe('DELETE /api/admin/scenes/:id', () => {
  const validSceneId = '550e8400-e29b-41d4-a716-446655440001'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (url: string) => {
    return {
      url,
      headers: new Headers()
    } as unknown as NextRequest
  }

  it('should return 400 if scene ID is invalid', async () => {
    const response = await DELETE({} as NextRequest, { params: { id: 'invalid-id' } })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('无效的场景 ID')
  })

  it('should return 404 if scene does not exist', async () => {
    mockPrisma.scene.findUnique.mockResolvedValue(null)

    const response = await DELETE({} as NextRequest, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('场景不存在')
  })

  it('should delete scene successfully', async () => {
    const mockScene = {
      id: validSceneId,
      name: 'Scene to Delete',
    }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)
    mockPrisma.scene.delete.mockResolvedValue({ id: validSceneId })

    const response = await DELETE({} as NextRequest, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('场景已删除')
  })

  it('should return 500 on database error', async () => {
    const mockScene = { id: validSceneId }
    mockPrisma.scene.findUnique.mockResolvedValue(mockScene)
    mockPrisma.scene.delete.mockRejectedValue(new Error('Database connection failed'))

    const response = await DELETE({} as NextRequest, { params: { id: validSceneId } })
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('删除场景失败')
  })
})
