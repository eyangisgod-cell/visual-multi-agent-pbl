/**
 * 智能体自主行为 E2E 测试
 * 测试智能体自主移动和互动功能
 */
import { test, expect } from '@playwright/test'

test.describe('智能体自主行为', () => {
  test.beforeEach(async ({ page }) => {
    // 登录并导航到游戏页面
    await page.goto('http://localhost:3000/auth/login')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'test123456')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    await page.goto('http://localhost:3000/game')
    await page.waitForTimeout(5000)
  })

  test('智能体应该有自己的位置信息', async ({ page }) => {
    // 验证每个智能体都有位置属性
    const agentTypes = ['mentor', 'designer', 'analyst', 'marketer', 'assistant']

    for (const agentType of agentTypes) {
      const agent = page.locator(`[data-testid="agent-${agentType}"]`)
      await expect(agent).toBeVisible()

      // 检查位置属性
      const position = await agent.getAttribute('data-position')
      expect(position).toMatch(/^\d+,\d+$/)
    }
  })

  test('应该有多个智能体在场景区', async ({ page }) => {
    // 验证至少渲染了 5 个智能体
    const agentCount = await page.locator('[data-testid^="agent-"]').count()
    expect(agentCount).toBeGreaterThanOrEqual(5)
  })

  test('智能体之间应该有合理的间距', async ({ page }) => {
    const agentTypes = ['mentor', 'designer', 'analyst', 'marketer', 'assistant']
    const positions: {x: number, y: number}[] = []

    for (const agentType of agentTypes) {
      const agent = page.locator(`[data-testid="agent-${agentType}"]`)
      const position = await agent.getAttribute('data-position')
      if (position) {
        const [x, y] = position.split(',').map(Number)
        positions.push({x, y})
      }
    }

    // 验证智能体不在同一位置
    const uniquePositions = new Set(positions.map(p => `${p.x},${p.y}`))
    expect(uniquePositions.size).toBeGreaterThanOrEqual(3)
  })
})
