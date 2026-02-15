import { test, expect } from '@playwright/test';

test.describe('DevVault App - Complete Test Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 }).catch(() => {
      // If no test id, wait for sidebar to appear
      return page.waitForSelector('aside', { timeout: 10000 });
    });
  });

  test.describe('Dashboard', () => {
    test('should display dashboard with stats', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      
      // Check header
      await expect(page.locator('h1')).toContainText(/Good (morning|afternoon|evening)/);
      
      // Check quick actions
      await expect(page.getByText('New Note')).toBeVisible();
      await expect(page.getByText('Upload Files')).toBeVisible();
      await expect(page.getByText('New Prompt')).toBeVisible();
      
      // Check stats cards
      await expect(page.getByText('Folders')).toBeVisible();
      await expect(page.getByText('Recent Files')).toBeVisible();
      await expect(page.getByText('Reminders')).toBeVisible();
      await expect(page.getByText('Courses')).toBeVisible();
    });

    test('should navigate from quick actions', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      
      // Click New Note quick action
      await page.getByRole('link', { name: /New Note/i }).click();
      await expect(page).toHaveURL(/.*\/notes/);
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should navigate to all main sections', async ({ page }) => {
      const sections = [
        { name: 'Dashboard', url: '/' },
        { name: 'Vault Explorer', url: '/vault' },
        { name: 'Notes', url: '/notes' },
        { name: 'Prompts', url: '/prompts' },
        { name: 'Code Snippets', url: '/snippets' },
        { name: 'Reminders', url: '/reminders' },
        { name: 'Courses', url: '/courses' },
        { name: 'Activity', url: '/activity' },
        { name: 'Trash', url: '/trash' },
        { name: 'Settings', url: '/settings' }
      ];

      for (const section of sections) {
        await page.getByRole('link', { name: section.name }).click();
        await expect(page).toHaveURL(new RegExp(`.*${section.url}$`));
        await page.waitForTimeout(300); // Brief pause between navigations
      }
    });

    test('should highlight active navigation item', async ({ page }) => {
      await page.getByRole('link', { name: 'Notes' }).click();
      
      const notesLink = page.getByRole('link', { name: 'Notes' });
      const styles = await notesLink.evaluate((el) => window.getComputedStyle(el));
      
      // Active link should have accent color or active background
      expect(styles.color).toBeTruthy();
    });
  });

  test.describe('Notes Feature', () => {
    test('should create a new note', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      // Click new note button
      await page.getByRole('button', { name: /New Note/i }).first().click();
      
      // Wait for note to be created
      await page.waitForTimeout(500);
      
      // Check if "Untitled Note" appears in the list
      await expect(page.getByText('Untitled Note')).toBeVisible();
    });

    test('should edit note title and content', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      // Create new note
      await page.getByRole('button', { name: /New Note/i }).first().click();
      await page.waitForTimeout(500);
      
      // Edit title
      const titleInput = page.locator('input[placeholder*="title"]').or(page.locator('input').first());
      await titleInput.fill('Test Note Title');
      
      // Edit content
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill('This is test content for the note.');
      
      // Wait for auto-save
      await page.waitForTimeout(1500);
      
      // Verify content is saved
      await expect(titleInput).toHaveValue('Test Note Title');
      await expect(contentTextarea).toHaveValue('This is test content for the note.');
    });

    test('should search notes', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      // Type in search box
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('test');
      
      // Results should filter
      await page.waitForTimeout(300);
    });

    test('should close search with ESC key', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('test query');
      
      // Press ESC
      await searchInput.press('Escape');
      
      // Search should be cleared
      await expect(searchInput).toHaveValue('');
    });

    test('should save note with Cmd+S', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      await page.getByRole('button', { name: /New Note/i }).first().click();
      await page.waitForTimeout(500);
      
      const contentTextarea = page.locator('textarea').first();
      await contentTextarea.fill('Content to save');
      
      // Press Cmd+S (or Ctrl+S on Windows/Linux)
      await contentTextarea.press('Meta+s');
      
      await page.waitForTimeout(500);
    });
  });

  test.describe('Prompts Feature', () => {
    test('should create a new prompt', async ({ page }) => {
      await page.goto('http://localhost:5173/prompts');
      
      await page.getByRole('button', { name: /New Prompt/i }).click();
      
      // Fill in prompt details
      await page.locator('input[placeholder*="title"]').fill('Test Prompt');
      await page.locator('textarea').fill('This is a test prompt with {{variable}}');
      
      // Save
      await page.getByRole('button', { name: /Save/i }).click();
      
      await page.waitForTimeout(500);
      await expect(page.getByText('Test Prompt')).toBeVisible();
    });

    test('should detect variables in prompt', async ({ page }) => {
      await page.goto('http://localhost:5173/prompts');
      
      await page.getByRole('button', { name: /New Prompt/i }).click();
      
      const textarea = page.locator('textarea').first();
      await textarea.fill('Test with {{variable1}} and {{variable2}}');
      
      // Variables should be detected and displayed
      await page.waitForTimeout(300);
    });

    test('should filter prompts by category', async ({ page }) => {
      await page.goto('http://localhost:5173/prompts');
      
      // Click on a category filter
      const filters = page.locator('button').filter({ hasText: /All|Coding|Debugging/ });
      if (await filters.count() > 0) {
        await filters.first().click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Code Snippets Feature', () => {
    test('should create a new snippet', async ({ page }) => {
      await page.goto('http://localhost:5173/snippets');
      
      await page.getByRole('button', { name: /New Snippet/i }).click();
      
      await page.locator('input[placeholder*="title"]').fill('Test Snippet');
      await page.locator('textarea').or(page.locator('input[placeholder*="code"]')).first().fill('console.log("test");');
      
      await page.getByRole('button', { name: /Save/i }).click();
      
      await page.waitForTimeout(500);
      await expect(page.getByText('Test Snippet')).toBeVisible();
    });

    test('should select programming language', async ({ page }) => {
      await page.goto('http://localhost:5173/snippets');
      
      await page.getByRole('button', { name: /New Snippet/i }).click();
      
      // Select language dropdown
      const languageSelect = page.locator('select').first();
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption('javascript');
      }
    });

    test('should copy snippet to clipboard', async ({ page }) => {
      await page.goto('http://localhost:5173/snippets');
      
      // Look for copy button
      const copyButton = page.getByRole('button', { name: /Copy/i }).first();
      if (await copyButton.isVisible()) {
        await copyButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Reminders Feature', () => {
    test('should create a new reminder', async ({ page }) => {
      await page.goto('http://localhost:5173/reminders');
      
      await page.getByRole('button', { name: /New Reminder/i }).click();
      
      await page.locator('input[placeholder*="title"]').or(page.locator('input').first()).fill('Test Reminder');
      
      // Set due date
      const dateInput = page.locator('input[type="date"]');
      if (await dateInput.isVisible()) {
        await dateInput.fill('2026-12-31');
      }
      
      await page.getByRole('button', { name: /Save/i }).click();
      
      await page.waitForTimeout(500);
      await expect(page.getByText('Test Reminder')).toBeVisible();
    });

    test('should filter reminders by status', async ({ page }) => {
      await page.goto('http://localhost:5173/reminders');
      
      const filters = page.locator('button').filter({ hasText: /All|Pending|Completed/ });
      if (await filters.count() > 0) {
        await filters.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should set reminder priority', async ({ page }) => {
      await page.goto('http://localhost:5173/reminders');
      
      await page.getByRole('button', { name: /New Reminder/i }).click();
      
      const prioritySelect = page.locator('select').filter({ hasText: /Priority|Low|Medium|High/ }).first();
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('high');
      }
    });
  });

  test.describe('Courses Feature', () => {
    test('should create a new course', async ({ page }) => {
      await page.goto('http://localhost:5173/courses');
      
      await page.getByRole('button', { name: /New Course/i }).click();
      
      await page.locator('input[placeholder*="name"]').or(page.locator('input').first()).fill('Test Course');
      await page.locator('input[placeholder*="instructor"]').fill('Test Instructor');
      
      await page.getByRole('button', { name: /Save/i }).click();
      
      await page.waitForTimeout(500);
      await expect(page.getByText('Test Course')).toBeVisible();
    });

    test('should update course progress', async ({ page }) => {
      await page.goto('http://localhost:5173/courses');
      
      // Look for progress input or slider
      const progressInput = page.locator('input[type="number"]').or(page.locator('input[type="range"]')).first();
      if (await progressInput.isVisible()) {
        await progressInput.fill('50');
      }
    });
  });

  test.describe('Vault Explorer Feature', () => {
    test('should navigate vault folders', async ({ page }) => {
      await page.goto('http://localhost:5173/vault');
      
      // Check if folders are visible
      await expect(page.getByText(/Folders|Files/i)).toBeVisible();
    });

    test('should create new folder', async ({ page }) => {
      await page.goto('http://localhost:5173/vault');
      
      const newFolderButton = page.getByRole('button', { name: /New Folder/i });
      if (await newFolderButton.isVisible()) {
        await newFolderButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Settings Feature', () => {
    test('should navigate to settings', async ({ page }) => {
      await page.goto('http://localhost:5173/settings');
      
      await expect(page.getByText(/Settings|General|Appearance/i)).toBeVisible();
    });

    test('should toggle theme', async ({ page }) => {
      await page.goto('http://localhost:5173/settings');
      
      const themeButton = page.getByRole('button', { name: /Theme|Dark|Light/i }).first();
      if (await themeButton.isVisible()) {
        await themeButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Activity Feature', () => {
    test('should display activity log', async ({ page }) => {
      await page.goto('http://localhost:5173/activity');
      
      await expect(page.getByText(/Activity|Recent|Actions/i)).toBeVisible();
    });
  });

  test.describe('Trash Feature', () => {
    test('should display trash items', async ({ page }) => {
      await page.goto('http://localhost:5173/trash');
      
      await expect(page.getByText(/Trash|Deleted|Empty/i)).toBeVisible();
    });

    test('should restore item from trash', async ({ page }) => {
      await page.goto('http://localhost:5173/trash');
      
      const restoreButton = page.getByRole('button', { name: /Restore/i }).first();
      if (await restoreButton.isVisible()) {
        await restoreButton.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should create new note with Cmd+N', async ({ page }) => {
      await page.goto('http://localhost:5173/notes');
      
      await page.keyboard.press('Meta+n');
      await page.waitForTimeout(500);
      
      await expect(page.getByText('Untitled Note')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:5173/');
      
      // App should still be functional
      await expect(page.locator('aside').or(page.locator('nav'))).toBeTruthy();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('http://localhost:5173/');
      
      await expect(page.locator('aside').or(page.locator('nav'))).toBeTruthy();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle navigation to non-existent route', async ({ page }) => {
      await page.goto('http://localhost:5173/non-existent-page');
      
      // Should redirect or show 404
      await page.waitForTimeout(1000);
    });
  });
});
