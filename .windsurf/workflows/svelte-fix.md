---
description: Fix Svelte code issues using svelte-check and autofixer
---

## Svelte Fix Workflow

This workflow runs svelte-check to identify issues and uses the Svelte autofixer MCP tool to fix them.

### Steps:

1. **Run svelte-check to identify issues**
   ```bash
   pnpm check
   ```

2. **Check for Svelte syntax issues** - Review any errors from svelte-check output

3. **Fix identified issues** - Use the svelte-autofixer MCP tool on files with issues
   - Read problematic Svelte files
   - Call `svelte-autofixer` with the file content
   - Apply suggested fixes

### Common fixes:
- Missing imports
- Invalid Svelte 5 rune usage ($state, $props, $derived, etc.)
- Incorrect event handling syntax
- Missing type annotations
- Invalid component props

// turbo
4. **Re-run check to verify fixes**
   ```bash
   pnpm check
   ```
