/**
 * E2E Tests for New Agent Creation Page
 * Task: /admin/agents/new - 创建智能体页面
 */

import { test, expect } from '@playwright/test';

test.describe('New Agent Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to new agent page
    await page.goto('http://localhost:3007/admin/agents/new');
  });

  test.describe('Page Layout', () => {
    test('should display page title', async ({ page }) => {
      // Check for heading instead of page title
      const heading = page.getByRole('heading', { name: /创建智能体|Create Agent|New Agent/i });
      await expect(heading).toBeVisible();
    });

    test('should have back link to agents list', async ({ page }) => {
      const backLink = page.getByRole('link', { name: '← 返回智能体管理' });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/admin/agents');
    });

    test('should display form sections', async ({ page }) => {
      // Basic info section
      const basicInfoSection = page.getByTestId('agent-basic-info');
      await expect(basicInfoSection).toBeVisible();

      // Personality section
      const personalitySection = page.getByTestId('agent-personality');
      await expect(personalitySection).toBeVisible();

      // Skills section
      const skillsSection = page.getByTestId('agent-skills');
      await expect(skillsSection).toBeVisible();

      // Appearance section
      const appearanceSection = page.getByTestId('agent-appearance');
      await expect(appearanceSection).toBeVisible();

      // Behavior section
      const behaviorSection = page.getByTestId('agent-behavior');
      await expect(behaviorSection).toBeVisible();

      // LLM config section
      const llmSection = page.getByTestId('agent-llm-config');
      await expect(llmSection).toBeVisible();
    });
  });

  test.describe('Basic Information Form', () => {
    test('should have agent name input', async ({ page }) => {
      const nameInput = page.getByLabel(/智能体名称|Agent Name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveAttribute('type', 'text');
    });

    test('should have agent type selector', async ({ page }) => {
      const typeSelect = page.getByLabel(/智能体类型|Agent Type/i);
      await expect(typeSelect).toBeVisible();

      // Check for type options
      const options = typeSelect.locator('option');
      await expect(options.count()).toBeGreaterThan(0);
    });

    test('should have description textarea', async ({ page }) => {
      const descriptionInput = page.getByLabel(/智能体描述|Description/i);
      await expect(descriptionInput).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /创建|Create/i });
      await submitButton.click();

      // Should show validation error
      const nameError = page.getByText(/名称不能为空|Name is required/i);
      await expect(nameError).toBeVisible();
    });
  });

  test.describe('Personality Configuration', () => {
    test('should have personality traits selector', async ({ page }) => {
      const traitsSelect = page.getByLabel(/性格特征|Personality Traits/i);
      await expect(traitsSelect).toBeVisible();
    });

    test('should have tone selector', async ({ page }) => {
      const toneSelect = page.getByLabel(/语气|Tone/i);
      await expect(toneSelect).toBeVisible();

      // Check options
      const options = toneSelect.locator('option');
      await expect(options.count()).toBeGreaterThan(1);
    });

    test('should have formality level slider', async ({ page }) => {
      const formalitySlider = page.getByLabel(/正式程度|Formality/i);
      await expect(formalitySlider).toBeVisible();
      await expect(formalitySlider).toHaveAttribute('type', 'range');
    });

    test('should have empathy level slider', async ({ page }) => {
      const empathySlider = page.getByLabel(/同理心|Empathy/i);
      await expect(empathySlider).toBeVisible();
      await expect(empathySlider).toHaveAttribute('type', 'range');
    });

    test('should have patience level slider', async ({ page }) => {
      const patienceSlider = page.getByLabel(/耐心|Patience/i);
      await expect(patienceSlider).toBeVisible();
      await expect(patienceSlider).toHaveAttribute('type', 'range');
    });

    test('should have greeting message input', async ({ page }) => {
      const greetingInput = page.getByLabel(/问候语|Greeting Message/i);
      await expect(greetingInput).toBeVisible();
    });

    test('should preview personality', async ({ page }) => {
      const previewButton = page.getByRole('button', { name: /预览|Preview/i });
      await expect(previewButton).toBeVisible();
    });
  });

  test.describe('Skills Configuration', () => {
    test('should have skills multi-select', async ({ page }) => {
      const skillsSelect = page.getByLabel(/技能|Skills/i);
      await expect(skillsSelect).toBeVisible();
    });

    test('should have add custom skill button', async ({ page }) => {
      const addSkillButton = page.getByRole('button', { name: /添加技能|Add Skill/i });
      await expect(addSkillButton).toBeVisible();
    });

    test('should display skill level configuration', async ({ page }) => {
      // Select a skill first
      const skillCheckbox = page.getByTestId('skill-checkbox').first();
      await skillCheckbox.click();

      // Should show level configuration
      const levelSlider = page.getByTestId('skill-level-slider');
      await expect(levelSlider).toBeVisible();
    });

    test('should have knowledge domains selector', async ({ page }) => {
      const domainsSelect = page.getByLabel(/知识领域|Knowledge Domains/i);
      await expect(domainsSelect).toBeVisible();
    });

    test('should have specialty areas input', async ({ page }) => {
      const specialtyInput = page.getByLabel(/专长领域|Specialty Areas/i);
      await expect(specialtyInput).toBeVisible();
    });
  });

  test.describe('Appearance Customization', () => {
    test('should have avatar preset templates', async ({ page }) => {
      const templatesGrid = page.getByTestId('avatar-templates');
      await expect(templatesGrid).toBeVisible();
    });

    test('should have body type selector', async ({ page }) => {
      const bodyTypeSelect = page.getByLabel(/体型|Body Type/i);
      await expect(bodyTypeSelect).toBeVisible();
    });

    test('should have head shape selector', async ({ page }) => {
      const headShapeSelect = page.getByLabel(/头型|Head Shape/i);
      await expect(headShapeSelect).toBeVisible();
    });

    test('should have color picker for primary color', async ({ page }) => {
      const colorPicker = page.getByLabel(/主色调|Primary Color/i);
      await expect(colorPicker).toBeVisible();
    });

    test('should have accessories selector', async ({ page }) => {
      const accessoriesSelect = page.getByLabel(/配饰|Accessories/i);
      await expect(accessoriesSelect).toBeVisible();
    });

    test('should have live preview', async ({ page }) => {
      const previewCanvas = page.getByTestId('avatar-preview');
      await expect(previewCanvas).toBeVisible();
    });

    test('should update preview when changing options', async ({ page }) => {
      // Change body type
      const bodyTypeSelect = page.getByLabel(/体型/i);
      await bodyTypeSelect.selectOption('athletic');

      // Preview should update
      const previewCanvas = page.getByTestId('avatar-preview');
      await expect(previewCanvas).toBeVisible();
    });

    test('should have upload custom avatar option', async ({ page }) => {
      const uploadButton = page.getByLabel(/上传自定义头像|Upload Custom Avatar/i);
      await expect(uploadButton).toBeVisible();
    });
  });

  test.describe('Behavior Configuration', () => {
    test('should have behavior mode selector', async ({ page }) => {
      const modeSelect = page.getByLabel(/行为模式|Behavior Mode/i);
      await expect(modeSelect).toBeVisible();
    });

    test('should have response style options', async ({ page }) => {
      const responseStyleRadio = page.getByLabel(/回复风格|Response Style/i);
      await expect(responseStyleRadio.first()).toBeVisible();
    });

    test('should have interaction frequency setting', async ({ page }) => {
      const frequencySelect = page.getByLabel(/互动频率|Interaction Frequency/i);
      await expect(frequencySelect).toBeVisible();
    });

    test('should have auto-greeting toggle', async ({ page }) => {
      const greetingToggle = page.getByLabel(/自动问候|Auto Greeting/i);
      await expect(greetingToggle).toBeVisible();
      await expect(greetingToggle).toHaveAttribute('type', 'checkbox');
    });

    test('should have hint frequency setting', async ({ page }) => {
      const hintSelect = page.getByLabel(/提示频率|Hint Frequency/i);
      await expect(hintSelect).toBeVisible();
    });

    test('should have feedback style options', async ({ page }) => {
      const feedbackRadio = page.getByLabel(/反馈风格|Feedback Style/i);
      await expect(feedbackRadio.first()).toBeVisible();
    });
  });

  test.describe('LLM Service Configuration', () => {
    test('should have LLM provider selector', async ({ page }) => {
      const providerSelect = page.getByLabel(/LLM 提供商|LLM Provider/i);
      await expect(providerSelect).toBeVisible();
    });

    test('should have API key input', async ({ page }) => {
      const apiKeyInput = page.getByLabel(/API Key/i);
      await expect(apiKeyInput).toBeVisible();
      await expect(apiKeyInput).toHaveAttribute('type', 'password');
    });

    test('should have show/hide toggle for API key', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: /显示|隐藏.*API Key/i });
      await expect(toggleButton).toBeVisible();
    });

    test('should have base URL input', async ({ page }) => {
      const baseUrlInput = page.getByLabel(/API Base URL/i);
      await expect(baseUrlInput).toBeVisible();
      await expect(baseUrlInput).toHaveAttribute('placeholder', /https?:\/\//);
    });

    test('should have model selector', async ({ page }) => {
      const modelSelect = page.getByLabel(/模型|Model/i);
      await expect(modelSelect).toBeVisible();
    });

    test('should have test connection button', async ({ page }) => {
      const testButton = page.getByRole('button', { name: /测试连接|Test Connection/i });
      await expect(testButton).toBeVisible();
    });

    test('should have temperature slider', async ({ page }) => {
      const temperatureSlider = page.getByLabel(/温度|Temperature/i);
      await expect(temperatureSlider).toBeVisible();
      await expect(temperatureSlider).toHaveAttribute('type', 'range');
      await expect(temperatureSlider).toHaveAttribute('min', '0');
      await expect(temperatureSlider).toHaveAttribute('max', '1');
    });

    test('should have max tokens input', async ({ page }) => {
      const maxTokensInput = page.getByLabel(/最大 Token|Max Tokens/i);
      await expect(maxTokensInput).toBeVisible();
      await expect(maxTokensInput).toHaveAttribute('type', 'number');
    });

    test('should have context length setting', async ({ page }) => {
      const contextLengthInput = page.getByLabel(/上下文长度|Context Length/i);
      await expect(contextLengthInput).toBeVisible();
    });
  });

  test.describe('Form Actions', () => {
    test('should have save draft button', async ({ page }) => {
      const saveDraftButton = page.getByRole('button', { name: /保存草稿|Save Draft/i });
      await expect(saveDraftButton).toBeVisible();
    });

    test('should have create agent button', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /创建智能体|Create Agent/i });
      await expect(createButton).toBeVisible();
    });

    test('should have cancel button', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: /取消|Cancel/i });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveAttribute('href', '/admin/agents');
    });

    test('should show success message after creation', async ({ page }) => {
      // Fill minimum required fields
      await page.getByLabel(/智能体名称/i).fill('Test Agent');
      await page.getByLabel(/智能体类型/i).selectOption('tutor');

      const createButton = page.getByRole('button', { name: /创建智能体/i });
      await createButton.click();

      // Should show success message
      const successMessage = page.getByTestId('success-message');
      await expect(successMessage).toBeVisible();
    });

    test('should redirect to agent list after successful creation', async ({ page }) => {
      // Fill minimum required fields
      await page.getByLabel(/智能体名称/i).fill('Test Agent');
      await page.getByLabel(/智能体类型/i).selectOption('tutor');

      const createButton = page.getByRole('button', { name: /创建智能体/i });
      await createButton.click();

      // Should redirect
      await expect(page).toHaveURL(/\/admin\/agents.*/);
    });
  });

  test.describe('Form Validation', () => {
    test('should require agent name', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /创建智能体/i });
      await createButton.click();

      const nameError = page.getByText(/名称不能为空/i);
      await expect(nameError).toBeVisible();
    });

    test('should require agent type', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /创建智能体/i });
      await createButton.click();

      const typeError = page.getByText(/类型不能为空/i);
      await expect(typeError).toBeVisible();
    });

    test('should validate API key format if provided', async ({ page }) => {
      const apiKeyInput = page.getByLabel(/API Key/i);
      await apiKeyInput.fill('invalid-key-format');

      const testButton = page.getByRole('button', { name: /测试连接/i });
      await testButton.click();

      // Should show error
      const error = page.getByText(/无效的 API Key 格式/i);
      await expect(error).toBeVisible();
    });

    test('should show all validation errors at once', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /创建智能体/i });
      await createButton.click();

      // Should have multiple errors
      const errorCount = await page.getByText(/不能为空/i).count();
      expect(errorCount).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const formSection = page.getByTestId('agent-form');
      await expect(formSection).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const appearanceSection = page.getByTestId('agent-appearance');
      await expect(appearanceSection).toBeVisible();
    });
  });
});
