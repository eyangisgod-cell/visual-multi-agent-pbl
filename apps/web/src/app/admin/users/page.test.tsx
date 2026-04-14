// 用户管理页面组件测试
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UsersPage from '@/app/admin/users/page'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/users',
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

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockUsers = {
    users: [
      {
        id: 'user-1',
        username: 'zhangsan',
        nickname: '张三',
        avatarUrl: '/avatars/user1.png',
        grade: 10,
        points: 100,
        level: 5,
        role: 'USER',
        invitationCode: 'INV-001',
        createdAt: '2026-04-01T00:00:00Z',
        _count: {
          works: 5,
          userAgents: 2,
        },
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  }

  describe('用户列表展示', () => {
    it('应该渲染页面标题', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        expect(screen.getByText('用户管理')).toBeInTheDocument()
      })
    })

    it('应该显示加载状态', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))
      render(<UsersPage />)
      expect(screen.getByText(/加载中/i)).toBeInTheDocument()
    })

    it('应该获取并显示用户列表', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        expect(screen.getByText('张三')).toBeInTheDocument()
      })
    })
  })

  describe('用户搜索功能', () => {
    it('应该有搜索输入框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/搜索用户/i)
        expect(searchInput).toBeInTheDocument()
      })
    })
  })

  describe('用户详情查看', () => {
    it('应该有查看详情按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        const viewButtons = screen.getAllByText('详情')
        expect(viewButtons.length).toBeGreaterThan(0)
      })
    })

    it('应该显示用户详情模态框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(async () => {
        const viewButton = screen.getAllByText('详情')[0]
        fireEvent.click(viewButton)
      })
      await waitFor(() => {
        expect(screen.getByText('用户详情')).toBeInTheDocument()
      })
    })
  })

  describe('编辑用户功能', () => {
    it('应该有编辑按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        const editButtons = screen.getAllByText('编辑')
        expect(editButtons.length).toBeGreaterThan(0)
      })
    })

    it('应该显示编辑模态框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(async () => {
        const editButton = screen.getAllByText('编辑')[0]
        fireEvent.click(editButton)
      })
      await waitFor(() => {
        expect(screen.getByText('编辑用户')).toBeInTheDocument()
      })
    })

    it('应该有角色下拉框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(async () => {
        const editButton = screen.getAllByText('编辑')[0]
        fireEvent.click(editButton)
      })
      await waitFor(() => {
        const roleSelect = screen.getByRole('combobox', { name: /角色/i })
        expect(roleSelect).toBeInTheDocument()
      })
    })
  })

  describe('用户活动日志链接', () => {
    it('应该有查看活动日志的链接', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        const logLinks = screen.getAllByText('活动日志')
        expect(logLinks.length).toBeGreaterThan(0)
      })
    })
  })

  describe('分页功能', () => {
    const mockPaginatedUsers = {
      users: mockUsers.users,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    }

    it('应该显示分页信息', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPaginatedUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        expect(screen.getByText(/共 25 条/i)).toBeInTheDocument()
      })
    })
  })

  describe('创建新用户', () => {
    it('应该有创建用户按钮', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(() => {
        expect(screen.getByText('+ 创建用户')).toBeInTheDocument()
      })
    })

    it('应该显示创建用户模态框', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      })
      render(<UsersPage />)
      await waitFor(async () => {
        const createButton = screen.getByText('+ 创建用户')
        fireEvent.click(createButton)
      })
      await waitFor(() => {
        expect(screen.getByText('创建新用户')).toBeInTheDocument()
      })
    })
  })
})
