import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn()
  },
  session: {
    create: jest.fn()
  }
}
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}))

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token')
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
      cookies: {
        set: jest.fn()
      }
    } as unknown as NextRequest
  }

  it('should reject invalid username (too short)', async () => {
    const request = createMockRequest({ username: 'ab', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid input')
  })

  it('should reject non-existent username', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ username: 'nonexistent', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid username or password')
  })

  it('should reject user without password hash', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      username: 'testuser'
    })

    const request = createMockRequest({ username: 'testuser', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid username or password')
  })

  it('should reject invalid password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: '1',
      username: 'testuser',
      passwordHash: 'hashed-password'
    })
    ;(require('bcryptjs').compare as jest.Mock).mockResolvedValue(false)

    const request = createMockRequest({ username: 'testuser', password: 'wrongpassword' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid username or password')
  })

  it('should login successfully with valid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      username: 'testuser',
      passwordHash: 'hashed-password',
      nickname: 'Test User',
      grade: 5,
      invitationCode: 'ABCD1234'
    })
    ;(require('bcryptjs').compare as jest.Mock).mockResolvedValue(true)
    mockPrisma.session.create.mockResolvedValue({})

    const request = createMockRequest({ username: 'testuser', password: 'password123' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Login successful')
    expect(data.user).toBeDefined()
    expect(data.user.id).toBe('user-123')
    expect(data.token).toBe('mock-jwt-token')
  })

  it('should create session on successful login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-123',
      username: 'testuser',
      passwordHash: 'hashed-password',
      nickname: null,
      grade: null,
      invitationCode: 'ABCD1234'
    })
    ;(require('bcryptjs').compare as jest.Mock).mockResolvedValue(true)
    mockPrisma.session.create.mockResolvedValue({})

    const request = createMockRequest({ username: 'testuser', password: 'password123' })
    await POST(request)

    expect(mockPrisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        token: expect.any(String),
        expiresAt: expect.any(Date)
      })
    })
  })
})
