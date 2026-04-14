/**
 * @jest-environment jsdom
 */

// 数据分析仪表盘页面组件测试
// 注意：由于 Chart.js 需要 Canvas 支持，部分图表相关测试被跳过

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'

// Mock Next.js navigation before any imports
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/analytics',
}))

// Mock AdminLayout
jest.mock('@/components/admin/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout">{children}</div>
  ),
}))

// Mock chart.js
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}))

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="chart-line" />,
  Bar: () => <div data-testid="chart-bar" />,
  Pie: () => <div data-testid="chart-pie" />,
  Doughnut: () => <div data-testid="chart-doughnut" />,
}))

// Import component after mocks
import AnalyticsPage from '@/app/admin/analytics/page'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Suppress console errors
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('act') || args[0].includes('Warning'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockLearningStats = {
    totalUsers: 100,
    activeUsers: 45,
    totalWorks: 250,
    totalProjects: 20,
    completedProjects: 15,
    totalConversations: 500,
    totalAgentUsage: 800,
    completionRate: 75.00,
  }

  const mockWorksStats = {
    totalWorks: 210,
    trendData: {
      '2026-04-01': 5,
      '2026-04-02': 8,
      '2026-04-03': 12,
    },
    statusDistribution: {
      published: 150,
      draft: 30,
      pending_review: 20,
      rejected: 10,
    },
    subjectDistribution: {
      Math: 50,
      Science: 75,
      Art: 30,
    },
  }

  const mockAgentStats = {
    totalAgentUsage: 240,
    totalConversations: 90,
    topAgents: [
      { agentId: 'agent-1', name: 'Agent 1', agentType: 'tutor', usageCount: 100 },
      { agentId: 'agent-2', name: 'Agent 2', agentType: 'mentor', usageCount: 80 },
    ],
    typeDistribution: {
      tutor: 100,
      mentor: 80,
      evaluator: 60,
    },
  }

  const setupFetchMocks = () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockLearningStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockWorksStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockAgentStats })
  }

  describe('页面加载', () => {
    it('应该显示加载状态', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      render(<AnalyticsPage />)
      // 检查加载动画存在（旋转的 div）
      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('应该渲染页面标题', async () => {
      setupFetchMocks()
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('学习数据分析')).toBeInTheDocument()
      })
    })
  })

  describe('数据显示', () => {
    beforeEach(() => {
      setupFetchMocks()
    })

    it('应该显示用户总数', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        // 查找用户总数卡片中的 100 - 使用 getAllByText 并检查第一个
        const userCountElements = screen.getAllByText('100')
        expect(userCountElements.length).toBeGreaterThan(0)
      })
    })

    it('应该显示活跃用户数', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument()
      })
    })

    it('应该显示作品总数', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument()
      })
    })

    it('应该显示统计卡片标题', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('用户总数')).toBeInTheDocument()
        expect(screen.getByText('活跃用户')).toBeInTheDocument()
        expect(screen.getByText('作品总数')).toBeInTheDocument()
        expect(screen.getByText('项目总数')).toBeInTheDocument()
        expect(screen.getByText('对话总数')).toBeInTheDocument()
        expect(screen.getByText('智能体使用')).toBeInTheDocument()
      })
    })
  })

  describe('UI 元素', () => {
    beforeEach(() => {
      setupFetchMocks()
    })

    it('应该有刷新按钮', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('刷新')).toBeInTheDocument()
      })
    })

    it('应该有导出按钮', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('导出')).toBeInTheDocument()
      })
    })

    it('应该有导出 CSV 选项', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('导出 CSV')).toBeInTheDocument()
      })
    })

    it('应该有导出 JSON 选项', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('导出 JSON')).toBeInTheDocument()
      })
    })

    it('应该有日期输入框（开始日期）', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByLabelText(/开始日期/i)).toBeInTheDocument()
      })
    })

    it('应该有日期输入框（结束日期）', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByLabelText(/结束日期/i)).toBeInTheDocument()
      })
    })

    it('应该有应用筛选按钮', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('应用筛选')).toBeInTheDocument()
      })
    })
  })

  describe('作品趋势图表', () => {
    beforeEach(() => {
      setupFetchMocks()
    })

    it('应该显示作品提交趋势标题', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('作品提交趋势')).toBeInTheDocument()
      })
    })

    it('应该渲染折线图组件', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByTestId('chart-line')).toBeInTheDocument()
      })
    })
  })

  describe('作品状态分布图表', () => {
    beforeEach(() => {
      setupFetchMocks()
    })

    it('应该显示作品状态分布标题', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('作品状态分布')).toBeInTheDocument()
      })
    })

    it('应该渲染饼图组件', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByTestId('chart-pie')).toBeInTheDocument()
      })
    })
  })

  describe('智能体使用图表', () => {
    beforeEach(() => {
      setupFetchMocks()
    })

    it('应该显示智能体类型使用标题', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByText('智能体类型使用')).toBeInTheDocument()
      })
    })

    it('应该渲染柱状图组件', async () => {
      render(<AnalyticsPage />)
      await waitFor(() => {
        expect(screen.getByTestId('chart-bar')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该显示错误消息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalWorks: 0, trendData: {}, statusDistribution: {}, subjectDistribution: {} }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalAgentUsage: 0, totalConversations: 0, topAgents: [], typeDistribution: {} }),
      })
      render(<AnalyticsPage />)
      await waitFor(() => {
        // 检查错误消息存在
        expect(screen.getByText(/重试/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })
})
