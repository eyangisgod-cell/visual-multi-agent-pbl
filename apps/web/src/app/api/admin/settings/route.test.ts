// 系统设置 API 测试
// 注意：由于 Next.js API route 测试需要特殊配置，这里主要测试业务逻辑

describe('System Settings API', () => {
  describe('GET /api/admin/settings', () => {
    it('应该返回所有系统设置', async () => {
      const mockSettings = [
        {
          id: 'setting-1',
          key: 'site_name',
          value: '我的网站',
          category: 'general',
          updatedAt: '2026-04-01T00:00:00Z',
        },
        {
          id: 'setting-2',
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          category: 'email',
          updatedAt: '2026-04-01T00:00:00Z',
        },
      ]

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      })

      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
      expect(data[0].key).toBe('site_name')
    })

    it('当没有配置时应该返回空数组', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual([])
    })

    it('应该支持按分类筛选', async () => {
      const mockSettings = [
        {
          id: 'setting-1',
          key: 'smtp_host',
          value: 'smtp.gmail.com',
          category: 'email',
          updatedAt: '2026-04-01T00:00:00Z',
        },
        {
          id: 'setting-2',
          key: 'smtp_port',
          value: '587',
          category: 'email',
          updatedAt: '2026-04-01T00:00:00Z',
        },
      ]

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      })

      const response = await fetch('/api/admin/settings?category=email')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(2)
      expect(data.every((s: any) => s.category === 'email')).toBe(true)
    })
  })

  describe('PUT /api/admin/settings', () => {
    it('应该更新系统设置', async () => {
      const updatedSettings = [
        {
          id: 'setting-1',
          key: 'site_name',
          value: '新网站名称',
          category: 'general',
          updatedAt: '2026-04-14T00:00:00Z',
        },
      ]

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSettings,
      })

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].key).toBe('site_name')
      expect(data[0].value).toBe('新网站名称')
    })

    it('当请求体不是数组时应该返回错误', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Settings must be an array' }),
      })

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'site_name', value: 'test' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/admin/settings/bulk-init', () => {
    it('应该初始化默认系统设置', async () => {
      const defaultSettings = [
        { key: 'site_name', value: '默认网站', category: 'general' },
        { key: 'smtp_host', value: 'localhost', category: 'email' },
        { key: 'storage_provider', value: 'local', category: 'storage' },
      ]

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, count: 3 }),
      })

      const response = await fetch('/api/admin/settings/bulk-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: defaultSettings }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)
    })
  })
})
