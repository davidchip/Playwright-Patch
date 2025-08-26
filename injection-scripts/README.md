# Animake Playwright Codegen Injection Scripts

This directory contains the scripts used to inject custom tools into Playwright's codegen functionality.

## Scripts Overview

### Working Scripts (Final Solution)

- **`fix-injection-escaped.js`** - ✅ **THE WORKING SOLUTION**
  - This is the final, working script that properly injects the Animake toolset
  - Includes proper string escaping to avoid syntax errors
  - Injects the full floating panel with 4 tools
  - Usage: `node fix-injection-escaped.js`

### Development Scripts (Historical)

- **`universal-integration.js`** - The original manual tool that works when pasted into console
  - Contains the complete floating panel code
  - Used as the source for the injection scripts

- **`fix-injection-simple.js`** - Simple alert test to verify injection mechanism
  - Used for debugging to confirm addInitScript works
  - Shows just an alert box when working

- **`fix-injection-final.js`** - Early attempt at full toolset injection
  - Had string escaping issues that caused syntax errors

- **`fix-injection-with-tools.js`** - Another attempt at full toolset
  - Also had escaping issues

- **`fix-codegen-injection.js`** - Script that targeted the wrong injection point
  - Was injecting after openPage instead of after launchContext

- **`fix-duplicate-page.js`** - Fixed duplicate const page declarations
  - Cleaned up syntax errors from multiple injections

- **`fix-injection-before-openpage.js`** - Attempted injection before openPage
  - Couldn't find the target regex pattern

- **`inject-into-real-program.js`** - Early debugging script to find the right file path
  - Helped identify the correct program.js location

## How It Works

The injection works by:

1. **Finding the correct file**: `node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js`
2. **Locating the injection point**: Right after `const { context, browser, launchOptions, contextOptions, closeBrowser } = await launchContext(...);`
3. **Injecting via addInitScript**: Using `await context.addInitScript(() => { ... })` to run code in the browser
4. **Creating floating panel**: The injected code creates a draggable panel with 4 tool buttons

## Usage

To apply the Animake tools to your Playwright installation:

```bash
node fix-injection-escaped.js
```

Then run any Playwright codegen command:

```bash
npx playwright codegen google.com
```

You should see a floating "🎭 Animake Codegen" panel in the browser with these tools:
- 📝 Random Text - Generate random text variables
- 🔢 Random Integer - Generate random number variables  
- ✅ Assert Variable - Create assertions with variables
- 🏷️ By Label - Use accessible label selectors

## Technical Details

- **Injection Point**: After `launchContext` call in the `codegen` function
- **Method**: Uses Playwright's own `addInitScript` method
- **Timing**: Script runs before page loads, ensuring tools are available immediately
- **Persistence**: Injection persists until node_modules are updated/reinstalled

## Debugging History

We discovered several important insights during development:

1. **Wrong file targeting**: Initially tried to inject into patch files instead of actual execution files
2. **Wrong injection timing**: Tried injecting after page creation instead of before
3. **String escaping issues**: Template literals and backticks caused syntax errors
4. **Multiple const declarations**: Previous injections left duplicate variables

The final solution addresses all these issues and provides a reliable, automatic injection system.
