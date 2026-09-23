import { NextRequest } from 'next/server'

// Mock next/server first before anything else
const cookiesMock = { set: jest.fn() }
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (data: any, init?: any) => {
        const response: any = {
          json: async () => data,
          status: init?.status || 200,
          cookies: { set: jest.fn() }
        }
        // Make cookies.set chainable and also set on the outer mock
        response.cookies.set.mockReturnValue(response)
        return response
      }
    }
  }
})

// Mock Prisma - must be defined before the jest.mock call
let mockPrisma: any

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Define mock after jest.mock
mockPrisma = {
  wechatConfig: {
    findFirst: jest.fn()
  },
  wechatBinding: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  wechatLoginSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn()
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  session: {
    create: jest.fn(),
    deleteMany: jest.fn()
  }
}

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'user-123' })
}))

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({ toString: () => 'mock-random-hex' })
}))

// Now import the route after all mocks are set up
import { GET } from './route'

describe('GET /api/auth/wechat/login (获取扫码信息)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = () => {
    return {} as unknown as NextRequest
  }

  it('should return qr code URL for wechat login', async () => {
    mockPrisma.wechatConfig.findFirst.mockResolvedValue({
      appId: 'wx-test-appid',
      appSecret: 'test-secret'
    })
    mockPrisma.wechatLoginSession.create.mockResolvedValue({
      sessionKey: 'mock-session-key'
    })

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response as any

    expect(data.status).toBe(200)
    const jsonData = await data.json()
    expect(jsonData.sessionKey).toBeDefined()
    expect(jsonData.qrCodeUrl).toContain('open.weixin.qq.com')
  })

  it('should return error if wechat config not found', async () => {
    mockPrisma.wechatConfig.findFirst.mockResolvedValue(null)

    const request = createMockRequest()
    const response = await GET(request)
    const data = await response as any

    expect(data.status).toBe(400)
    const jsonData = await data.json()
    expect(jsonData.error).toContain('WeChat')
  })
})
