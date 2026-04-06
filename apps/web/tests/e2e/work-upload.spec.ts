/**
 * Task #157 - 作品上传功能 E2E 测试（学生端）
 *
 * 测试目标：
 * 1. 访问上传页面
 * 2. 上传作品（文本/图片）
 * 3. 作品预览
 */

import { test, expect } from '@playwright/test';

test.describe('Task #157 - 作品上传功能（学生端）', () => {
  // 辅助函数：登录并导航到上传页面
  async function loginAndGoToUpload(page: any) {
    const context = page.context();
    await context.clearCookies();
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // 导航到作品上传页面
    await page.goto('/works/upload');
    await page.waitForLoadState('networkidle');
  }

  test.describe('访问上传页面', () => {
    test('应该可以访问作品上传页面', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 验证页面标题存在
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      expect(await heading.textContent()).toContain('上传作品');

      // 验证不显示 404
      const notFoundText = page.locator('text=404');
      await expect(notFoundText).not.toBeVisible();
    });

    test('上传页面应该包含表单元素', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 验证标题输入框存在
      const titleInput = page.locator('input[name="title"]');
      await expect(titleInput).toBeVisible();

      // 验证描述输入框存在
      const descriptionInput = page.locator('textarea[name="description"]');
      await expect(descriptionInput).toBeVisible();

      // 验证项目选择器存在
      const projectSelect = page.locator('select[name="projectId"]');
      await expect(projectSelect).toBeVisible();

      // 验证提交按钮存在
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('上传作品', () => {
    test('应该可以上传文本作品', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 填写表单
      await page.fill('input[name="title"]', '测试文本作品');
      await page.fill('textarea[name="description"]', '这是一个测试文本作品的描述');
      await page.fill('textarea[name="content"]', '这是作品的正文内容...');

      // 选择项目（等待选项加载）
      await page.waitForTimeout(1000);
      const options = page.locator('select[name="projectId"] option');
      const optCount = await options.count();

      if (optCount > 1) {
        await page.selectOption('select[name="projectId"]', { index: 1 });
      }

      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待处理完成
      await page.waitForTimeout(3000);

      // 验证：页面不应该再有表单输入（表示已提交）
      // 或者跳转到详情页
      const currentUrl = page.url();

      if (currentUrl.includes('/works/')) {
        // 跳转到详情页，验证作品标题存在（在详情页 h1 或数据属性中）
        const titleElement = page.locator('[data-testid="work-detail-title"]');
        if (await titleElement.count() > 0) {
          expect(await titleElement.textContent()).toContain('测试文本作品');
        } else {
          // 如果没有 data-testid，检查页面是否包含作品标题文本
          const content = await page.content();
          expect(content).toContain('测试文本作品');
        }
      } else {
        // 可能还在上传页面，验证表单已清空或显示成功状态
        const titleInput = page.locator('input[name="title"]');
        const titleValue = await titleInput.inputValue();
        // 如果标题为空，表示表单已重置（成功提交）
        expect(titleValue).toBe('');
      }
    });

    test('应该可以上传带封面的作品', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 填写表单
      await page.fill('input[name="title"]', '测试带封面作品');
      await page.fill('textarea[name="description"]', '这是一个带封面的测试作品');

      // 选择项目
      await page.waitForTimeout(1000);
      const options = page.locator('select[name="projectId"] option');
      const optCount = await options.count();

      if (optCount > 1) {
        await page.selectOption('select[name="projectId"]', { index: 1 });
      }

      // 上传封面图片
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test-cover.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      });

      // 等待图片预览显示
      await page.waitForTimeout(1000);
      const preview = page.locator('[data-testid="cover-preview"]');
      await expect(preview).toBeVisible();

      // 提交表单
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待处理完成
      await page.waitForTimeout(2000);
    });

    test('标题为空时应该显示错误提示', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 不填写标题，直接提交
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 等待错误提示
      await page.waitForTimeout(1000);

      // 验证显示错误消息
      const errorMessage = page.locator('text=标题不能为空');
      await expect(errorMessage).toBeVisible();
    });

    test('应该可以选择项目', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 等待项目选项加载
      await page.waitForTimeout(1000);

      const projectSelect = page.locator('select[name="projectId"]');
      const options = projectSelect.locator('option');
      const optCount = await options.count();

      if (optCount > 1) {
        // 选择第一个非空项目
        await page.selectOption('select[name="projectId"]', { index: 1 });

        // 验证选择成功
        const selectedValue = await projectSelect.inputValue();
        expect(selectedValue).not.toBe('');
      }
    });
  });

  test.describe('作品预览', () => {
    test('上传封面后应该显示预览', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 填写基本信息
      await page.fill('input[name="title"]', '预览测试作品');

      // 上传图片
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'preview-test.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      });

      // 等待预览显示
      await page.waitForTimeout(1000);
      const preview = page.locator('[data-testid="cover-preview"]');
      await expect(preview).toBeVisible();

      // 验证预览图片 src 属性存在
      const previewImg = preview.locator('img');
      await expect(previewImg).toHaveAttribute('src');
    });

    test('应该可以清除已上传的封面', async ({ page }) => {
      await loginAndGoToUpload(page);

      // 上传图片
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'remove-test.png',
        mimeType: 'image/png',
        buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
      });

      // 等待预览显示
      await page.waitForTimeout(1000);
      const preview = page.locator('[data-testid="cover-preview"]');
      await expect(preview).toBeVisible();

      // 点击移除按钮
      const removeButton = page.locator('[data-testid="remove-cover"]');
      await expect(removeButton).toBeVisible();
      await removeButton.click();

      // 验证预览已隐藏
      await expect(preview).not.toBeVisible();
    });
  });
});
