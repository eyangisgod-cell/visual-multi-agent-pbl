// LLM 配置页面组件测试
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LlmConfigPage from '@/app/admin/llm/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/llm',
}))

// Mock AdminLayout
jest.mock('@/components/admin/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// 抑制 act warning 和 console error
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('act') || args[0].includes('Warning') || args[0].includes('Error'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('LlmConfigPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockLlmConfigs = [
    {
      id: 'config-1',
      provider: 'anthropic',
      apiKey: 'sk-ant-...',
      baseUrl: 'https://api.anthropic.com',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
      isActive: true,
      createdAt: '2026-04-01T00:00:00Z',
    },
    {
      id: 'config-2',
      provider: 'openai',
      apiKey: 'sk-...',
      baseUrl: 'https://api.openai.com',
      models: ['gpt-4', 'gpt-3.5-turbo'],
      isActive: false,
      createdAt: '2026-04-02T00:00:00Z',
    },
  ]

  describe('LLM 配置列表展示', () => {
    it('应该渲染页面标题', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText('LLM 配置')).toBeInTheDocument()
      })
    })

    it('应该显示加载状态', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      render(<LlmConfigPage />)
      expect(screen.getByText(/加载中/i)).toBeInTheDocument()
    })

    it('应该获取并显示 LLM 配置列表', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText('anthropic')).toBeInTheDocument()
      })
    })

    it('应该显示 API Key 脱敏信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText(/sk-ant-\.\.\./i)).toBeInTheDocument()
      })
    })

    it('应该显示激活状态标签', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText('已激活')).toBeInTheDocument()
      })
    })
  })

  describe('添加新配置功能', () => {
    it('应该有添加新配置按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText('+ 添加配置')).toBeInTheDocument()
      })
    })

    it('应该显示创建配置模态框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 添加配置')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        expect(screen.getByText('添加 LLM 配置')).toBeInTheDocument()
      })
    })

    it('应该有 Provider 输入框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 添加配置')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        const providerInput = screen.getByLabelText(/provider/i)
        expect(providerInput).toBeInTheDocument()
      })
    })

    it('应该有 API Key 输入框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 添加配置')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        const apiKeyInput = screen.getByLabelText(/api key/i)
        expect(apiKeyInput).toBeInTheDocument()
      })
    })

    it('应该有 Base URL 输入框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 添加配置')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        const baseUrlInput = screen.getByLabelText(/base url/i)
        expect(baseUrlInput).toBeInTheDocument()
      })
    })

    it('应该有 Models 输入框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 添加配置')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        const modelsInput = screen.getByLabelText(/models/i)
        expect(modelsInput).toBeInTheDocument()
      })
    })
  })

  describe('测试 API 连接功能', () => {
    it('应该有测试连接按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        const testButtons = screen.getAllByText('测试连接')
        expect(testButtons.length).toBeGreaterThan(0)
      })
    })

    it('应该显示测试连接成功消息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const testButton = screen.getAllByText('测试连接')[0]
        fireEvent.click(testButton)
      })
      // 测试连接会调用 API，成功时显示成功消息
      await waitFor(() => {
        expect(screen.getByText('连接成功')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('应该显示测试连接失败消息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      render(<LlmConfigPage />)
      await waitFor(async () => {
        const testButton = screen.getAllByText('测试连接')[0]
        fireEvent.click(testButton)
      })
      // 测试连接失败时显示失败消息
      await waitFor(() => {
        expect(screen.getByText('连接失败')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('激活/停用切换功能', () => {
    it('应该有激活/停用切换按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLlmConfigs,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        const toggleButtons = screen.getAllByText('停用')
        expect(toggleButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('空状态显示', () => {
    it('当没有配置时应该显示空状态提示', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText(/暂无 llm 配置/i)).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该显示错误消息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      render(<LlmConfigPage />)
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument()
      })
    })
  })
})
