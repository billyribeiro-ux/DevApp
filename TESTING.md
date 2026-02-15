# DevVault Testing Guide

## Overview
This document describes how to run tests and seed the database for DevVault.

## Seed Data

### Using Seed Data
To populate the database with sample data for testing:

```typescript
import { seedDatabase, clearDatabase } from '$lib/services/seed';

// Seed the database
await seedDatabase();

// Clear all data (use with caution!)
await clearDatabase();
```

### What Gets Seeded
- **1 Workspace**: "My Workspace"
- **2 Folders**: "General" and "Projects"
- **3 Notes**: Welcome guide and sample notes
- **3 Prompts**: Code review, bug fixing, and documentation templates
- **3 Code Snippets**: React hooks, async/await, and Tailwind examples
- **2 Reminders**: Sample tasks with due dates
- **2 Courses**: React and Node.js courses with progress tracking

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install Playwright browsers (first time only)
pnpm exec playwright install
```

### Run All Tests
```bash
# Run tests in headless mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests in headed mode (see browser)
pnpm exec playwright test --headed

# Run specific test file
pnpm exec playwright test tests/app.spec.ts
```

### Run Tests in Debug Mode
```bash
# Debug mode with Playwright Inspector
pnpm exec playwright test --debug

# Debug specific test
pnpm exec playwright test tests/app.spec.ts --debug
```

### Generate Test Report
```bash
# Run tests and generate HTML report
pnpm exec playwright test --reporter=html

# Open the report
pnpm exec playwright show-report
```

## Test Coverage

The test suite covers:

### ✅ Dashboard
- Display stats cards
- Quick action navigation
- Responsive layout

### ✅ Navigation
- All sidebar links
- Active state highlighting
- Route transitions

### ✅ Notes Feature
- Create new notes
- Edit title and content
- Auto-save functionality
- Search notes
- ESC key to clear search
- Cmd+S to save
- Cmd+N to create new note

### ✅ Prompts Feature
- Create prompts
- Variable detection
- Category filtering
- Template usage

### ✅ Code Snippets
- Create snippets
- Language selection
- Copy to clipboard
- Syntax highlighting

### ✅ Reminders
- Create reminders
- Set due dates and times
- Priority levels
- Status filtering
- Recurrence options

### ✅ Courses
- Create courses
- Track progress
- Update completion
- Platform tracking

### ✅ Vault Explorer
- Folder navigation
- File management
- Create folders

### ✅ Settings
- Theme toggle
- Configuration options

### ✅ Activity Log
- View recent actions
- Activity filtering

### ✅ Trash
- View deleted items
- Restore functionality
- Empty trash

### ✅ Keyboard Shortcuts
- Cmd+N: New note
- Cmd+S: Save note
- ESC: Clear search

### ✅ Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport

## Test Development

### Adding New Tests
```typescript
test('should do something', async ({ page }) => {
  await page.goto('http://localhost:5173/your-route');
  
  // Your test logic
  await expect(page.getByText('Expected Text')).toBeVisible();
});
```

### Best Practices
1. **Use semantic selectors**: Prefer `getByRole`, `getByText`, `getByLabel` over CSS selectors
2. **Wait for elements**: Use `waitForSelector` or `expect().toBeVisible()` instead of fixed timeouts
3. **Test user flows**: Test complete user journeys, not just individual actions
4. **Keep tests isolated**: Each test should be independent and not rely on others
5. **Use descriptive names**: Test names should clearly describe what they're testing

## Continuous Integration

### GitHub Actions
The test suite runs automatically on:
- Every push to main branch
- Every pull request
- Manual workflow dispatch

### Local CI Simulation
```bash
# Run the same checks as CI
pnpm check && pnpm test
```

## Troubleshooting

### Tests Failing Locally
1. **Clear browser cache**: `pnpm exec playwright test --clear-cache`
2. **Update browsers**: `pnpm exec playwright install`
3. **Check dev server**: Ensure `pnpm tauri dev` is running on port 5173

### Flaky Tests
- Add explicit waits: `await page.waitForTimeout(500)`
- Use `waitForLoadState`: `await page.waitForLoadState('networkidle')`
- Increase timeout: `test.setTimeout(60000)`

### Database Issues
- Clear and reseed: `await clearDatabase(); await seedDatabase();`
- Check database file permissions
- Verify Tauri SQL plugin is loaded

## Performance Testing

### Lighthouse CI
```bash
# Run Lighthouse audit
pnpm exec lighthouse http://localhost:5173 --view
```

### Load Testing
```bash
# Run multiple test instances
pnpm exec playwright test --workers=4
```

## Coverage Reports

### Generate Coverage
```bash
# Run tests with coverage
pnpm test:coverage
```

## Notes

- Tests assume the app is running on `http://localhost:5173`
- Some tests may require seed data to be present
- Database state is not automatically reset between tests
- Use `clearDatabase()` and `seedDatabase()` for consistent test state

## Support

For issues or questions:
1. Check test output for detailed error messages
2. Review Playwright documentation: https://playwright.dev
3. Check DevVault issues on GitHub
