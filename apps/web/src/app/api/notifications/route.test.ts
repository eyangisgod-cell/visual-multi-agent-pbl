import { NextRequest } from 'next/server'

// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Mock Prisma
const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
const { GET, POST } = require('./route')

describe('GET /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (searchParams: Record<string, string> = {}) => {
    const params = new URLSearchParams(searchParams)
    return {
      nextUrl: {
        searchParams: params,
      },
    } as unknown as NextRequest
  }

  it('should reject request without userId', async () => {
    const request = createMockRequest()
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('userId is required')
  })

  it('should fetch notifications for user with default filters', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notifications).toEqual([])
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: '123e4567-e89b-12d3-a456-426614174000' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should fetch unread notifications when isRead=false', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', isRead: 'false' })
    await GET(request)

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: '123e4567-e89b-12d3-a456-426614174000', isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should fetch read notifications when isRead=true', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', isRead: 'true' })
    await GET(request)

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: '123e4567-e89b-12d3-a456-426614174000', isRead: true },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should filter by type when provided', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', type: 'system' })
    await GET(request)

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: '123e4567-e89b-12d3-a456-426614174000', type: 'system' },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('should support limit parameter', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', limit: '10' })
    await GET(request)

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: '123e4567-e89b-12d3-a456-426614174000' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  })

  it('should return notifications with all fields', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      {
        id: 'notif-123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'system',
        title: 'System Update',
        content: 'System will be updated soon',
        isRead: false,
        actionUrl: '/admin/settings',
        metadata: { priority: 'high' },
        createdAt: new Date('2026-01-01'),
        readAt: null,
      },
    ])

    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.notifications[0].id).toBe('notif-123e4567-e89b-12d3-a456-426614174000')
    expect(data.notifications[0].type).toBe('system')
    expect(data.notifications[0].isRead).toBe(false)
  })
})

describe('POST /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
    } as unknown as NextRequest
  }

  it('should reject request without userId', async () => {
    const request = createMockRequest({ title: 'Test', content: 'Test content' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('userId is required')
  })

  it('should reject request without title', async () => {
    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', content: 'Test content' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request without content', async () => {
    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', title: 'Test' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with empty title', async () => {
    const request = createMockRequest({ userId: '123e4567-e89b-12d3-a456-426614174000', title: '', content: 'Test' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with title too long', async () => {
    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'a'.repeat(256),
      content: 'Test content',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should create notification with minimal data', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'info',
      title: 'Test Notification',
      content: 'This is a test notification',
      isRead: false,
      actionUrl: null,
      metadata: null,
      createdAt: new Date(),
      readAt: null,
    })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Notification',
      content: 'This is a test notification',
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.notification).toBeDefined()
    expect(data.notification.title).toBe('Test Notification')
    expect(data.notification.type).toBe('info')
    expect(data.notification.isRead).toBe(false)
  })

  it('should create notification with all optional fields', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'task',
      title: 'Task Assigned',
      content: 'You have been assigned a new task',
      isRead: false,
      actionUrl: '/tasks/task-123',
      metadata: { taskId: 'task-123', projectId: 'project-123' },
      createdAt: new Date(),
      readAt: null,
    })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      type: 'task',
      title: 'Task Assigned',
      content: 'You have been assigned a new task',
      actionUrl: '/tasks/task-123',
      metadata: { taskId: 'task-123', projectId: 'project-123' },
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.notification).toBeDefined()
    expect(data.notification.type).toBe('task')
    expect(data.notification.actionUrl).toBe('/tasks/task-123')
    expect(data.notification.metadata).toEqual({ taskId: 'task-123', projectId: 'project-123' })
  })

  it('should support all notification types', async () => {
    const types = ['info', 'success', 'warning', 'error', 'task', 'system', 'achievement']

    for (const type of types) {
      mockPrisma.notification.create.mockResolvedValue({
        id: `notif-${type}`,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type,
        title: `${type} notification`,
        content: 'Test content',
        isRead: false,
        actionUrl: null,
        metadata: null,
        createdAt: new Date(),
        readAt: null,
      })

      const request = createMockRequest({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type,
        title: `${type} notification`,
        content: 'Test content',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.notification.type).toBe(type)
    }
  })
})
