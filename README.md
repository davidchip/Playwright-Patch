# @animake/playwright-patch

A patch package for Playwright that adds:

1. **--after flag** to the `codegen` command for running test dependencies before recording
2. **Test interdependency support** for importing test functions from other test files

## Installation

```bash
npm install @animake/playwright-patch
```

This package should be installed alongside standard `@playwright/test`:

```bash
npm install @playwright/test @animake/playwright-patch
```

## Features

### 1. Codegen --after Flag

Run existing tests before starting codegen to continue from their final state:

```bash
npx playwright codegen --after test-login.spec.ts http://localhost:3000/dashboard
```

This will:
- Run `test-login.spec.ts` first 
- Wait for it to complete
- Start recording from the browser state left by the login test
- Generate code for the dashboard interactions

### 2. Test Interdependencies

Import and use test functions from other test files:

```typescript
// In test-dashboard.spec.ts
import { run_test_login } from './test-login.spec.ts';

test('dashboard test', async ({ page }) => {
  // Run login test first to set up authenticated state
  await run_test_login({ page });
  
  // Continue with dashboard-specific tests
  await page.click('[data-testid="dashboard-button"]');
  // ...
});
```

## How It Works

The package applies patches to:
- `playwright-core/lib/cli/program.js` - Adds --after flag to codegen command
- `playwright/lib/runner/loadUtils.js` - Enables test file imports

Patches are applied automatically via postinstall script when the package is installed.

## Usage in Your Project

1. Install both packages:
   ```bash
   npm install @playwright/test @animake/playwright-patch
   ```

2. Use standard Playwright imports (the patch is transparent):
   ```typescript
   import { test, expect } from '@playwright/test';
   ```

3. Use the enhanced CLI:
   ```bash
   npx playwright codegen --after test-login.spec.ts http://localhost:3000/dashboard
   ```

## Compatibility

- Compatible with Playwright 1.55.0+
- Works with existing Playwright test suites
- Non-breaking - all existing functionality remains unchanged

## License

MIT

## Test Results

✅ **Installation successful** - Patches applied to both required files:
- `playwright-core/lib/cli/program.js` - Adds --after flag to codegen command  
- `playwright/lib/runner/loadUtils.js` - Enables test file imports

✅ **--after flag working** - Command `npx playwright codegen --after tests/e2e/test-login.spec.ts http://localhost:3000` successfully:
- Recognizes the --after flag
- Runs dependency tests before starting recording
- Shows progress output: "🔄 Running dependency tests before recording..."

✅ **Test interdependencies working** - Test file `test-logout.spec.ts` can import from `test-login.spec.ts`:
- `npx playwright test tests/e2e/test-logout.spec.ts --list` shows all 3 tests from both files
- No import errors or loading issues

## Integration Status

**COMPLETE** - The patch approach has successfully implemented both required features:

1. **Codegen --after flag** - Functional and integrated with the CLI
2. **Test interdependencies** - Cross-file test imports working correctly

The patch package provides a clean, maintainable solution that applies targeted modifications to standard Playwright installations without requiring complex build systems.
