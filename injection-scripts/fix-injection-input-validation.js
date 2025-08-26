// ANIMAKE INJECTION - INPUT VALIDATION VERSION
// This version includes proper input field validation and visual feedback

if (window.animakeUniversalTools) {
  console.log('🎬 Animake tools already loaded');
  return;
}
window.animakeUniversalTools = true;

console.log('🎬 Loading Enhanced Animake Tools with Input Validation...');

let selectedElement = null;
let isSelectingElement = false;
let originalBorder = '';

// Function to check if element is valid for input actions
function isValidInputElement(el) {
  const tagName = el.tagName.toLowerCase();
  if (tagName === 'textarea') return true;
  if (tagName === 'input') {
      const type = el.type.toLowerCase();
      return ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type);
  }
  return false;
}

// Create floating tool panel with DOM-safe appending
const toolPanel = document.createElement('div');
toolPanel.id = 'animake-tools';
toolPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 999999;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
`;

toolPanel.innerHTML = `
    <div style="margin-bottom: 12px; font-weight: 600; font-size: 14px; text-align: center;">
        🎬 ANIMAKE Tools
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="random-text-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">📝 Random Text</button>
        <button id="random-int-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🔢 Random Int</button>
        <button id="assert-exists-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">✅ Assert Exists</button>
        <button id="select-label-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🏷️ Select by Label</button>
    </div>
    <div id="status" style="margin-top: 10px; font-size: 11px; opacity: 0.8; text-align: center;">Ready</div>
`;

// DOM-safe appending
function appendToolPanel() {
  if (document.body) {
    document.body.appendChild(toolPanel);
    setupToolPanelEvents();
  } else {
    setTimeout(appendToolPanel, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', appendToolPanel);
} else {
  appendToolPanel();
}

function setupToolPanelEvents() {
  // Enhanced element selection with input validation and visual feedback
  function startElementSelection(actionType) {
      isSelectingElement = true;
      const statusDiv = document.getElementById('status');
      statusDiv.textContent = `Click an element for ${actionType}`;
      document.body.style.cursor = 'crosshair';
      
      const inputActions = ['Random Text', 'Random Int'];
      const requiresInput = inputActions.includes(actionType);
      
      // Add hover feedback for input validation
      function mouseoverHandler(e) {
          if (e.target.closest('#animake-tools')) return;
          
          const element = e.target;
          const isValid = !requiresInput || isValidInputElement(element);
          
          // Visual feedback
          element.style.outline = isValid ? '2px solid #4CAF50' : '2px solid #f44336';
          element.style.backgroundColor = isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)';
          
          statusDiv.textContent = isValid ? 
              `✅ Valid ${element.tagName.toLowerCase()} - click to select` : 
              `❌ Invalid element - select input/textarea`;
      }
      
      function mouseoutHandler(e) {
          if (e.target.closest('#animake-tools')) return;
          e.target.style.outline = '';
          e.target.style.backgroundColor = '';
      }
      
      document.addEventListener('mouseover', mouseoverHandler);
      document.addEventListener('mouseout', mouseoutHandler);
      
      // Add click listener with validation
      document.addEventListener('click', function elementClickHandler(e) {
          if (e.target.closest('#animake-tools')) return;
          
          e.preventDefault();
          e.stopPropagation();
          
          const element = e.target;
          
          // Check if action requires input validation
          if (inputActions.includes(actionType) && !isValidInputElement(element)) {
              statusDiv.textContent = `❌ Please select an input field or textarea`;
              document.body.style.cursor = 'default';
              document.removeEventListener('click', elementClickHandler, true);
              document.removeEventListener('mouseover', mouseoverHandler);
              document.removeEventListener('mouseout', mouseoutHandler);
              isSelectingElement = false;
              
              // Clear any remaining outline/background styles
              document.querySelectorAll('*').forEach(el => {
                  if (el.style.outline.includes('2px solid')) {
                      el.style.outline = '';
                      el.style.backgroundColor = '';
                  }
              });
              return;
          }
          
          // Generate appropriate Playwright code
          let code = '';
          if (actionType === 'Random Text') {
              const randomText = 'TestData_' + Math.random().toString(36).substring(2, 8);
              code = `await page.locator('${element.tagName.toLowerCase()}').fill('${randomText}');`;
              statusDiv.textContent = `📋 Generated: Random Text`;
          } else if (actionType === 'Random Int') {
              const randomInt = Math.floor(Math.random() * 1000);
              code = `await page.locator('${element.tagName.toLowerCase()}').fill('${randomInt}');`;
              statusDiv.textContent = `📋 Generated: Random Int`;
          } else if (actionType === 'Assert Exists') {
              code = `await expect(page.locator('${element.tagName.toLowerCase()}')).toBeVisible();`;
              statusDiv.textContent = `📋 Generated: Assert`;
          } else if (actionType === 'Select by Label') {
              code = `await page.locator('${element.tagName.toLowerCase()}').click();`;
              statusDiv.textContent = `📋 Generated: Select`;
          }
          
          // Copy to clipboard
          if (code) {
              navigator.clipboard.writeText(code).then(() => {
                  console.log('📋 Code copied:', code);
              }).catch(err => {
                  console.log('💾 Code generated:', code);
              });
          }
          
          // Reset selection mode
          isSelectingElement = false;
          document.body.style.cursor = 'default';
          document.removeEventListener('click', elementClickHandler);
          document.removeEventListener('mouseover', mouseoverHandler);
          document.removeEventListener('mouseout', mouseoutHandler);
          
          // Clear any remaining outline/background styles
          document.querySelectorAll('*').forEach(el => {
              if (el.style.outline.includes('2px solid')) {
                  el.style.outline = '';
                  el.style.backgroundColor = '';
              }
          });
          
      }, { capture: true, once: true });
  }

  // Button event handlers
  document.getElementById('random-text-btn').addEventListener('click', () => {
      startElementSelection('Random Text');
  });

  document.getElementById('random-int-btn').addEventListener('click', () => {
      startElementSelection('Random Int');
  });

  document.getElementById('assert-exists-btn').addEventListener('click', () => {
      startElementSelection('Assert Exists');
  });

  document.getElementById('select-label-btn').addEventListener('click', () => {
      startElementSelection('Select by Label');
  });

  console.log('🎬 Animake Universal Tools with Input Validation loaded successfully!');
}
