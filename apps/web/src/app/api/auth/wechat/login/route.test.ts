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
import { GET, POST, PUT } from './route'

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

describe('POST /api/auth/wechat/callback (微信登录回调)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body
    } as unknown as NextRequest
  }

  it('should reject invalid session key', async () => {
    mockPrisma.wechatLoginSession.findUnique.mockResolvedValue(null)

    const request = createMockRequest({ sessionKey: 'invalid-key', code: 'auth-code' })
    const response = await POST(request)
    const data = await response as any

    expect(data.status).toBe(400)
    const jsonData = await data.json()
    expect(jsonData.error).toBe('Invalid or expired session')
  })

  it('should reject expired session', async () => {
    mockPrisma.wechatLoginSession.findUnique.mockResolvedValue({
      sessionKey: 'test-key',
      status: 'expired',
      expiresAt: new Date(Date.now() - 1000)
    })

    const request = createMockRequest({ sessionKey: 'test-key', code: 'auth-code' })
    const response = await POST(request)
    const data = await response as any

    expect(data.status).toBe(400)
    const jsonData = await data.json()
    expect(jsonData.error).toBe('Invalid or expired session')
  })

  it('should create new user if wechat user not bound', async () => {
    mockPrisma.wechatLoginSession.findUnique.mockResolvedValue({
      sessionKey: 'test-key',
      status: 'pending',
      wechatOpenid: null,
      expiresAt: new Date(Date.now() + 100000)
    })

    const mockWechatUserInfo = {
      openid: 'wechat-openid-123',
      unionid: 'wechat-unionid-123',
      nickname: '微信用户',
      headimgurl: 'https://wx.qlogo.cn/avatar'
    }

    mockPrisma.wechatBinding.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      username: 'wechat_user_123',
      nickname: '微信用户',
      avatar_url: 'https://wx.qlogo.cn/avatar'
    })
    mockPrisma.wechatBinding.create.mockResolvedValue({})
    mockPrisma.session.create.mockResolvedValue({})

    const request = createMockRequest({
      sessionKey: 'test-key',
      code: 'auth-code',
      wechatUserInfo: mockWechatUserInfo
    })
    const response = await POST(request)
    const data = await response as any

    expect(data.status).toBe(200)
    const jsonData = await data.json()
    expect(jsonData.user).toBeDefined()
    expect(jsonData.token).toBe('mock-jwt-token')
  })

  it('should login existing bound user', async () => {
    mockPrisma.wechatLoginSession.findUnique.mockResolvedValue({
      sessionKey: 'test-key',
      status: 'pending',
      wechatOpenid: null,
      expiresAt: new Date(Date.now() + 100000)
    })

    const mockWechatUserInfo = {
      openid: 'wechat-openid-123',
      unionid: 'wechat-unionid-123',
      nickname: '微信用户',
      headimgurl: 'https://wx.qlogo.cn/avatar'
    }

    mockPrisma.wechatBinding.findUnique.mockResolvedValue({
      id: 'binding-id',
      userId: 'existing-user-id',
      wechatOpenid: 'wechat-openid-123'
    })

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'existing-user-id',
      username: 'existing_user',
      nickname: 'Existing User',
      avatar_url: 'https://example.com/avatar'
    })

    mockPrisma.wechatBinding.update.mockResolvedValue({})
    mockPrisma.session.create.mockResolvedValue({})

    const request = createMockRequest({
      sessionKey: 'test-key',
      code: 'auth-code',
      wechatUserInfo: mockWechatUserInfo
    })
    const response = await POST(request)
    const data = await response as any

    expect(data.status).toBe(200)
    const jsonData = await data.json()
    expect(jsonData.user.id).toBe('existing-user-id')
    expect(jsonData.token).toBe('mock-jwt-token')
  })

  it('should update session status to used after successful login', async () => {
    mockPrisma.wechatLoginSession.findUnique.mockResolvedValue({
      sessionKey: 'test-key',
      status: 'pending',
      wechatOpenid: null,
      expiresAt: new Date(Date.now() + 100000)
    })

    const mockWechatUserInfo = {
      openid: 'wechat-openid-123',
      unionid: 'wechat-unionid-123',
      nickname: '微信用户',
      headimgurl: 'https://wx.qlogo.cn/avatar'
    }

    mockPrisma.wechatBinding.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-id',
      username: 'wechat_user_123',
      nickname: '微信用户',
      avatar_url: 'https://wx.qlogo.cn/avatar'
    })
    mockPrisma.wechatBinding.create.mockResolvedValue({})
    mockPrisma.session.create.mockResolvedValue({})

    const request = createMockRequest({
      sessionKey: 'test-key',
      code: 'auth-code',
      wechatUserInfo: mockWechatUserInfo
    })
    await POST(request)

    expect(mockPrisma.wechatLoginSession.update).toHaveBeenCalledWith({
      where: { sessionKey: 'test-key' },
      data: {
        status: 'used',
        wechatOpenid: 'wechat-openid-123'
      }
    })
  })
})

describe('PUT /api/auth/wechat/bind (绑定微信账号)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: async () => body,
      headers: {
        get: jest.fn()
      }
    } as unknown as NextRequest
  }

  it('should reject if user not authenticated', async () => {
    const request = createMockRequest({ wechatCode: 'auth-code' })
    const response = await PUT(request)
    const data = await response as any

    expect(data.status).toBe(401)
    const jsonData = await data.json()
    expect(jsonData.error).toBe('Unauthorized')
  })

  it('should bind wechat account to existing user', async () => {
    const mockWechatUserInfo = {
      openid: 'wechat-openid-123',
      unionid: 'wechat-unionid-123',
      nickname: '微信用户',
      headimgurl: 'https://wx.qlogo.cn/avatar'
    }

    mockPrisma.wechatBinding.findUnique.mockResolvedValue(null)
    mockPrisma.wechatBinding.create.mockResolvedValue({})

    const request = createMockRequest({
      wechatCode: 'auth-code',
      wechatUserInfo: mockWechatUserInfo
    })
    ;(request.headers.get as jest.Mock).mockReturnValue('mock-jwt-token')

    const response = await PUT(request)
    const data = await response as any

    expect(data.status).toBe(200)
    const jsonData = await data.json()
    expect(jsonData.message).toBe('WeChat account bound successfully')
  })

  it('should reject if wechat already bound to another user', async () => {
    mockPrisma.wechatBinding.findUnique.mockResolvedValue({
      id: 'existing-binding',
      userId: 'other-user-id'
    })

    const request = createMockRequest({
      wechatCode: 'auth-code',
      wechatUserInfo: { openid: 'existing-openid' }
    })
    ;(request.headers.get as jest.Mock).mockReturnValue('mock-jwt-token')

    const response = await PUT(request)
    const data = await response as any

    expect(data.status).toBe(400)
    const jsonData = await data.json()
    expect(jsonData.error).toContain('already bound')
  })
})
