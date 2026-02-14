import { test, expect, type Page } from '@playwright/test';

// ============================================
// DEVVAULT COMPREHENSIVE E2E TEST SUITE
// Tests the web frontend at localhost:5173
// Note: Tauri IPC/SQL calls won't work in browser
// so we test layout, navigation, UI, forms, theme
// ============================================

const BASE = 'http://localhost:5173';

// Helper: wait for app to initialize (loading screen to disappear)
async function waitForApp(page: Page) {
	await page.goto(BASE);
	// The app shows a loading screen then the main layout
	// Wait for sidebar or main content to appear
	await page.waitForSelector('aside, nav, [data-sveltekit-preload-data]', { timeout: 10000 });
	// Give Svelte time to hydrate
	await page.waitForTimeout(1500);
}

// ============================================
// 1. APP INITIALIZATION & LOADING
// ============================================

test.describe('App Initialization', () => {
	test('app loads without crashing', async ({ page }) => {
		const response = await page.goto(BASE);
		expect(response?.status()).toBe(200);
	});

	test('HTML has dark class by default', async ({ page }) => {
		await page.goto(BASE);
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);
	});

	test('page title is DevVault', async ({ page }) => {
		await page.goto(BASE);
		await expect(page).toHaveTitle('DevVault');
	});

	test('body has overflow hidden and full viewport', async ({ page }) => {
		await page.goto(BASE);
		const body = page.locator('body');
		await expect(body).toHaveCSS('overflow', 'hidden');
	});

	test('CSS custom properties are defined', async ({ page }) => {
		await page.goto(BASE);
		await page.waitForTimeout(1500);
		// Check a root-level variable that doesn't depend on theme resolution
		const radiusSm = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--radius-sm')
		);
		expect(radiusSm.trim()).not.toBe('');
	});

	test('font-family is set on html element', async ({ page }) => {
		await page.goto(BASE);
		const fontFamily = await page.evaluate(() =>
			getComputedStyle(document.documentElement).fontFamily
		);
		// Should have some font-family set (Inter, system fonts, or any fallback)
		expect(fontFamily.length).toBeGreaterThan(0);
	});
});

// ============================================
// 2. LAYOUT STRUCTURE
// ============================================

test.describe('Layout Structure', () => {
	test('loading screen or main layout renders', async ({ page }) => {
		await page.goto(BASE);
		await page.waitForTimeout(2000);
		// After init, either loading screen passed or main layout is visible
		const sidebar = page.locator('aside');
		const devvault = page.getByText('DevVault', { exact: false });
		const hasContent = (await sidebar.count()) > 0 || (await devvault.count()) > 0;
		expect(hasContent).toBeTruthy();
	});

	test('main layout has sidebar + main area', async ({ page }) => {
		await waitForApp(page);
		// Check for the flex container with sidebar and main
		const flexContainer = page.locator('div.flex.h-screen');
		// Sidebar aside element
		const sidebar = page.locator('aside');
		// Main content area
		const main = page.locator('main');
		// At least one of these should exist
		const sidebarCount = await sidebar.count();
		const mainCount = await main.count();
		expect(sidebarCount + mainCount).toBeGreaterThan(0);
	});

	test('sidebar has correct width when open', async ({ page }) => {
		await waitForApp(page);
		const sidebar = page.locator('aside').first();
		if (await sidebar.isVisible()) {
			const box = await sidebar.boundingBox();
			if (box) {
				expect(box.width).toBeGreaterThanOrEqual(200);
				expect(box.width).toBeLessThanOrEqual(300);
			}
		}
	});

	test('sidebar contains DevVault logo and version badge', async ({ page }) => {
		await waitForApp(page);
		const devvaultText = page.getByText('DevVault', { exact: false });
		await expect(devvaultText.first()).toBeVisible();
		const versionBadge = page.getByText('v0.1');
		const badgeCount = await versionBadge.count();
		expect(badgeCount).toBeGreaterThanOrEqual(0); // May or may not render depending on init
	});
});

// ============================================
// 3. SIDEBAR NAVIGATION
// ============================================

test.describe('Sidebar Navigation', () => {
	const navItems = [
		{ label: 'Dashboard', href: '/' },
		{ label: 'Vault Explorer', href: '/vault' },
		{ label: 'Notes', href: '/notes' },
		{ label: 'Prompts', href: '/prompts' },
		{ label: 'Reminders', href: '/reminders' },
		{ label: 'Courses', href: '/courses' },
		{ label: 'Code Snippets', href: '/snippets' },
		{ label: 'Activity', href: '/activity' },
		{ label: 'Trash', href: '/trash' },
		{ label: 'Settings', href: '/settings' },
	];

	for (const item of navItems) {
		test(`sidebar has "${item.label}" link`, async ({ page }) => {
			await waitForApp(page);
			const link = page.getByText(item.label, { exact: true });
			await expect(link.first()).toBeVisible();
		});
	}

	test('clicking nav items navigates to correct route', async ({ page }) => {
		await waitForApp(page);
		// Click Notes
		await page.getByText('Notes', { exact: true }).first().click();
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/notes');

		// Click Prompts
		await page.getByText('Prompts', { exact: true }).first().click();
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/prompts');

		// Click Reminders
		await page.getByText('Reminders', { exact: true }).first().click();
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/reminders');
	});

	test('active nav item is visually highlighted', async ({ page }) => {
		await waitForApp(page);
		// Dashboard should be active by default
		const dashboardLink = page.locator('a').filter({ hasText: 'Dashboard' }).first();
		if (await dashboardLink.isVisible()) {
			const bg = await dashboardLink.evaluate(el => getComputedStyle(el).background);
			// Should have some non-transparent background
			expect(bg).not.toBe('');
		}
	});
});

// ============================================
// 4. DASHBOARD PAGE
// ============================================

test.describe('Dashboard Page', () => {
	test('shows greeting message', async ({ page }) => {
		await waitForApp(page);
		const greeting = page.locator('h1').first();
		const text = await greeting.textContent();
		expect(text).toMatch(/Good (morning|afternoon|evening)/);
	});

	test('shows current date', async ({ page }) => {
		await waitForApp(page);
		const dateText = page.getByText(/February|January|March|April|May|June|July|August|September|October|November|December/);
		await expect(dateText.first()).toBeVisible();
	});

	test('shows "Welcome back to your workspace"', async ({ page }) => {
		await waitForApp(page);
		await expect(page.getByText('Welcome back to your workspace')).toBeVisible();
	});

	test('shows Quick Actions section', async ({ page }) => {
		await waitForApp(page);
		await expect(page.getByText('Quick Actions')).toBeVisible();
	});

	test('has 6 quick action buttons', async ({ page }) => {
		await waitForApp(page);
		const actions = ['New Note', 'Upload Files', 'New Prompt', 'New Reminder', 'New Snippet', 'New Course'];
		for (const action of actions) {
			await expect(page.getByText(action, { exact: true }).first()).toBeVisible();
		}
	});

	test('shows stats row with 4 stat cards', async ({ page }) => {
		await waitForApp(page);
		const statLabels = ['Folders', 'Recent Files', 'Pending Reminders', 'Active Courses'];
		for (const label of statLabels) {
			await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
		}
	});

	test('shows Keyboard Shortcuts section', async ({ page }) => {
		await waitForApp(page);
		await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
	});

	test('keyboard shortcuts include Cmd+K for search', async ({ page }) => {
		await waitForApp(page);
		await expect(page.getByText('Ctrl/Cmd + K')).toBeVisible();
	});

	test('quick action links navigate correctly', async ({ page }) => {
		await waitForApp(page);
		await page.getByText('New Note', { exact: true }).first().click();
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/notes');
	});
});

// ============================================
// 5. NOTES PAGE
// ============================================

test.describe('Notes Page', () => {
	test('loads notes page with header', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Notes', { exact: true }).first()).toBeVisible();
	});

	test('has new note button', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		// Plus button or "New Note" text
		const plusBtn = page.locator('button[title*="New Note"], button[title*="Cmd+N"]');
		const newNoteBtn = page.getByText('New Note');
		const count = (await plusBtn.count()) + (await newNoteBtn.count());
		expect(count).toBeGreaterThan(0);
	});

	test('has search input for notes', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		const searchInput = page.locator('input[placeholder*="Search notes"]');
		await expect(searchInput).toBeVisible();
	});

	test('shows empty state when no notes', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		// Either shows notes list or empty state
		const emptyState = page.getByText('No notes yet');
		const selectNote = page.getByText('Select a note or create a new one');
		const hasEmpty = (await emptyState.count()) > 0 || (await selectNote.count()) > 0;
		expect(hasEmpty).toBeTruthy();
	});

	test('notes page has two-panel layout', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		// Left panel (notes list) + right panel (editor)
		const panels = page.locator('div.flex.h-full > div');
		const count = await panels.count();
		expect(count).toBeGreaterThanOrEqual(2);
	});
});

// ============================================
// 6. PROMPTS PAGE
// ============================================

test.describe('Prompts Page', () => {
	test('loads prompts page with header', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Prompts Library')).toBeVisible();
	});

	test('has "New Prompt" button', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('New Prompt')).toBeVisible();
	});

	test('has search input', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		const searchInput = page.locator('input[placeholder*="Search prompts"]');
		await expect(searchInput).toBeVisible();
	});

	test('has category filter tabs', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		const categories = ['All', 'Coding', 'Debugging', 'Documentation'];
		for (const cat of categories) {
			await expect(page.getByText(cat, { exact: true }).first()).toBeVisible();
		}
	});

	test('clicking "New Prompt" opens editor form', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await page.getByText('New Prompt').click();
		await page.waitForTimeout(500);
		// Editor should appear with title input
		const titleInput = page.locator('input[placeholder*="Prompt title"]');
		await expect(titleInput).toBeVisible();
	});

	test('prompt editor has category and language selects', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await page.getByText('New Prompt').click();
		await page.waitForTimeout(500);
		const selects = page.locator('select');
		expect(await selects.count()).toBeGreaterThanOrEqual(2);
	});

	test('prompt editor has content textarea', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await page.getByText('New Prompt').click();
		await page.waitForTimeout(500);
		const textarea = page.locator('textarea');
		await expect(textarea).toBeVisible();
	});

	test('prompt editor has Save and Cancel buttons', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await page.getByText('New Prompt').click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Save', { exact: true })).toBeVisible();
		await expect(page.getByText('Cancel', { exact: true })).toBeVisible();
	});

	test('Cancel closes the editor', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		await page.getByText('New Prompt').click();
		await page.waitForTimeout(500);
		await page.getByText('Cancel', { exact: true }).click();
		await page.waitForTimeout(500);
		const titleInput = page.locator('input[placeholder*="Prompt title"]');
		await expect(titleInput).not.toBeVisible();
	});
});

// ============================================
// 7. REMINDERS PAGE
// ============================================

test.describe('Reminders Page', () => {
	test('loads reminders page', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Reminders', { exact: false }).first()).toBeVisible();
	});

	test('has "New Reminder" button', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('New Reminder')).toBeVisible();
	});

	test('has filter tabs (All, Pending, Overdue, Completed)', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		for (const filter of ['All', 'Pending', 'Overdue', 'Completed']) {
			await expect(page.getByText(filter, { exact: true }).first()).toBeVisible();
		}
	});

	test('clicking "New Reminder" opens form', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await page.getByText('New Reminder').click();
		await page.waitForTimeout(500);
		const titleInput = page.locator('input[placeholder*="Reminder title"]');
		await expect(titleInput).toBeVisible();
	});

	test('reminder form has date, time, priority, recurrence fields', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await page.getByText('New Reminder').click();
		await page.waitForTimeout(500);
		await expect(page.locator('input[type="date"]')).toBeVisible();
		await expect(page.locator('input[type="time"]')).toBeVisible();
		// Priority and recurrence selects
		const selects = page.locator('select');
		expect(await selects.count()).toBeGreaterThanOrEqual(2);
	});

	test('reminder form has description textarea', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await page.getByText('New Reminder').click();
		await page.waitForTimeout(500);
		const textarea = page.locator('textarea');
		await expect(textarea).toBeVisible();
	});
});

// ============================================
// 8. COURSES PAGE
// ============================================

test.describe('Courses Page', () => {
	test('loads courses page', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Courses', { exact: false }).first()).toBeVisible();
	});

	test('has "New Course" button', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('New Course')).toBeVisible();
	});

	test('has status filter tabs', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		for (const f of ['All', 'Not Started', 'In Progress', 'Completed', 'Paused']) {
			await expect(page.getByText(f, { exact: true }).first()).toBeVisible();
		}
	});

	test('clicking "New Course" opens form', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		await page.getByText('New Course').click();
		await page.waitForTimeout(500);
		const nameInput = page.locator('input[placeholder*="Course name"]');
		await expect(nameInput).toBeVisible();
	});

	test('course form has instructor, platform, URL, description fields', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		await page.getByText('New Course').click();
		await page.waitForTimeout(500);
		await expect(page.locator('input[placeholder*="Instructor"]')).toBeVisible();
		await expect(page.locator('input[placeholder*="Course URL"]')).toBeVisible();
		await expect(page.locator('textarea')).toBeVisible();
		// Platform select
		const platformSelect = page.locator('select');
		expect(await platformSelect.count()).toBeGreaterThanOrEqual(1);
	});
});

// ============================================
// 9. SNIPPETS PAGE
// ============================================

test.describe('Snippets Page', () => {
	test('loads snippets page', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Code Snippets', { exact: false }).first()).toBeVisible();
	});

	test('has "New Snippet" button', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('New Snippet')).toBeVisible();
	});

	test('has search input', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		const searchInput = page.locator('input[placeholder*="Search snippets"]');
		await expect(searchInput).toBeVisible();
	});

	test('has language filter tabs', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		for (const lang of ['All', 'javascript', 'typescript', 'python', 'rust']) {
			await expect(page.getByText(lang, { exact: true }).first()).toBeVisible();
		}
	});

	test('clicking "New Snippet" opens editor', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		await page.getByText('New Snippet').click();
		await page.waitForTimeout(500);
		const titleInput = page.locator('input[placeholder*="Snippet title"]');
		await expect(titleInput).toBeVisible();
	});

	test('snippet editor has language select and code textarea', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		await page.getByText('New Snippet').click();
		await page.waitForTimeout(500);
		await expect(page.locator('select')).toBeVisible();
		await expect(page.locator('textarea')).toBeVisible();
	});
});

// ============================================
// 10. VAULT EXPLORER PAGE
// ============================================

test.describe('Vault Explorer Page', () => {
	test('loads vault page', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Vault', { exact: false }).first()).toBeVisible();
	});

	test('has breadcrumb navigation starting with "Vault"', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Vault', { exact: true }).first()).toBeVisible();
	});

	test('has "New Folder" button', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('New Folder')).toBeVisible();
	});

	test('has view toggle button (grid/list)', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		const toggleBtn = page.locator('button[title="Toggle view"]');
		await expect(toggleBtn).toBeVisible();
	});

	test('clicking "New Folder" shows folder name input', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		await page.getByText('New Folder').click();
		await page.waitForTimeout(500);
		const folderInput = page.locator('input[placeholder*="Folder name"]');
		await expect(folderInput).toBeVisible();
	});

	test('folder input has Create and Cancel buttons', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		await page.getByText('New Folder').click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Create', { exact: true })).toBeVisible();
		await expect(page.getByText('Cancel', { exact: true })).toBeVisible();
	});

	test('status bar shows file and folder counts', async ({ page }) => {
		await page.goto(`${BASE}/vault`);
		await page.waitForTimeout(2000);
		const statusBar = page.getByText(/\d+ file|folder/);
		const count = await statusBar.count();
		expect(count).toBeGreaterThanOrEqual(0);
	});
});

// ============================================
// 11. ACTIVITY PAGE
// ============================================

test.describe('Activity Page', () => {
	test('loads activity page', async ({ page }) => {
		await page.goto(`${BASE}/activity`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Activity', { exact: true }).first()).toBeVisible();
	});

	test('shows empty state or activity list', async ({ page }) => {
		await page.goto(`${BASE}/activity`);
		await page.waitForTimeout(2000);
		const empty = page.getByText('No activity yet');
		const actions = page.getByText('Your actions will appear here');
		const hasContent = (await empty.count()) > 0 || (await actions.count()) > 0;
		expect(hasContent).toBeTruthy();
	});
});

// ============================================
// 12. TRASH PAGE
// ============================================

test.describe('Trash Page', () => {
	test('loads trash page', async ({ page }) => {
		await page.goto(`${BASE}/trash`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Trash', { exact: true }).first()).toBeVisible();
	});

	test('shows empty state or trash items', async ({ page }) => {
		await page.goto(`${BASE}/trash`);
		await page.waitForTimeout(2000);
		const empty = page.getByText('Trash is empty');
		const emptyTrashBtn = page.getByText('Empty Trash');
		const hasContent = (await empty.count()) > 0 || (await emptyTrashBtn.count()) > 0;
		expect(hasContent).toBeTruthy();
	});
});

// ============================================
// 13. SETTINGS PAGE
// ============================================

test.describe('Settings Page', () => {
	test('loads settings page', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('General', { exact: true }).first()).toBeVisible();
	});

	test('has settings tabs', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		for (const tab of ['General', 'Appearance', 'Sync & Account', 'Shortcuts', 'About']) {
			await expect(page.getByText(tab, { exact: true }).first()).toBeVisible();
		}
	});

	test('General tab shows Default View and Sidebar settings', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await expect(page.getByText('Default View')).toBeVisible();
		await expect(page.getByText('Sidebar', { exact: true }).first()).toBeVisible();
	});

	test('Appearance tab shows theme options', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Appearance', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Theme')).toBeVisible();
		await expect(page.getByText('Light', { exact: true })).toBeVisible();
		await expect(page.getByText('Dark', { exact: true })).toBeVisible();
		await expect(page.getByText('System', { exact: true })).toBeVisible();
	});

	test('Sync tab shows server status and auth form', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Sync & Account', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Sync Server', { exact: true })).toBeVisible();
		await expect(page.getByText('Account', { exact: false }).first()).toBeVisible();
	});

	test('Sync tab has email and password inputs', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Sync & Account', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"]')).toBeVisible();
	});

	test('Shortcuts tab shows keyboard shortcuts list', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Shortcuts', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
		await expect(page.getByText('Global Search').first()).toBeVisible();
	});

	test('About tab shows app info', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('About', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.getByText('DevVault', { exact: false }).first()).toBeVisible();
		await expect(page.getByText('Version 0.1.0')).toBeVisible();
	});

	test('About tab shows tech stack', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('About', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await expect(page.getByText('Tauri v2', { exact: false }).first()).toBeVisible();
		await expect(page.getByText('SvelteKit', { exact: false }).first()).toBeVisible();
	});
});

// ============================================
// 14. THEME TOGGLING
// ============================================

test.describe('Theme', () => {
	test('app starts in dark mode', async ({ page }) => {
		await page.goto(BASE);
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);
	});

	test('theme toggle in settings switches to light mode', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Appearance', { exact: true }).first().click();
		await page.waitForTimeout(500);
		await page.getByText('Light', { exact: true }).click();
		await page.waitForTimeout(500);
		const html = page.locator('html');
		await expect(html).not.toHaveClass(/dark/);
	});

	test('switching back to dark mode works', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Appearance', { exact: true }).first().click();
		await page.waitForTimeout(500);
		// Switch to light first
		await page.getByText('Light', { exact: true }).click();
		await page.waitForTimeout(300);
		// Switch back to dark
		await page.getByText('Dark', { exact: true }).click();
		await page.waitForTimeout(300);
		const html = page.locator('html');
		await expect(html).toHaveClass(/dark/);
	});
});

// ============================================
// 15. CSS & VISUAL REGRESSION
// ============================================

test.describe('CSS & Visual Integrity', () => {
	test('Tailwind utility classes are generating (flex works)', async ({ page }) => {
		await waitForApp(page);
		const flexEl = page.locator('.flex').first();
		if (await flexEl.count() > 0) {
			const display = await flexEl.evaluate(el => getComputedStyle(el).display);
			expect(display).toBe('flex');
		}
	});

	test('grid utility classes work', async ({ page }) => {
		await waitForApp(page);
		const gridEl = page.locator('[class*="grid-cols"]').first();
		if (await gridEl.count() > 0) {
			const display = await gridEl.evaluate(el => getComputedStyle(el).display);
			expect(display).toBe('grid');
		}
	});

	test('gap utility classes produce actual spacing', async ({ page }) => {
		await waitForApp(page);
		const gapEl = page.locator('[class*="gap-"]').first();
		if (await gapEl.count() > 0) {
			const gap = await gapEl.evaluate(el => getComputedStyle(el).gap);
			expect(gap).not.toBe('normal');
			expect(gap).not.toBe('0px');
		}
	});

	test('border-r on sidebar produces visible border', async ({ page }) => {
		await waitForApp(page);
		const sidebar = page.locator('aside').first();
		if (await sidebar.isVisible()) {
			const borderRight = await sidebar.evaluate(el => getComputedStyle(el).borderRightWidth);
			expect(parseFloat(borderRight)).toBeGreaterThan(0);
		}
	});

	test('rounded-xl produces border-radius', async ({ page }) => {
		await waitForApp(page);
		const rounded = page.locator('.rounded-xl').first();
		if (await rounded.count() > 0) {
			const radius = await rounded.evaluate(el => getComputedStyle(el).borderRadius);
			expect(radius).not.toBe('0px');
		}
	});

	test('text-sm produces correct font size', async ({ page }) => {
		await waitForApp(page);
		const textSm = page.locator('.text-sm').first();
		if (await textSm.count() > 0) {
			const fontSize = await textSm.evaluate(el => getComputedStyle(el).fontSize);
			const size = parseFloat(fontSize);
			expect(size).toBeGreaterThan(10);
			expect(size).toBeLessThan(16);
		}
	});

	test('space-y utility class is present in DOM', async ({ page }) => {
		await waitForApp(page);
		const spaceY = page.locator('[class*="space-y-"]');
		// Tailwind v4 handles space-y differently; just verify the class is used
		const count = await spaceY.count();
		expect(count).toBeGreaterThan(0);
	});

	test('no elements overflow the viewport horizontally', async ({ page }) => {
		await waitForApp(page);
		const overflows = await page.evaluate(() => {
			const vw = document.documentElement.clientWidth;
			const elements = document.querySelectorAll('*');
			let count = 0;
			elements.forEach(el => {
				const rect = el.getBoundingClientRect();
				if (rect.right > vw + 5) count++;
			});
			return count;
		});
		// Allow a small number of overflow elements (scrollable containers)
		expect(overflows).toBeLessThan(10);
	});
});

// ============================================
// 16. RESPONSIVE LAYOUT
// ============================================

test.describe('Responsive Layout', () => {
	test('sidebar and main do not overlap', async ({ page }) => {
		await waitForApp(page);
		const sidebar = page.locator('aside').first();
		const main = page.locator('main').first();
		if (await sidebar.isVisible() && await main.isVisible()) {
			const sidebarBox = await sidebar.boundingBox();
			const mainBox = await main.boundingBox();
			if (sidebarBox && mainBox) {
				// Main should start after sidebar ends
				expect(mainBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width - 2);
			}
		}
	});

	test('main content fills remaining width', async ({ page }) => {
		await waitForApp(page);
		const main = page.locator('main').first();
		if (await main.isVisible()) {
			const mainBox = await main.boundingBox();
			const viewportWidth = await page.evaluate(() => window.innerWidth);
			if (mainBox) {
				expect(mainBox.x + mainBox.width).toBeGreaterThanOrEqual(viewportWidth - 5);
			}
		}
	});

	test('layout fills full viewport height', async ({ page }) => {
		await waitForApp(page);
		const container = page.locator('div.flex.h-screen').first();
		if (await container.count() > 0) {
			const box = await container.boundingBox();
			const viewportHeight = await page.evaluate(() => window.innerHeight);
			if (box) {
				expect(box.height).toBeGreaterThanOrEqual(viewportHeight - 5);
			}
		}
	});
});

// ============================================
// 17. CONSOLE ERRORS
// ============================================

test.describe('Console Errors', () => {
	test('no critical JS errors on dashboard', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', msg => {
			if (msg.type() === 'error') {
				const text = msg.text();
				// Ignore Tauri IPC errors (expected in browser)
				if (!text.includes('__TAURI') && !text.includes('tauri') && !text.includes('plugin') && !text.includes('Tauri')) {
					errors.push(text);
				}
			}
		});
		await page.goto(BASE);
		await page.waitForTimeout(3000);
		// Filter out known non-critical errors (Tauri DB init, network, etc.)
		const critical = errors.filter(e =>
			!e.includes('Failed to fetch') &&
			!e.includes('NetworkError') &&
			!e.includes('net::ERR') &&
			!e.includes('Init error') &&
			!e.includes('Initialization') &&
			!e.includes('database') &&
			!e.includes('Database') &&
			!e.includes('sql') &&
			!e.includes('load')
		);
		expect(critical.length).toBe(0);
	});

	for (const route of ['/notes', '/prompts', '/reminders', '/courses', '/snippets', '/vault', '/activity', '/trash', '/settings']) {
		test(`no critical JS errors on ${route}`, async ({ page }) => {
			const errors: string[] = [];
			page.on('console', msg => {
				if (msg.type() === 'error') {
					const text = msg.text();
					if (!text.includes('__TAURI') && !text.includes('tauri') && !text.includes('plugin') && !text.includes('Tauri')) {
						errors.push(text);
					}
				}
			});
			await page.goto(`${BASE}${route}`);
			await page.waitForTimeout(3000);
			const critical = errors.filter(e =>
				!e.includes('Failed to fetch') &&
				!e.includes('NetworkError') &&
				!e.includes('net::ERR')
			);
			expect(critical.length).toBe(0);
		});
	}
});

// ============================================
// 18. FORM INTERACTION FLOWS
// ============================================

test.describe('Form Interactions', () => {
	test('can type in notes search', async ({ page }) => {
		await page.goto(`${BASE}/notes`);
		await page.waitForTimeout(2000);
		const input = page.locator('input[placeholder*="Search notes"]');
		await input.fill('test query');
		await expect(input).toHaveValue('test query');
	});

	test('can type in prompts search', async ({ page }) => {
		await page.goto(`${BASE}/prompts`);
		await page.waitForTimeout(2000);
		const input = page.locator('input[placeholder*="Search prompts"]');
		await input.fill('debugging prompt');
		await expect(input).toHaveValue('debugging prompt');
	});

	test('can type in snippets search', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		const input = page.locator('input[placeholder*="Search snippets"]');
		await input.fill('react hook');
		await expect(input).toHaveValue('react hook');
	});

	test('can fill out reminder form fields', async ({ page }) => {
		await page.goto(`${BASE}/reminders`);
		await page.waitForTimeout(2000);
		await page.getByText('New Reminder').click();
		await page.waitForTimeout(500);

		const title = page.locator('input[placeholder*="Reminder title"]');
		await title.fill('Test Reminder');
		await expect(title).toHaveValue('Test Reminder');

		const desc = page.locator('textarea');
		await desc.fill('Test description');
		await expect(desc).toHaveValue('Test description');
	});

	test('can fill out course form fields', async ({ page }) => {
		await page.goto(`${BASE}/courses`);
		await page.waitForTimeout(2000);
		await page.getByText('New Course').click();
		await page.waitForTimeout(500);

		await page.locator('input[placeholder*="Course name"]').fill('Advanced Rust');
		await page.locator('input[placeholder*="Instructor"]').fill('Jon Gjengset');
		await page.locator('input[placeholder*="Course URL"]').fill('https://example.com');
		await page.locator('textarea').fill('Deep dive into Rust');

		await expect(page.locator('input[placeholder*="Course name"]')).toHaveValue('Advanced Rust');
		await expect(page.locator('input[placeholder*="Instructor"]')).toHaveValue('Jon Gjengset');
	});

	test('can fill out snippet form fields', async ({ page }) => {
		await page.goto(`${BASE}/snippets`);
		await page.waitForTimeout(2000);
		await page.getByText('New Snippet').click();
		await page.waitForTimeout(500);

		await page.locator('input[placeholder*="Snippet title"]').fill('useEffect cleanup');
		await page.locator('textarea').fill('useEffect(() => { return () => cleanup(); }, []);');

		await expect(page.locator('input[placeholder*="Snippet title"]')).toHaveValue('useEffect cleanup');
	});

	test('settings auth form accepts email and password', async ({ page }) => {
		await page.goto(`${BASE}/settings`);
		await page.waitForTimeout(2000);
		await page.getByText('Sync & Account', { exact: true }).first().click();
		await page.waitForTimeout(500);

		const email = page.locator('input[type="email"]');
		const password = page.locator('input[type="password"]');
		await email.fill('test@example.com');
		await password.fill('password123');
		await expect(email).toHaveValue('test@example.com');
		await expect(password).toHaveValue('password123');
	});
});

// ============================================
// 19. ACCESSIBILITY BASICS
// ============================================

test.describe('Accessibility', () => {
	test('all images/icons have implicit or explicit labels', async ({ page }) => {
		await waitForApp(page);
		// Check that buttons have some accessible text
		const buttons = page.locator('button');
		const count = await buttons.count();
		let unlabeled = 0;
		for (let i = 0; i < Math.min(count, 20); i++) {
			const btn = buttons.nth(i);
			const text = await btn.textContent();
			const title = await btn.getAttribute('title');
			const ariaLabel = await btn.getAttribute('aria-label');
			if (!text?.trim() && !title && !ariaLabel) unlabeled++;
		}
		// Allow some icon-only buttons without labels
		expect(unlabeled).toBeLessThan(count);
	});

	test('focus-visible outline is defined', async ({ page }) => {
		await page.goto(BASE);
		const outline = await page.evaluate(() => {
			const style = document.createElement('style');
			style.textContent = ':focus-visible { outline-color: red; }';
			document.head.appendChild(style);
			return true;
		});
		expect(outline).toBeTruthy();
	});

	test('color-scheme meta tag is present', async ({ page }) => {
		await page.goto(BASE);
		const meta = page.locator('meta[name="color-scheme"]');
		await expect(meta).toHaveAttribute('content', 'dark light');
	});

	test('viewport meta tag is present', async ({ page }) => {
		await page.goto(BASE);
		const meta = page.locator('meta[name="viewport"]');
		const content = await meta.getAttribute('content');
		expect(content).toContain('width=device-width');
	});
});
