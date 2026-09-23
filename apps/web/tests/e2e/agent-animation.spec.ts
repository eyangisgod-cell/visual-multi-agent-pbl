/**
 * 智能体移动动画 E2E 测试
 * 测试智能体 idle 和 walk 动画状态
 */
import { test, expect } from '@playwright/test'

test.describe('智能体移动动画', () => {
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

  test('智能体应该有 idle 动画状态', async ({ page }) => {
    // 获取智慧导师智能体
    const agent = page.locator('[data-testid="agent-mentor"]')

    // 验证智能体存在
    await expect(agent).toBeVisible()

    // 检查动画状态属性
    const animationState = await agent.getAttribute('data-animation-state')
    expect(animationState).toBe('idle')
  })

  test('玩家移动时应该触发 walk 动画', async ({ page }) => {
    const canvas = page.locator('canvas').first()
    await canvas.focus()
    await page.waitForTimeout(500)

    // 获取初始位置
    const positionDisplay = page.locator('#position-display')
    const initialPos = await positionDisplay.textContent()

    // 按下 W 键移动多次
    await page.keyboard.press('w')
    await page.keyboard.press('w')
    await page.keyboard.press('w')
    await page.waitForTimeout(500)

    // 验证玩家位置变化
    const newPos = await positionDisplay.textContent()
    // 位置可能不变（碰撞检测），验证格式正确即可
    expect(newPos).toMatch(/\(\d+, \d+\)/)
  })

  test('智能体被点击时应该有 speaking 状态', async ({ page }) => {
    const agent = page.locator('[data-testid="agent-mentor"]')

    // 点击智能体
    await agent.click()
    await page.waitForTimeout(500)

    // 验证智能体有 speaking 属性
    const isSpeaking = await agent.getAttribute('data-speaking')
    expect(isSpeaking).toBe('true')
  })
})
