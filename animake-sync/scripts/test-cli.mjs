// Supports exactly two subcommands:
//   pnpm test run
//   pnpm test save <test-name> [after:<a>] [after:<b>] ...
//
// Chain behavior (using forked Playwright with native dependency support):
// - Executes the listed `after:` tests LEFT→RIGHT in the SAME browser session,
//   then launches codegen continuing from the exact final state.
// - Requires that every recorded test file exports:  export async function run_<name>(page) { ... }
//   (This CLI auto-wraps freshly recorded files into that template.)
// - No storage state serialization - true session continuity!

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();
const TESTS_DIR = path.join(ROOT, 'tests');
const E2E_DIR = path.join(TESTS_DIR, 'e2e');
const ARTI_CUR = path.join(TESTS_DIR, '.artifacts', 'current');
const ARTI_RUNS = path.join(TESTS_DIR, '.artifacts', 'runs');
const ARTI_TMP  = path.join(TESTS_DIR, '.artifacts', 'tmp');
const ENV_FILE  = path.join(TESTS_DIR, '.env.test');
const CONFIG_TS = path.join(TESTS_DIR, 'playwright.config.ts');

function ensureDirs() {
  fs.mkdirSync(E2E_DIR, { recursive: true });
  fs.mkdirSync(ARTI_CUR, { recursive: true });
  fs.mkdirSync(ARTI_RUNS, { recursive: true });
  fs.mkdirSync(ARTI_TMP,  { recursive: true });
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const lines = fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/.exec(line);
    if (m) {
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function getLocalPlaywright() {
  const isWin = process.platform === 'win32';
  return path.join('node_modules', '.bin', isWin ? 'playwright.cmd' : 'playwright');
}

function getGlobalPlaywright() {
  // Get the npm prefix to find our globally linked playwright
  const result = spawnSync('npm', ['config', 'get', 'prefix'], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error('Could not find npm prefix');
  }
  const prefix = result.stdout.trim();
  return path.join(prefix, 'bin', 'playwright');
}

function run(cmd, args, env = process.env) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env });
  return res.status ?? 1;
}

function runQuiet(cmd, args, env = process.env) {
  const res = spawnSync(cmd, args, { stdio: 'pipe', env });
  return res.status ?? 1;
}

function buildPlaywrightArgs(baseArgs, headed = false) {
  const args = [...baseArgs];
  if (headed) {
    args.push('--headed');
  }
  return args;
}

function rotateArtifactsFolder() {
  // Move current → runs/<timestamp>, keep last 10
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest  = path.join(ARTI_RUNS, stamp);
  if (fs.existsSync(ARTI_CUR)) {
    fs.renameSync(ARTI_CUR, dest);
    fs.mkdirSync(ARTI_CUR, { recursive: true });
  }
  const runs = fs.readdirSync(ARTI_RUNS).sort();
  const toDelete = runs.slice(0, Math.max(0, runs.length - 10));
  for (const d of toDelete) fs.rmSync(path.join(ARTI_RUNS, d), { recursive: true, force: true });
  console.log(`Artifacts saved to ${dest}. Pruned ${toDelete.length} old runs.`);
}

function sanitizeBase(name) {
  return name.trim().replace(/[^\w.-]/g, '-').replace(/\.spec\.ts$/i, '');
}
function importId(name) {
  return sanitizeBase(name).replace(/[^A-Za-z0-9_]/g, '_');
}

function extractStepsFromRecorded(file) {
  const src = fs.readFileSync(file, 'utf8');
  const helperMatch = src.match(/\/\/ <animake-helpers>[\s\S]*?\/\/ <\/animake-helpers>/);
  const helperBlock = helperMatch ? helperMatch[0].trim() : '';
  const bodyMatch = src.match(/async\s*\(\{\s*page\s*\}\)\s*=>\s*\{([\s\S]*?)\}\s*\)\s*;?\s*$/m);
  if (!bodyMatch) return null;
  const steps = bodyMatch[1].trim();
  return { steps, helperBlock };
}

function wrapAsChainable(outFile, displayName, stepsBody, dependencies = []) {
  const id = importId(displayName);
  
  // Generate imports and setup for dependencies
  let dependencyImports = '';
  let dependencySetup = '';
  
  if (dependencies.length > 0) {
    const imports = [];
    const setupCalls = [];
    const seenDeps = new Set(); // Track unique dependencies
    
    for (const dep of dependencies) {
      const depBase = sanitizeBase(dep);
      const depId = importId(depBase);
      
      // Only add import if we haven't seen this dependency before
      if (!seenDeps.has(depBase)) {
        const depPath = `./${depBase}.spec`;  // Import from .spec file
        imports.push(`import { run_${depId} } from '${depPath}';`);
        seenDeps.add(depBase);
      }
      
      // Always add setup call (even for duplicates) to maintain execution order
      setupCalls.push(`  await run_${depId}(page);`);
    }
    
    dependencyImports = imports.join('\n') + '\n';
    dependencySetup = `
// This test depends on: ${dependencies.join(', ')}
test('${displayName} (with dependencies)', async ({ page }) => {
${setupCalls.join('\n')}
  await run_${id}(page);
});
`;
  }
  
  const content = `import { test, expect } from '@playwright/test';
${dependencyImports}
export async function run_${id}(page) {
${stepsBody.split('\n').map(l => '  ' + l).join('\n')}
}

test('${displayName}', async ({ page }) => {
  await run_${id}(page);
});
${dependencySetup}`;
  
  // Write only the main spec file
  fs.writeFileSync(outFile, content, 'utf8');
}

function parseArgs() {
  // supports: pnpm test run
  //           pnpm test save <name> [after:foo] [after:bar]
  //           pnpm test run <name> [headed]
  const raw = process.argv.slice(2);
  const cmd = (raw[0] || '').toLowerCase();
  const name = raw[1] || '';
  const after = raw.filter(t => /^after:/.test(t)).map(t => t.replace(/^after:/, ''));
  const headed = raw.includes('headed');
  return { cmd, name, after, headed };
}

// -------------------- MAIN --------------------
ensureDirs();
loadEnvFile();

const { cmd, name, after, headed } = parseArgs();

if (cmd === 'run') {
  // fresh current
  fs.rmSync(ARTI_CUR, { recursive: true, force: true });
  fs.mkdirSync(ARTI_CUR, { recursive: true });

  // Check if there are any test files
  const testFiles = fs.readdirSync(E2E_DIR).filter(f => f.endsWith('.spec.ts'));
  if (testFiles.length === 0) {
    console.log('No test files found. All tests passed! ✅');
    rotateArtifactsFolder();
    process.exit(0);
  }

  // Set flag to enable test registration when running via Playwright
  process.env.PLAYWRIGHT_DIRECT_RUN = 'true';
  
  // Always prefer dependency versions when tests have them
  
  if (name === 'all') {
    // For "all": run the best version of each test
    // Dynamically determine which tests have dependency versions
    
    const testFiles = fs.readdirSync(E2E_DIR).filter(f => f.endsWith('.spec.ts'));
    const standaloneTests = [];
    
    // Scan test files to find standalone tests that don't have dependency versions
    for (const file of testFiles) {
      const filePath = path.join(E2E_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check if this file has dependency tests
      const hasDependencyVersion = content.includes('(with dependencies)');
      
      if (!hasDependencyVersion) {
        // This is a standalone-only test file, extract test names
        const testMatches = content.match(/test\(['"]([^'"]+)['"]/g);
        if (testMatches) {
          for (const match of testMatches) {
            const testName = match.match(/test\(['"]([^'"]+)['"]/)[1];
            standaloneTests.push(testName);
          }
        }
      }
    }
    
    // Build pattern: dependency tests OR specific standalone tests that don't have dependency versions
    let pattern;
    if (standaloneTests.length > 0) {
      const standalonePattern = standaloneTests.join('|');
      pattern = `with dependencies|${standalonePattern}`;
    } else {
      // Only dependency tests exist
      pattern = 'with dependencies';
    }
    
    let args = buildPlaywrightArgs(['test', '-c', CONFIG_TS, '--grep', pattern], headed);
    let status = run(getLocalPlaywright(), args);
    
    rotateArtifactsFolder();
    process.exit(status);
  } else if (name) {
    // For specific test: try dependency version first, fallback to standalone
    // Use exact match to ensure test name isolation
    let grepPattern = `${name} \\(with dependencies\\)`;
    let args = buildPlaywrightArgs(['test', '-c', CONFIG_TS, '--grep', grepPattern], headed);
    let status = runQuiet(getLocalPlaywright(), args);
    
    // If no dependency version found, try standalone
    if (status !== 0) {
      args = buildPlaywrightArgs(['test', '-c', CONFIG_TS, '--grep', `${name}$`], headed);
      status = run(getLocalPlaywright(), args);
    } else {
      // If dependency version found, run it with full output
      status = run(getLocalPlaywright(), args);
    }
    
    rotateArtifactsFolder();
    process.exit(status);
  } else {
    // For no args: show help message requiring test name or "all"
    console.log(`
❌ Please specify a test name or "all"

Usage:
  pnpm test run all [headed]          # Run best version of each test
  pnpm test run <test-name> [headed]  # Run specific test (prefers dependency version)

Examples:
  pnpm test run all
  pnpm test run all headed
  pnpm test run test-login
  pnpm test run stress-test headed
`);
    process.exit(1);
  }
}

if (cmd === 'save') {
  if (!name) {
    console.error('Usage: pnpm test save <test-name> [after:<a>] [after:<b>] ...');
    process.exit(1);
  }

  const base = sanitizeBase(name);
  const outSpec = path.join(E2E_DIR, `${base}.spec.ts`);
  
  // Build codegen args for the forked Playwright
  const cgArgs = ['codegen'];
  
  // Add dependencies if any using the new --after flag
  if (after.length) {
    const depPaths = after.map(dep => 
      path.join(E2E_DIR, `${sanitizeBase(dep)}.spec.ts`)
    );
    cgArgs.push('--after', ...depPaths);
  }
  
  // Add target, output, and URL
  const startUrl = process.env.TEST_BASE_URL || 'http://localhost:5173';
  cgArgs.push('--target', 'playwright-test', '-o', outSpec);
  
  // Only add URL if no dependencies (dependencies will determine the final URL)
  if (after.length === 0) {
    cgArgs.push(startUrl);
  }
  
  console.log(`🎬 Starting codegen for "${base}"...`);
  if (after.length) {
    console.log(`📋 Will run dependencies first: ${after.join(' → ')}`);
  }
  
  // Use the local playwright with dependency chaining
  const playwrightPath = getLocalPlaywright();
  const statusCodegen = run(playwrightPath, cgArgs);
  
  if (statusCodegen !== 0) {
    process.exit(statusCodegen);
  }
  
  // Transform recorded file into chainable template exporting run_<name>(page)
  const extracted = extractStepsFromRecorded(outSpec);
  if (extracted) {
    let { steps, helperBlock } = extracted;
    if (helperBlock && !steps.includes(helperBlock)) {
      steps = helperBlock + '\n' + steps;
    }
    // Preserve Animake helper block if present in original recorded file (outside test body)
    wrapAsChainable(outSpec, base, steps, after);
    console.log(`✅ Saved & wrapped: ${path.relative(ROOT, outSpec)}  (export: run_${importId(base)}(page))`);
  } else {
    console.warn('⚠️ Could not parse recorded file; leaving as-is. Chaining may not work until you wrap it manually.');
  }

  process.exit(0);
}

// Help
console.log(`
Usage:
  pnpm test run <test-name|all> [headed]
  pnpm test save <test-name> [after:<a>] [after:<b>] ...

Notes:
  • Start your dev server separately if your app needs it (this does not start it).
  • "after:" chains execute LEFT→RIGHT in ONE browser/page before recording.
  • New recordings are wrapped so they can be imported and chained later via run_<name>(page).
  • Test run behavior:
    - "pnpm test run all" runs best version of each test (deps when available, standalone otherwise)
    - "pnpm test run <name>" prefers dependency version, falls back to standalone
    - Add "headed" to run tests in headed mode (visible browser windows)
  • Artifacts live under tests/.artifacts/{current,runs,tmp}/
`);
process.exit(0);
