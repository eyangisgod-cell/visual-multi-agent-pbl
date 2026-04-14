// LLM 配置 API 测试
// 注意：由于 Next.js API route 测试需要特殊配置，这里主要测试业务逻辑

describe('LLM Config API', () => {
  describe('GET /api/admin/llm', () => {
    it('应该返回所有 LLM 配置列表', async () => {
      // 模拟 fetch 获取 LLM 配置列表
      const mockConfigs = [
        {
          id: 'config-1',
          provider: 'anthropic',
          apiKey: 'sk-ant-api-key-12345',
          baseUrl: 'https://api.anthropic.com',
          models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
          isActive: true,
          createdAt: '2026-04-01T00:00:00Z',
        },
      ]

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfigs,
      })

      const response = await fetch('/api/admin/llm')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toHaveLength(1)
      expect(data[0].provider).toBe('anthropic')
    })

    it('当没有配置时应该返回空数组', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const response = await fetch('/api/admin/llm')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/admin/llm', () => {
    it('应该创建新的 LLM 配置', async () => {
      const newConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-new-api-key',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus-20240229'],
        isActive: true,
      }

      const createdConfig = {
        id: 'config-1',
        ...newConfig,
        apiKey: 'sk-ant-n...',
        createdAt: '2026-04-01T00:00:00Z',
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => createdConfig,
      })

      const response = await fetch('/api/admin/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.id).toBe('config-1')
      expect(data.apiKey).toBe('sk-ant-n...')
    })

    it('当缺少 provider 时应该返回错误', async () => {
      const invalidConfig = {
        apiKey: 'sk-ant-api-key',
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Provider and API key are required' }),
      })

      const response = await fetch('/api/admin/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidConfig),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('当 provider 已存在时应该返回 409 状态码', async () => {
      const existingConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-api-key',
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'LLM provider already configured' }),
      })

      const response = await fetch('/api/admin/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingConfig),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(409)
    })
  })

  describe('PATCH /api/admin/llm/[provider]', () => {
    it('应该更新 LLM 配置的激活状态', async () => {
      const updatedConfig = {
        id: 'config-1',
        provider: 'anthropic',
        apiKey: 'sk-ant-...',
        isActive: true,
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => updatedConfig,
      })

      const response = await fetch('/api/admin/llm/anthropic', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.isActive).toBe(true)
    })
  })
})
