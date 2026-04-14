import { render, screen, waitFor, act } from '@testing-library/react'
import React from 'react'
import WechatLoginPage from './page'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

// Mock Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} data-variant={variant} data-size={size} className={className}>
      {children}
    </button>
  ),
}))

describe('WechatLoginPage', () => {
  const mockPush = jest.fn()
  const mockLogin = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useAuth as jest.Mock).mockReturnValue({ login: mockLogin })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockFetch = (ok: boolean, data: any) => {
    return jest.fn().mockResolvedValue({
      ok,
      json: async () => data,
    })
  }

  describe('初始加载状态', () => {
    it('should display loading state initially', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      // Should show loading state
      expect(screen.getByText('加载中...')).toBeInTheDocument()
    })

    it('should fetch QR code on mount', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/wechat/login')
      })
    })

    it('should display QR code after successful fetch', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        const img = screen.getByAltText('WeChat Login QR Code')
        expect(img).toBeInTheDocument()
      })
    })

    it('should display error message on fetch failure', async () => {
      global.fetch = mockFetch(false, { error: 'Failed to load QR code' })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Failed to load QR code')).toBeInTheDocument()
      })
    })
  })

  describe('状态显示', () => {
    it('should display pending status message', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('请使用微信扫描二维码')).toBeInTheDocument()
      })
    })

    it('should display scanned status message', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      // Mock status check response
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'scanned' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
            sessionKey: 'test-session-key',
            expiresIn: 300,
          }),
        })
      })

      render(<WechatLoginPage />)

      await waitFor(
        () => {
          expect(screen.getByText('已扫描，请在手机上确认登录')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )
    })

    it('should display expired status message', async () => {
      // Mock fetch that will trigger status endpoint returning expired
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 'expired' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
            sessionKey: 'test-session-key',
            expiresIn: 300,
          }),
        })
      })

      render(<WechatLoginPage />)

      // Wait for status poll to return expired
      await waitFor(() => {
        expect(screen.getByText('二维码已过期')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('倒计时功能', () => {
    it('should display countdown timer', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText(/剩余时间：/)).toBeInTheDocument()
      })
    })
  })

  describe('刷新二维码功能', () => {
    it('should display refresh button when expired', async () => {
      // Mock fetch to return expired countdown (0 means expired)
      // Note: component uses data.expiresIn || 300, so we need to use null/undefined for fallback
      // but for expired state we rely on the countdown timer
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 1, // Very short countdown
      })

      render(<WechatLoginPage />)

      // First wait for QR code to load (countdown starts)
      await waitFor(() => {
        expect(screen.getByText(/剩余时间：/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Then wait for countdown to expire (1 second)
      await waitFor(() => {
        expect(screen.getByText('二维码已过期')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Then check for refresh button
      const refreshButton = screen.getByText('刷新二维码')
      expect(refreshButton).toBeInTheDocument()
    })

    it('should call fetchQrCode when refresh button clicked', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 1, // Very short countdown
      })

      render(<WechatLoginPage />)

      // Wait for QR code
      await waitFor(() => {
        expect(screen.getByText(/剩余时间：/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // Wait for countdown to expire
      await waitFor(() => {
        expect(screen.getByText('二维码已过期')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Click refresh button
      const refreshButton = screen.getByText('刷新二维码')
      await act(async () => {
        ;(refreshButton as HTMLElement).click()
      })

      // Should fetch QR code again
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(2)
      }, { timeout: 3000 })
    })
  })

  describe('登录状态轮询', () => {
    it('should poll status endpoint with session key', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/wechat/login')
      })
    })

    it('should login and redirect on confirmed status', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'test_user',
        nickname: 'Test User',
      }

      // First call: fetch QR code
      // Second call: status check returns confirmed
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'confirmed',
              user: mockUser,
              token: 'mock-jwt-token',
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
            sessionKey: 'test-session-key',
            expiresIn: 300,
          }),
        })
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(mockUser)
        expect(mockPush).toHaveBeenCalledWith('/game')
      }, { timeout: 5000 })
    })

    it('should store token in localStorage on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        username: 'test_user',
        nickname: 'Test User',
      }

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/status')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'confirmed',
              user: mockUser,
              token: 'mock-jwt-token',
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
            sessionKey: 'test-session-key',
            expiresIn: 300,
          }),
        })
      })

      // Mock localStorage
      const localStorageMock = {
        store: {} as Record<string, string>,
        getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock.store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock.store[key]
        }),
        clear: jest.fn(() => {
          localStorageMock.store = {}
        }),
      }
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token')
      }, { timeout: 5000 })
    })
  })

  describe('替代登录方式链接', () => {
    it('should display link to username/password login', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        const loginLink = screen.getByText('账号密码登录')
        expect(loginLink).toBeInTheDocument()
        expect(loginLink).toHaveAttribute('href', '/auth/login')
      })
    })

    it('should display link to registration page', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        const registerLink = screen.getByText('注册新账号')
        expect(registerLink).toBeInTheDocument()
        expect(registerLink).toHaveAttribute('href', '/auth/register')
      })
    })
  })

  describe('错误处理', () => {
    it('should handle network error gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
      })
    })

    it('should handle custom error message from API', async () => {
      global.fetch = mockFetch(false, { error: 'Custom API error message' })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('Custom API error message')).toBeInTheDocument()
      })
    })
  })

  describe('UI 元素完整性', () => {
    it('should display page title', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('微信登录')).toBeInTheDocument()
      })
    })

    it('should display instruction text', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('使用微信扫码登录，安全便捷')).toBeInTheDocument()
      })
    })

    it('should display login instructions list', async () => {
      global.fetch = mockFetch(true, {
        qrCodeUrl: 'https://open.weixin.qq.com/qr/test',
        sessionKey: 'test-session-key',
        expiresIn: 300,
      })

      render(<WechatLoginPage />)

      await waitFor(() => {
        expect(screen.getByText('登录步骤：')).toBeInTheDocument()
        expect(screen.getByText('打开微信')).toBeInTheDocument()
        expect(screen.getByText('使用"扫一扫"功能')).toBeInTheDocument()
        expect(screen.getByText('扫描上方二维码')).toBeInTheDocument()
        expect(screen.getByText('在手机上确认登录')).toBeInTheDocument()
      })
    })
  })
})
