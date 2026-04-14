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
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}))

// Import after mocks
const { PUT, DELETE } = require('./route')

describe('PUT /api/notifications/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
    } as unknown as NextRequest
  }

  it('should reject request without userId', async () => {
    const request = createMockRequest({ action: 'mark_all_read' })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with invalid action', async () => {
    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'invalid_action',
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should mark all notifications as read', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'mark_all_read',
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('All notifications marked as read')
    expect(data.count).toBe(5)
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: expect.any(Date),
      },
    })
  })

  it('should mark all notifications as unread', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'mark_all_unread',
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('All notifications marked as unread')
    expect(data.count).toBe(3)
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        isRead: true,
      },
      data: {
        isRead: false,
        readAt: null,
      },
    })
  })
})

describe('DELETE /api/notifications/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
    } as unknown as NextRequest
  }

  it('should reject request without userId', async () => {
    const request = createMockRequest({ action: 'delete_all_read' })
    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject request with invalid action', async () => {
    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'invalid_action',
    })
    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should delete all read notifications', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 5 })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'delete_all_read',
    })
    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('All read notifications deleted')
    expect(data.count).toBe(5)
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        isRead: true,
      },
    })
  })

  it('should delete all notifications', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 })

    const request = createMockRequest({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      action: 'delete_all',
    })
    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('All notifications deleted')
    expect(data.count).toBe(10)
    expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
      },
    })
  })
})
