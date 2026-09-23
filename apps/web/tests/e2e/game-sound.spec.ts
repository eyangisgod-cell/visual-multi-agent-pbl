/**
 * 环境音效 E2E 测试
 * 测试游戏场景音效播放功能
 */
import { test, expect } from '@playwright/test'

test.describe('环境音效', () => {
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

  test('游戏页面应该有声控控件', async ({ page }) => {
    // 验证音效控制按钮存在
    const soundToggle = page.locator('[data-testid="sound-toggle"]')
    await expect(soundToggle).toBeVisible()
  })

  test('音效控件应该显示当前状态', async ({ page }) => {
    const soundToggle = page.locator('[data-testid="sound-toggle"]')

    // 获取音效状态
    const isMuted = await soundToggle.getAttribute('data-muted')
    // 默认应该是未静音或静音状态
    expect(['true', 'false']).toContain(isMuted)
  })

  test('应该可以切换音效开关', async ({ page }) => {
    const soundToggle = page.locator('[data-testid="sound-toggle"]')

    // 获取初始状态
    const initialMuted = await soundToggle.getAttribute('data-muted')

    // 点击切换
    await soundToggle.click()
    await page.waitForTimeout(300)

    // 验证状态变化
    const newMuted = await soundToggle.getAttribute('data-muted')
    expect(newMuted).not.toBe(initialMuted)
  })
})
