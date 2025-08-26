// ANIMAKE INJECTION - DOM-SAFE KEYPRESS EMULATION VERSION
// This version includes proper DOM readiness checks and comprehensive keypress simulation

if (window.animakeUniversalTools) {
  console.log('🎬 Animake tools already loaded');
  return;
}
window.animakeUniversalTools = true;

console.log('🎬 Loading Enhanced Animake Tools with DOM-Safe Keypress Emulation...');

let selectedElement = null;
let isSelectingElement = false;
let originalBorder = '';

// Create floating tool panel
const toolPanel = document.createElement('div');
toolPanel.id = 'animake-tools';
toolPanel.style.cssText = \`
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
\`;

// Wait for body to be ready and append safely
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

console.log('🎬 Animake Universal Tools - DOM-Safe Version loaded successfully!');
