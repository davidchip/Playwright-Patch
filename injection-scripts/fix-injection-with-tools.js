const fs = require('fs');
const path = require('path');

const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Remove all previous injections to ensure a clean slate
content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n/g, '');

// Find the line where the context is created. This is the most reliable place.
const launchContextRegex = /const { context, browser, launchOptions, contextOptions, closeBrowser } = await launchContext\([^)]+\);/s;
const match = content.match(launchContextRegex);

if (!match) {
  console.error('Could not find the launchContext call in codegen function');
  process.exit(1);
}

const insertPosition = match.index + match[0].length;

// This is the full script from universal-integration.js
const fullToolSet = `
(function() {
  'use strict';
  
  if (window.animakeUniversalTools) {
    console.log('🎭 Animake universal tools already loaded');
    return;
  }
  window.animakeUniversalTools = true;
  
  console.log('🎭 Loading Animake Universal Tools...');
  
  function createFloatingPanel() {
    const panel = document.createElement('div');
    panel.id = 'animake-universal-panel';
    panel.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(30, 30, 30, 0.95);
      border: 2px solid #0078d4;
      border-radius: 8px;
      padding: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: white;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 220px;
      max-width: 300px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(10px);
      user-select: none;
    \`;
    
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const titleBar = document.createElement('div');
    titleBar.style.cssText = 'cursor: move; padding-bottom: 8px; border-bottom: 1px solid #444; margin-bottom: 8px;';
    titleBar.innerHTML = '🎭 <strong>Animake Codegen</strong>';
    
    panel.appendChild(titleBar);
    
    titleBar.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
    });
    
    function drag(e) {
      if (isDragging) {
        panel.style.left = (initialX + e.clientX - startX) + 'px';
        panel.style.top = (initialY + e.clientY - startY) + 'px';
        panel.style.right = 'auto';
      }
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
    
    const contentArea = document.createElement('div');
    contentArea.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';
    panel.appendChild(contentArea);
    
    return { panel, contentArea };
  }
  
  function createToolButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = \`
      background: linear-gradient(135deg, #0078d4, #106ebe);
      border: none;
      border-radius: 5px;
      color: white;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 11px;
      text-align: left;
    \`;
    button.onclick = onClick;
    return button;
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: \${type === 'success' ? '#107c10' : '#d13438'};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      z-index: 1000000;
      transition: opacity 0.3s;
    \`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  function outputCode(code, type) {
    console.log(\`[Animake] \${type}:\\n\${code}\`);
    navigator.clipboard.writeText(code).then(() => {
      showToast(\`📋 \${type} code copied!\`);
    }).catch(err => {
      console.error('Failed to copy:', err);
      showToast('Failed to copy to clipboard', 'error');
    });
  }
  
  function generateRandomText() {
    const selector = prompt('CSS selector for input field:');
    if (!selector) return;
    const variableName = 'textVar_' + Math.random().toString(36).substring(2, 8);
    const value = 'test_' + Date.now();
    outputCode(\`const \${variableName} = '\${value}';\\nawait page.fill('\${selector}', \${variableName});\`, 'Random Text');
  }
  
  function generateRandomInteger() {
    const selector = prompt('CSS selector for input field:');
    if (!selector) return;
    const value = Math.floor(Math.random() * 10000);
    const variableName = 'intVar_' + Math.random().toString(36).substring(2, 8);
    outputCode(\`const \${variableName} = \${value};\\nawait page.fill('\${selector}', String(\${variableName}));\`, 'Random Integer');
  }
  
  function generateAssertVariable() {
    const variableName = prompt('Variable name to assert:');
    if (!variableName) return;
    outputCode(\`await expect(page.locator('*:has-text("'\${variableName}'")')).toBeVisible();\`, 'Assert Variable');
  }
  
  function generateByLabel() {
    const labelText = prompt('Label text:');
    if (!labelText) return;
    outputCode(\`page.getByLabel('\${labelText}')\`, 'By Label Selector');
  }
  
  function init() {
    const { panel, contentArea } = createFloatingPanel();
    contentArea.appendChild(createToolButton('📝 Random Text', generateRandomText));
    contentArea.appendChild(createToolButton('🔢 Random Integer', generateRandomInteger));
    contentArea.appendChild(createToolButton('✅ Assert Variable', generateAssertVariable));
    contentArea.appendChild(createToolButton('🏷️ By Label', generateByLabel));
    document.body.appendChild(panel);
    console.log('🎭 Animake Universal Tools loaded successfully!');
  }
  
  // DOM might be loading, so wait for it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;

// Create the final injection block
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting full toolset...');
  
  try {
    await context.addInitScript(\`${fullToolSet}\`);
    console.log('🎭 Animake: Full toolset injected successfully.');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject toolset:', error);
  }
  // ANIMAKE INJECTION END
`;

// Insert our injection right after the context is created
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected the full Animake toolset into Playwright.');
