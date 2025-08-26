// Animake Playwright Patch: throttledFile transform extraction
// This file mirrors the working transform injected into playwright-core's throttledFile.js
// Use by requiring and applying patchThrottledFile() after Playwright install.

const fs = require('fs');
const path = require('path');

const RELATIVE_TARGET = path.join('playwright-core','lib','server','recorder','throttledFile.js');

function findThrottledFile(startDir = process.cwd()) {
  // Try the direct path first
  const directPath = path.join(startDir, 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/server/recorder/throttledFile.js');
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // Fallback to searching
  const nm = path.join(startDir, 'node_modules');
  const results = [];
  function walk(dir, depth = 0) {
    if (depth > 10) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/playwright-core/.test(e.name) || /\.pnpm/.test(e.name) || e.name === 'node_modules' || depth < 3) {
          walk(full, depth + 1);
        }
      } else if (e.name === 'throttledFile.js' && full.includes('playwright-core') && full.includes('recorder')) {
        results.push(full);
      }
    }
  }
  walk(nm, 0);
  if (!results.length) throw new Error('throttledFile.js not found under node_modules');
  const pnpm = results.find(r => r.includes('.pnpm'));
  return pnpm || results[0];
}

function patchThrottledFile() {
  const file = findThrottledFile();
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('__animakeTransform')) {
    console.log('Animake patch already applied to throttledFile.js');
    return false;
  }
  if (!content.includes('class ThrottledFile')) throw new Error('Unexpected throttledFile.js format');
  const injectBlock = [
    '// ANIMAKE: transformation utilities injected directly into throttledFile so we reliably',
    '// post-process recorder output just before it is written to disk.',
    "const ANIMAKE_HELPER_HEADER = '// <animake-helpers>';",
    'function __animakeTransform(text) {',
    '  try {',
    '    if (!text || text.includes(ANIMAKE_HELPER_HEADER)) return text; // idempotent',
    '    let source = text.toString();',
    "    const randomTextPattern = /(await\\s+[^;]*?\\.fill\\(\\s*['\"])(_random_text_(\\d+)_)(['\"]\\s*\\))/g;",
    "    const randomIntPattern  = /(await\\s+[^;]*?\\.fill\\(\\s*['\"])(_random_int_(\\d+)_)(['\"]\\s*\\))/g;",
    '    const decls = [];',
    '    const declared = new Set();',
    '    function varName(base, num) { return base + num; }',
  "    // Support pre-existing variable fills: page.*.fill(randomTextN)",
  "    source = source.replace(/fill\\(\\s*(randomText(\\d+))\\s*\\)/g, (m, v, num) => {",
  "      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); }",
  "      return m;",
  "    });",
    '    source = source.replace(randomTextPattern, (m, p1, placeholder, num, p4) => {',
    "      const v = varName('randomText', num);",
    "      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); }",
    "      return m.replace(p1 + placeholder + p4, p1.replace(/['\"]$/, '') + v + p4.replace(/^['\"]/,'') );",
    '    });',
    '    source = source.replace(randomIntPattern, (m, p1, placeholder, num, p4) => {',
    "      const v = varName('randomIntVar', num);",
    "      if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomInt();`); }",
    "      return m.replace(p1 + placeholder + p4, p1.replace(/['\"]$/, '') + v + p4.replace(/^['\"]/,'') );",
    '    });',
  // Replace LABEL: placeholders with getByLabel using a conservative pattern up to the next closing quote
  "    source = source.replace(/page\\.locator\\(['\"]LABEL:([^'\"\\]+?)['\"]\\)/g, (m, lbl) => `page.getByLabel(${JSON.stringify(lbl.trim())})`);",
  '    // Transform expect assertions with random text variables (handles optional .first())',
  "    source = source.replace(/await\\s+expect\\(page\\.locator\\(([^)]*)\\)(?:\\.first\\(\\))?\\)\\.toHaveValue\\(['\"](_random_text_(\\d+)_)['\"]\\);?/g, (match, selector, placeholder, num) => {",
  "      const v = `randomText${num}`;",
  "      return `await expect(page.locator('input').filter({ hasText: ${v} }).first()).toHaveValue(${v});`;",
  '    });',
    '    const expectLines = [];',
  "    // Replace assertions expecting placeholder with variable name if variable was declared",
  "    source = source.replace(/toHaveValue\(['\"](_random_text_(\\d+)_)['\"]\)/g, (m, placeholder, num) => {",
  "      const v = 'randomText' + num;",
  "      if (declared.has(v)) return `toHaveValue(${v})`;",
  "      return m;",
  "    });",
  // EXPECT_EXISTS placeholder transformation
  "    source = source.replace(/page\\.locator\\(['\"]EXPECT_EXISTS:([^'\"\\]+?)['\"]\\)(\\.\\w+\\([^)]*\\))?;?/g, (m, target) => {",
    "      const locator = target.startsWith('css=') ? target.replace(/^css=/,'') : target;",
    '      expectLines.push(`await expect(page.locator(${JSON.stringify(locator)})).toBeVisible();`);',
    "      return '';",
    '    });',
  "    source = source.replace(/['\"]EXPECT_EXISTS:([^'\"\\]+?)['\"];?/g, (m, target) => {",
    "      const locator = target.startsWith('css=') ? target.replace(/^css=/,'') : target;",
    '      expectLines.push(`await expect(page.locator(${JSON.stringify(locator)})).toBeVisible();`);',
    "      return '';",
    '    });',
    '    if (expectLines.length) source += `\\n// Animake injected assertions\\n${expectLines.join("\\n")}\\n`;',
  "    // Fallback scans for undeclared usages (randomTextN / randomIntVarN)",
  "    for (const v of [...new Set((source.match(/randomText(\\d+)/g) || []))]) { if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomText();`); } }",
  "    for (const v of [...new Set((source.match(/randomIntVar(\\d+)/g) || []))]) { if (!declared.has(v)) { declared.add(v); decls.push(`let ${v} = randomInt();`); } }",
  '    if (decls.length) {',
  '      const helperBlock = ANIMAKE_HELPER_HEADER + "\n" +',
  '        "function randomText(){return \'T_\'+Math.random().toString(36).slice(2,10);}" + "\n" +',
  '        "function randomInt(){return Math.floor(Math.random()*100000);}" + "\n" +',
  '        decls.join("\\n") + "\n// </animake-helpers>\n";',
    '      source = helperBlock + source;',
  '    }',
  "    if (decls.length) { console.log('[Animake Transform] Injected declarations:', decls.map(d=>d.split(' ')[1]).join(', ')); } else { console.log('[Animake Transform] No declarations injected'); }",
    '    return source;',
    '  } catch (e) {',
    "    console.error('Animake transform failed:', e);",
    '    return text;',
    '  }',
    '}'
  ].join('\n');
  // Insert after first import_fs line
  content = content.replace(/var import_fs[^\n]*\n/, m => m + injectBlock + '\n');
  // Replace flush body similar to working patch
  content = content.replace(/flush\(\) {[\s\S]*?this._text = void 0;\n  }/, `flush() {\n    if (this._timer) {\n      clearTimeout(this._timer);\n      this._timer = void 0;\n    }\n    if (this._text) {\n      let out = this._text;\n      if (process && process.env && process.env.ANIMAKE_CODEGEN_PATCH !== '0') {\n        out = __animakeTransform(out);\n      }\n      import_fs.default.writeFileSync(this._file, out);\n    }\n    this._text = void 0;\n  }`);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Applied Animake throttledFile transform');
  return true;
}

module.exports = { patchThrottledFile, findThrottledFile };

if (require.main === module) {
  patchThrottledFile();
}
