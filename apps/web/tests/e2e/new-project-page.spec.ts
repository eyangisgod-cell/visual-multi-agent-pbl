/**
 * E2E Tests for New Project Creation Page
 * Task: /admin/projects/new - 创建新项目页面
 */

import { test, expect } from '@playwright/test';

test.describe('New Project Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to new project page
    await page.goto('/admin/projects/new');
  });

  test.describe('Page Layout', () => {
    test('should display page title', async ({ page }) => {
      await expect(page).toHaveTitle(/创建新项目|New Project|Visual PBL/);

      const heading = page.getByRole('heading', { name: /创建新项目|New Project/i });
      await expect(heading).toBeVisible();
    });

    test('should have back link to projects list', async ({ page }) => {
      const backLink = page.getByRole('link', { name: /返回|Back.*项目管理/i });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute('href', '/admin/projects');
    });

    test('should display form sections', async ({ page }) => {
      // Project info section
      const projectInfoSection = page.getByTestId('project-info-section');
      await expect(projectInfoSection).toBeVisible();

      // Tasks editor section
      const tasksSection = page.getByTestId('tasks-editor-section');
      await expect(tasksSection).toBeVisible();

      // Student assignment section
      const studentsSection = page.getByTestId('student-assignment-section');
      await expect(studentsSection).toBeVisible();

      // Assessment criteria section
      const assessmentSection = page.getByTestId('assessment-section');
      await expect(assessmentSection).toBeVisible();
    });
  });

  test.describe('Project Information Form', () => {
    test('should have project title input', async ({ page }) => {
      const titleInput = page.getByLabel(/项目标题|Project Title/i);
      await expect(titleInput).toBeVisible();
      await expect(titleInput).toHaveAttribute('type', 'text');
    });

    test('should have project description textarea', async ({ page }) => {
      const descriptionInput = page.getByLabel(/项目描述|Description/i);
      await expect(descriptionInput).toBeVisible();
      await expect(descriptionInput).toBeEnabled();
    });

    test('should have grade level selector', async ({ page }) => {
      const gradeMinSelect = page.getByLabel(/最低年级|Minimum Grade/i);
      await expect(gradeMinSelect).toBeVisible();

      const gradeMaxSelect = page.getByLabel(/最高年级|Maximum Grade/i);
      await expect(gradeMaxSelect).toBeVisible();
    });

    test('should have subject selector', async ({ page }) => {
      const subjectSelect = page.getByLabel(/学科|Subject/i);
      await expect(subjectSelect).toBeVisible();

      // Check options exist
      const options = subjectSelect.locator('option');
      await expect(options.count()).toBeGreaterThan(0);
    });

    test('should have difficulty selector', async ({ page }) => {
      const difficultySelect = page.getByLabel(/难度|Difficulty/i);
      await expect(difficultySelect).toBeVisible();
    });

    test('should have estimated time input', async ({ page }) => {
      const timeInput = page.getByLabel(/预计时间|Estimated Time/i);
      await expect(timeInput).toBeVisible();
      await expect(timeInput).toHaveAttribute('type', 'number');
    });

    test('should have tags input', async ({ page }) => {
      const tagsInput = page.getByLabel(/标签|Tags/i);
      await expect(tagsInput).toBeVisible();
    });

    test('should have cover image upload', async ({ page }) => {
      const coverUpload = page.getByLabel(/封面图片|Cover Image/i);
      await expect(coverUpload).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /创建|Create/i });

      // Click submit without filling required fields
      await submitButton.click();

      // Should show validation errors
      const titleError = page.getByText(/标题不能为空|Title is required/i);
      await expect(titleError).toBeVisible();
    });

    test('should submit form successfully', async ({ page }) => {
      // Fill in form
      await page.getByLabel(/项目标题/i).fill('Test Project');
      await page.getByLabel(/项目描述/i).fill('This is a test project');
      await page.getByLabel(/最低年级/i).selectOption('6');
      await page.getByLabel(/最高年级/i).selectOption('8');
      await page.getByLabel(/学科/i).selectOption('math');
      await page.getByLabel(/难度/i).selectOption('2');
      await page.getByLabel(/预计时间/i).fill('60');

      // Submit
      const submitButton = page.getByRole('button', { name: /创建|Create/i });
      await submitButton.click();

      // Should redirect to projects list or show success message
      await expect(page).toHaveURL(/\/admin\/projects.*/);
    });
  });

  test.describe('Task Editor', () => {
    test('should have add task button', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await expect(addTaskButton).toBeVisible();
    });

    test('should create new task when clicking add', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await addTaskButton.click();

      // Should show new task form
      const taskTitleInput = page.getByPlaceholder(/任务标题|Task title/i).first();
      await expect(taskTitleInput).toBeVisible();
    });

    test('should have task title input', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await addTaskButton.click();

      const taskTitleInput = page.getByPlaceholder(/任务标题|Task title/i).first();
      await expect(taskTitleInput).toBeVisible();
    });

    test('should have task description input', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await addTaskButton.click();

      const taskDescInput = page.getByPlaceholder(/任务描述|Task description/i).first();
      await expect(taskDescInput).toBeVisible();
    });

    test('should have task order/priority setting', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await addTaskButton.click();

      const orderInput = page.getByLabel(/顺序|Order|Priority/i).first();
      await expect(orderInput).toBeVisible();
    });

    test('should have delete task button', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });
      await addTaskButton.click();

      const deleteButton = page.getByRole('button', { name: /删除|Delete/i }).first();
      await expect(deleteButton).toBeVisible();
    });

    test('should reorder tasks with drag and drop', async ({ page }) => {
      const addTaskButton = page.getByRole('button', { name: /添加任务|Add Task/i });

      // Add two tasks
      await addTaskButton.click();
      await addTaskButton.click();

      // Fill in task titles
      await page.getByPlaceholder(/任务标题/i).nth(0).fill('Task 1');
      await page.getByPlaceholder(/任务标题/i).nth(1).fill('Task 2');

      // Drag Task 2 above Task 1
      // This would require specific implementation
      test.skip();
    });
  });

  test.describe('Student Assignment', () => {
    test('should have student search input', async ({ page }) => {
      const searchInput = page.getByLabel(/搜索学生|Search students/i);
      await expect(searchInput).toBeVisible();
    });

    test('should display student list', async ({ page }) => {
      const studentList = page.getByTestId('student-list');
      await expect(studentList).toBeVisible();
    });

    test('should allow selecting students', async ({ page }) => {
      const studentCheckbox = page.getByTestId('student-checkbox').first();
      await expect(studentCheckbox).toBeVisible();
      await studentCheckbox.click();
      await expect(studentCheckbox).toBeChecked();
    });

    test('should show selected students count', async ({ page }) => {
      // Select a student
      const studentCheckbox = page.getByTestId('student-checkbox').first();
      await studentCheckbox.click();

      const countDisplay = page.getByTestId('selected-count');
      await expect(countDisplay).toContainText('1');
    });

    test('should have assign students button', async ({ page }) => {
      const assignButton = page.getByRole('button', { name: /分配学生|Assign Students/i });
      await expect(assignButton).toBeVisible();
    });
  });

  test.describe('Assessment Criteria', () => {
    test('should have add criteria button', async ({ page }) => {
      const addCriterionButton = page.getByRole('button', { name: /添加评估标准|Add Criteria/i });
      await expect(addCriterionButton).toBeVisible();
    });

    test('should have criteria name input', async ({ page }) => {
      await page.getByRole('button', { name: /添加评估标准/i }).click();

      const criteriaNameInput = page.getByPlaceholder(/评估标准名称/i).first();
      await expect(criteriaNameInput).toBeVisible();
    });

    test('should have criteria description input', async ({ page }) => {
      await page.getByRole('button', { name: /添加评估标准/i }).click();

      const criteriaDescInput = page.getByPlaceholder(/评估标准描述/i).first();
      await expect(criteriaDescInput).toBeVisible();
    });

    test('should have points/weight input', async ({ page }) => {
      await page.getByRole('button', { name: /添加评估标准/i }).click();

      const pointsInput = page.getByLabel(/分值|权重|Points|Weight/i).first();
      await expect(pointsInput).toBeVisible();
    });

    test('should have delete criteria button', async ({ page }) => {
      await page.getByRole('button', { name: /添加评估标准/i }).click();

      const deleteButton = page.getByRole('button', { name: /删除/i }).first();
      await expect(deleteButton).toBeVisible();
    });
  });

  test.describe('Project Statistics Preview', () => {
    test('should display project statistics section', async ({ page }) => {
      const statsSection = page.getByTestId('project-stats-section');
      await expect(statsSection).toBeVisible();
    });

    test('should show task count', async ({ page }) => {
      const taskCount = page.getByTestId('task-count');
      await expect(taskCount).toBeVisible();
    });

    test('should show estimated total time', async ({ page }) => {
      const totalTime = page.getByTestId('total-time');
      await expect(totalTime).toBeVisible();
    });
  });

  test.describe('Form Actions', () => {
    test('should have save draft button', async ({ page }) => {
      const saveDraftButton = page.getByRole('button', { name: /保存草稿|Save Draft/i });
      await expect(saveDraftButton).toBeVisible();
    });

    test('should have submit/publish button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /创建项目|Create Project|发布/i });
      await expect(submitButton).toBeVisible();
    });

    test('should have cancel button', async ({ page }) => {
      const cancelButton = page.getByRole('button', { name: /取消|Cancel/i });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveAttribute('href', '/admin/projects');
    });

    test('should show success message after creation', async ({ page }) => {
      // Fill minimum form
      await page.getByLabel(/项目标题/i).fill('Test Project');

      const submitButton = page.getByRole('button', { name: /创建项目/i });
      await submitButton.click();

      // Should show success message
      const successMessage = page.getByTestId('success-message');
      await expect(successMessage).toBeVisible();
    });

    test('should show error message on failure', async ({ page }) => {
      // This would require mocking API failure
      test.skip();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Form should still be usable
      const titleInput = page.getByLabel(/项目标题/i);
      await expect(titleInput).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      const formSection = page.getByTestId('project-form');
      await expect(formSection).toBeVisible();
    });
  });
});
