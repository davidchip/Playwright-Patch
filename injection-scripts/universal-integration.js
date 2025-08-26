/**
 * Universal Playwright Codegen Integration
 * Works regardless of overlay location by using document.body
 */

console.log('🎭 UNIVERSAL PLAYWRIGHT CODEGEN INTEGRATION');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('📋 This version works in ANY window - paste this script:');
console.log('');

const UNIVERSAL_SCRIPT = `(function() {
  'use strict';
  
  if (window.animakeUniversalTools) {
    console.log('🎭 Animake universal tools already loaded');
    return;
  }
  window.animakeUniversalTools = true;
  
  console.log('🎭 Loading Animake Universal Tools...');
  console.log('📍 Window:', window.location.href);
  console.log('📍 Title:', document.title);
  
  // Create floating panel that works anywhere
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
    
    // Make panel draggable
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    const titleBar = document.createElement('div');
    titleBar.style.cssText = \`
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 4px 0;
      border-bottom: 1px solid #444;
      cursor: move;
    \`;
    
    const title = document.createElement('div');
    title.innerHTML = '🎭 <strong>Animake Codegen</strong>';
    title.style.cssText = 'font-size: 13px; font-weight: 600;';
    
    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 4px;';
    
    const minimizeBtn = document.createElement('button');
    minimizeBtn.textContent = '−';
    minimizeBtn.style.cssText = \`
      background: #666;
      border: none;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    \`;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = \`
      background: #d13438;
      border: none;
      color: white;
      width: 20px;
      height: 20px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    \`;
    
    controls.appendChild(minimizeBtn);
    controls.appendChild(closeBtn);
    titleBar.appendChild(title);
    titleBar.appendChild(controls);
    panel.appendChild(titleBar);
    
    // Dragging functionality
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
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        panel.style.left = (initialX + deltaX) + 'px';
        panel.style.top = (initialY + deltaY) + 'px';
        panel.style.right = 'auto';
      }
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
    
    // Button controls
    let isMinimized = false;
    const contentArea = document.createElement('div');
    contentArea.className = 'animake-content';
    panel.appendChild(contentArea);
    
    minimizeBtn.onclick = () => {
      isMinimized = !isMinimized;
      contentArea.style.display = isMinimized ? 'none' : 'flex';
      contentArea.style.flexDirection = 'column';
      contentArea.style.gap = '6px';
      minimizeBtn.textContent = isMinimized ? '+' : '−';
    };
    
    closeBtn.onclick = () => {
      panel.remove();
      showToast('🎭 Animake tools removed');
    };
    
    return { panel, contentArea };
  }
  
  // Create tool button
  function createToolButton(text, onClick, description = '') {
    const button = document.createElement('button');
    button.style.cssText = \`
      background: linear-gradient(135deg, #0078d4, #106ebe);
      border: none;
      border-radius: 5px;
      color: white;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      transition: all 0.2s ease;
      text-align: left;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    \`;
    
    button.innerHTML = \`<span>\${text}</span>\`;
    if (description) {
      button.title = description;
    }
    
    button.addEventListener('mouseenter', () => {
      button.style.background = 'linear-gradient(135deg, #106ebe, #005a9e)';
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 4px 12px rgba(0,120,212,0.3)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'linear-gradient(135deg, #0078d4, #106ebe)';
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    });
    
    button.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        onClick();
      } catch (error) {
        console.error('Tool error:', error);
        showToast('❌ Error: ' + error.message, 'error');
      }
    };
    
    return button;
  }
  
  // Toast notification system
  function showToast(message, type = 'info') {
    const existing = document.querySelectorAll('.animake-toast');
    existing.forEach(el => el.remove());
    
    const toast = document.createElement('div');
    toast.className = 'animake-toast';
    toast.textContent = message;
    
    const colors = {
      info: '#0078d4',
      success: '#107c10',
      error: '#d13438',
      warning: '#ff8c00'
    };
    
    toast.style.cssText = \`
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: \${colors[type] || colors.info};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
    \`;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);
    
    // Animate out
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
  
  // Smart code output with multiple methods
  function outputCode(code, type) {
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(\`\\n🎭 [\${timestamp}] Generated \${type} Code:\`);
    console.log('═'.repeat(60));
    console.log(code);
    console.log('═'.repeat(60));
    console.log('📋 Code ready to copy!\\n');
    
    // Try multiple clipboard methods
    const copyMethods = [
      // Method 1: Modern Clipboard API
      () => {
        if (navigator.clipboard && window.isSecureContext) {
          return navigator.clipboard.writeText(code);
        }
        throw new Error('Clipboard API not available');
      },
      
      // Method 2: execCommand fallback
      () => {
        return new Promise((resolve, reject) => {
          const textArea = document.createElement('textarea');
          textArea.value = code;
          textArea.style.cssText = 'position:fixed;left:-999999px;top:-999999px;';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
              resolve();
            } else {
              reject(new Error('execCommand copy failed'));
            }
          } catch (e) {
            document.body.removeChild(textArea);
            reject(e);
          }
        });
      }
    ];
    
    // Try each method in sequence
    async function tryCopy() {
      for (let i = 0; i < copyMethods.length; i++) {
        try {
          await copyMethods[i]();
          showToast(\`📋 \${type} code copied to clipboard!\`, 'success');
          return;
        } catch (error) {
          console.log(\`Copy method \${i + 1} failed:\`, error.message);
        }
      }
      
      // All methods failed
      showToast(\`📝 \${type} code logged to console\`, 'info');
    }
    
    tryCopy();
  }
  
  // Simple prompt replacement that works everywhere
  function getInput(message, defaultValue = '') {
    const result = prompt(message, defaultValue);
    return result !== null ? result.trim() : null;
  }
  
  // Tool functions
  function generateRandomText() {
    const selector = getInput('CSS selector for input field:', 'input[name="username"]');
    if (!selector) return;
    
    const randomId = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();
    const variableName = 'textVar_' + randomId;
    const value = 'test_' + randomId + '_' + timestamp;
    
    const code = \`const \${variableName} = '\${value}';\\nawait page.fill('\${selector}', \${variableName});\`;
    outputCode(code, 'Random Text');
  }
  
  function generateRandomInteger() {
    const selector = getInput('CSS selector for input field:', 'input[name="age"]');
    if (!selector) return;
    
    const minStr = getInput('Minimum value:', '1');
    if (minStr === null) return;
    
    const maxStr = getInput('Maximum value:', '100');
    if (maxStr === null) return;
    
    const min = parseInt(minStr) || 1;
    const max = parseInt(maxStr) || 100;
    const randomId = Math.random().toString(36).substring(2, 8);
    const variableName = 'intVar_' + randomId;
    const value = Math.floor(Math.random() * (max - min + 1)) + min;
    
    const code = \`const \${variableName} = \${value};\\nawait page.fill('\${selector}', String(\${variableName}));\`;
    outputCode(code, 'Random Integer');
  }
  
  function generateAssertVariable() {
    const variableName = getInput('Variable name to assert:', 'textVar_abc123');
    if (!variableName) return;
    
    const code = \`await expect(page.locator('[value="'+ \${variableName} + '"]')).toBeVisible();\`;
    outputCode(code, 'Assert Variable');
  }
  
  function generateByLabel() {
    const labelText = getInput('Label text:', 'Username');
    if (!labelText) return;
    
    const code = \`page.getByLabel('\${labelText}')\`;
    outputCode(code, 'By Label Selector');
  }
  
  // Initialize
  function init() {
    try {
      // Remove any existing panel
      const existing = document.getElementById('animake-universal-panel');
      if (existing) {
        existing.remove();
      }
      
      const { panel, contentArea } = createFloatingPanel();
      
      // Add tool buttons
      contentArea.appendChild(createToolButton('📝 Random Text', generateRandomText, 'Generate unique text variable'));
      contentArea.appendChild(createToolButton('🔢 Random Integer', generateRandomInteger, 'Generate random number variable'));
      contentArea.appendChild(createToolButton('✅ Assert Variable', generateAssertVariable, 'Create assertion with variable'));
      contentArea.appendChild(createToolButton('🏷️ By Label', generateByLabel, 'Use accessible label selector'));
      
      // Add to document
      document.body.appendChild(panel);
      
      showToast('🎉 Animake Universal Tools loaded!', 'success');
      console.log('🎭 Animake Universal Tools loaded successfully!');
      console.log('💡 Panel is draggable and works in any window');
      console.log('📋 All code will be logged to console and copied when possible');
      
    } catch (error) {
      console.error('Failed to load Animake tools:', error);
      showToast('❌ Failed to load tools: ' + error.message, 'error');
    }
  }
  
  // Start initialization
  init();
  
})();`;

console.log(UNIVERSAL_SCRIPT);
console.log('');
console.log('🎯 KEY FEATURES:');
console.log('• Works in ANY window (no overlay dependency)');
console.log('• Floating draggable panel');
console.log('• Multiple clipboard copy methods');
console.log('• Minimize/maximize controls');
console.log('• Toast notifications');
console.log('• Uses standard prompts (more reliable)');
console.log('');
console.log('💡 USAGE:');
console.log('1. Start: npx playwright codegen [URL]');
console.log('2. Paste script in ANY window console');
console.log('3. Draggable panel appears top-right');
console.log('4. Works regardless of Playwright structure!');
