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

// Create the final injection block with interactive element selection
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting interactive toolset...');
  
  try {
    await context.addInitScript(() => {
      if (window.animakeUniversalTools) {
        console.log('🎭 Animake universal tools already loaded');
        return;
      }
      window.animakeUniversalTools = true;
      
      console.log('🎭 Loading Animake Interactive Tools...');
      
      // State management for element selection
      let isSelectingElement = false;
      let selectionMode = null;
      let originalOutline = new Map();
      
      function createFloatingPanel() {
        const panel = document.createElement('div');
        panel.id = 'animake-universal-panel';
        panel.style.cssText = 'position: fixed; top: 20px; right: 20px; background: rgba(30, 30, 30, 0.95); border: 2px solid #0078d4; border-radius: 8px; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: white; z-index: 999999; display: flex; flex-direction: column; gap: 6px; min-width: 220px; max-width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); user-select: none;';
        
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        const titleBar = document.createElement('div');
        titleBar.style.cssText = 'cursor: move; padding-bottom: 8px; border-bottom: 1px solid #444; margin-bottom: 8px; font-weight: bold;';
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
      
      function createToolButton(text, onClick, isActive = false) {
        const button = document.createElement('button');
        button.textContent = text;
        const baseStyle = 'border: none; border-radius: 5px; color: white; padding: 8px 12px; cursor: pointer; font-size: 11px; text-align: left; width: 100%; transition: all 0.2s ease;';
        const activeStyle = 'background: linear-gradient(135deg, #ff6b35, #f7931e);';
        const normalStyle = 'background: linear-gradient(135deg, #0078d4, #106ebe);';
        
        button.style.cssText = baseStyle + (isActive ? activeStyle : normalStyle);
        
        if (!isActive) {
          button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #106ebe, #005a9e)';
          });
          
          button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #0078d4, #106ebe)';
          });
        }
        
        button.onclick = onClick;
        return button;
      }

      function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: ' + (type === 'success' ? '#107c10' : type === 'info' ? '#0078d4' : '#d13438') + '; color: white; padding: 12px 16px; border-radius: 6px; z-index: 1000000; transition: opacity 0.3s;';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 3000);
      }
      
      function outputCode(code, type) {
        console.log('[Animake] ' + type + ':\\n' + code);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(() => {
            showToast('📋 ' + type + ' code copied!');
          }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Code logged to console', 'info');
          });
        } else {
          showToast('Code logged to console', 'info');
        }
      }
      
      // Element selection functionality
      function startElementSelection(mode) {
        if (isSelectingElement) {
          stopElementSelection();
          return;
        }
        
        isSelectingElement = true;
        selectionMode = mode;
        document.body.style.cursor = 'crosshair';
        showToast('Click on an element to select it', 'info');
        
        // Add click handler to capture element selection
        document.addEventListener('click', handleElementClick, true);
        document.addEventListener('mouseover', highlightElement, true);
        document.addEventListener('mouseout', unhighlightElement, true);
        
        updateButtonStates();
      }
      
      function stopElementSelection() {
        isSelectingElement = false;
        selectionMode = null;
        document.body.style.cursor = '';
        
        document.removeEventListener('click', handleElementClick, true);
        document.removeEventListener('mouseover', highlightElement, true);
        document.removeEventListener('mouseout', unhighlightElement, true);
        
        // Restore original outlines
        originalOutline.forEach((outline, element) => {
          element.style.outline = outline;
        });
        originalOutline.clear();
        
        updateButtonStates();
      }
      
      function highlightElement(e) {
        if (!isSelectingElement || e.target.closest('#animake-universal-panel')) return;
        
        const element = e.target;
        if (!originalOutline.has(element)) {
          originalOutline.set(element, element.style.outline || '');
        }
        element.style.outline = '2px solid #ff6b35';
      }
      
      function unhighlightElement(e) {
        if (!isSelectingElement || e.target.closest('#animake-universal-panel')) return;
        
        const element = e.target;
        if (originalOutline.has(element)) {
          element.style.outline = originalOutline.get(element);
          originalOutline.delete(element);
        }
      }
      
      function handleElementClick(e) {
        if (!isSelectingElement || e.target.closest('#animake-universal-panel')) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const element = e.target;
        const selector = generateSelector(element);
        
        stopElementSelection();
        
        if (selectionMode === 'randomText') {
          executeRandomText(element, selector);
        } else if (selectionMode === 'randomInteger') {
          executeRandomInteger(element, selector);
        }
      }
      
      function generateSelector(element) {
        // Generate a good CSS selector for the element
        if (element.id) {
          return '#' + element.id;
        }
        
        if (element.name) {
          return '[name="' + element.name + '"]';
        }
        
        if (element.className && typeof element.className === 'string') {
          const classes = element.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) {
            return '.' + classes[0];
          }
        }
        
        // Fallback to tag name with index
        const siblings = Array.from(element.parentNode?.children || []);
        const index = siblings.indexOf(element);
        return element.tagName.toLowerCase() + ':nth-child(' + (index + 1) + ')';
      }
      
      function executeRandomText(element, selector) {
        const variableName = 'textVar_' + Math.random().toString(36).substring(2, 8);
        const value = 'test_' + Date.now();
        
        // Actually fill the element with the random text
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          element.textContent = value;
        }
        
        const code = 'const ' + variableName + ' = "' + value + '";\\nawait page.fill("' + selector + '", ' + variableName + ');';
        outputCode(code, 'Random Text');
        showToast('✅ Filled element with random text!');
      }
      
      function executeRandomInteger(element, selector) {
        const value = Math.floor(Math.random() * 10000);
        const variableName = 'intVar_' + Math.random().toString(36).substring(2, 8);
        
        // Actually fill the element with the random number
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = String(value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          element.textContent = String(value);
        }
        
        const code = 'const ' + variableName + ' = ' + value + ';\\nawait page.fill("' + selector + '", String(' + variableName + '));';
        outputCode(code, 'Random Integer');
        showToast('✅ Filled element with random number!');
      }
      
      function generateAssertVariable() {
        const variableName = prompt('Variable name to assert:');
        if (!variableName) return;
        outputCode('await expect(page.locator("*").filter({hasText: ' + variableName + '})).toBeVisible();', 'Assert Variable');
      }
      
      function generateByLabel() {
        const labelText = prompt('Label text:');
        if (!labelText) return;
        outputCode('page.getByLabel("' + labelText + '")', 'By Label Selector');
      }
      
      function updateButtonStates() {
        const buttons = document.querySelectorAll('#animake-universal-panel button');
        buttons.forEach((button, index) => {
          if (index === 0) { // Random Text button
            button.style.background = selectionMode === 'randomText' ? 
              'linear-gradient(135deg, #ff6b35, #f7931e)' : 
              'linear-gradient(135deg, #0078d4, #106ebe)';
            button.textContent = selectionMode === 'randomText' ? '🎯 Click Element' : '📝 Random Text';
          } else if (index === 1) { // Random Integer button  
            button.style.background = selectionMode === 'randomInteger' ? 
              'linear-gradient(135deg, #ff6b35, #f7931e)' : 
              'linear-gradient(135deg, #0078d4, #106ebe)';
            button.textContent = selectionMode === 'randomInteger' ? '🎯 Click Element' : '🔢 Random Integer';
          }
        });
      }
      
      function init() {
        try {
          const { panel, contentArea } = createFloatingPanel();
          
          contentArea.appendChild(createToolButton('📝 Random Text', () => startElementSelection('randomText')));
          contentArea.appendChild(createToolButton('🔢 Random Integer', () => startElementSelection('randomInteger')));
          contentArea.appendChild(createToolButton('✅ Assert Variable', generateAssertVariable));
          contentArea.appendChild(createToolButton('🏷️ By Label', generateByLabel));
          
          document.body.appendChild(panel);
          console.log('🎭 Animake Interactive Tools loaded successfully!');
          showToast('🎉 Interactive Animake Tools Loaded!');
        } catch (error) {
          console.error('Failed to initialize Animake tools:', error);
        }
      }
      
      // DOM might be loading, so wait for it
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        setTimeout(init, 100);
      }
    });
    
    console.log('🎭 Animake: Interactive toolset injected successfully.');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject toolset:', error);
  }
  // ANIMAKE INJECTION END
`;

// Insert our injection right after the context is created
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected interactive Animake toolset with element selection.');
