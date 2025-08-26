// Enhanced Playwright Codegen Tools with Keypress Emulation
// This script adds interactive element selection with proper keypress simulation

const injectionCode = `
(function() {
    console.log('🎬 ANIMAKE Playwright Tools with Keypress Emulation - Loaded');
    
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
    
    toolPanel.innerHTML = \`
        <div style="margin-bottom: 12px; font-weight: 600; font-size: 14px; text-align: center;">
            🎬 ANIMAKE Tools
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button id="random-text-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">📝 Random Text</button>
            <button id="random-int-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🔢 Random Int</button>
            <button id="assert-exists-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">✅ Assert Exists</button>
            <button id="select-label-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; transition: all 0.2s;">🏷️ Select by Label</button>
        </div>
        <div id="status" style="margin-top: 10px; font-size: 11px; opacity: 0.8; text-align: center;"></div>
    \`;
    
    document.body.appendChild(toolPanel);
    
    // Add hover effects
    const buttons = toolPanel.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'rgba(255,255,255,0.3)';
            btn.style.transform = 'translateY(-1px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,255,255,0.2)';
            btn.style.transform = 'translateY(0)';
        });
    });
    
    const statusDiv = document.getElementById('status');
    
    function updateStatus(message) {
        statusDiv.textContent = message;
        setTimeout(() => statusDiv.textContent = '', 3000);
    }
    
    // Enhanced keypress simulation function
    function simulateKeypress(element, text) {
        console.log('🎹 Simulating keypress for:', text);
        
        // Focus the element first
        element.focus();
        
        // Clear existing content
        element.value = '';
        
        // Simulate typing each character
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Create keyboard events
            const keydownEvent = new KeyboardEvent('keydown', {
                key: char,
                code: \`Key\${char.toUpperCase()}\`,
                charCode: char.charCodeAt(0),
                keyCode: char.charCodeAt(0),
                which: char.charCodeAt(0),
                bubbles: true,
                cancelable: true,
                composed: true
            });
            
            const keypressEvent = new KeyboardEvent('keypress', {
                key: char,
                code: \`Key\${char.toUpperCase()}\`,
                charCode: char.charCodeAt(0),
                keyCode: char.charCodeAt(0),
                which: char.charCodeAt(0),
                bubbles: true,
                cancelable: true,
                composed: true
            });
            
            const inputEvent = new InputEvent('input', {
                data: char,
                inputType: 'insertText',
                bubbles: true,
                cancelable: true,
                composed: true
            });
            
            const keyupEvent = new KeyboardEvent('keyup', {
                key: char,
                code: \`Key\${char.toUpperCase()}\`,
                charCode: char.charCodeAt(0),
                keyCode: char.charCodeAt(0),
                which: char.charCodeAt(0),
                bubbles: true,
                cancelable: true,
                composed: true
            });
            
            // Dispatch events in sequence
            element.dispatchEvent(keydownEvent);
            element.dispatchEvent(keypressEvent);
            
            // Update value incrementally
            element.value = text.substring(0, i + 1);
            
            element.dispatchEvent(inputEvent);
            element.dispatchEvent(keyupEvent);
            
            // Trigger change event after each character for better detection
            const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            element.dispatchEvent(changeEvent);
        }
        
        // Final events
        const finalInputEvent = new InputEvent('input', {
            inputType: 'insertText',
            data: text,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(finalInputEvent);
        
        const finalChangeEvent = new Event('change', { bubbles: true, cancelable: true });
        element.dispatchEvent(finalChangeEvent);
        
        // Blur and refocus to ensure detection
        element.blur();
        setTimeout(() => {
            element.focus();
            element.select();
        }, 50);
    }
    
    // Smart selector generation
    function generateSmartSelector(element) {
        // Try getByLabel first
        const label = element.closest('label') || document.querySelector(\`label[for="\${element.id}"]\`);
        if (label) {
            const labelText = label.textContent.trim();
            if (labelText) return \`page.getByLabel('\${labelText}')\`;
        }
        
        // Try getByPlaceholder
        if (element.placeholder) {
            return \`page.getByPlaceholder('\${element.placeholder}')\`;
        }
        
        // Try getByRole with accessible name
        if (element.tagName.toLowerCase() === 'input') {
            const type = element.type || 'textbox';
            const name = element.getAttribute('aria-label') || element.getAttribute('name');
            if (name) {
                return \`page.getByRole('\${type === 'text' ? 'textbox' : type}', { name: '\${name}' })\`;
            }
        }
        
        // Fallback to CSS selector
        let selector = element.tagName.toLowerCase();
        if (element.id) selector += \`#\${element.id}\`;
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c.trim());
            if (classes.length > 0) selector += \`.\${classes.join('.')}\`;
        }
        
        return \`page.locator('\${selector}')\`;
    }
    
    // Element highlighting
    function highlightElement(element) {
        if (selectedElement && selectedElement !== element) {
            selectedElement.style.border = originalBorder;
        }
        selectedElement = element;
        originalBorder = element.style.border;
        element.style.border = '3px solid #ff6b6b';
        element.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.5)';
    }
    
    function removeHighlight() {
        if (selectedElement) {
            selectedElement.style.border = originalBorder;
            selectedElement.style.boxShadow = '';
            selectedElement = null;
        }
    }
    
    // Element selection mode
    function startElementSelection(actionType) {
        isSelectingElement = true;
        updateStatus(\`Click an element for \${actionType}\`);
        document.body.style.cursor = 'crosshair';
        
        // Add click listener
        document.addEventListener('click', function elementClickHandler(e) {
            if (e.target.closest('#animake-tools')) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const element = e.target;
            const selector = generateSmartSelector(element);
            
            // Perform the action based on type
            if (actionType === 'Random Text') {
                const randomText = 'TestData_' + Math.random().toString(36).substring(2, 8);
                simulateKeypress(element, randomText);
                updateStatus(\`Typed: \${randomText}\`);
            } else if (actionType === 'Random Int') {
                const randomInt = Math.floor(Math.random() * 1000).toString();
                simulateKeypress(element, randomInt);
                updateStatus(\`Typed: \${randomInt}\`);
            }
            
            // Generate and copy code
            let code = '';
            switch(actionType) {
                case 'Random Text':
                    code = \`const randomText_\${Date.now()} = 'TestData_' + Math.random().toString(36).substring(2, 8);\\n\${selector}.fill(randomText_\${Date.now()});\`;
                    break;
                case 'Random Int':
                    code = \`const randomInt_\${Date.now()} = Math.floor(Math.random() * 1000).toString();\\n\${selector}.fill(randomInt_\${Date.now()});\`;
                    break;
                case 'Assert Exists':
                    code = \`await expect(\${selector}).toBeVisible();\`;
                    break;
                case 'Select by Label':
                    const labelText = prompt('Enter label text:');
                    if (labelText) {
                        code = \`await page.getByLabel('\${labelText}').click();\`;
                    }
                    break;
            }
            
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
            removeHighlight();
            document.removeEventListener('click', elementClickHandler);
            
        }, { capture: true, once: true });
    }
    
    // Add hover highlighting during selection
    document.addEventListener('mouseover', (e) => {
        if (isSelectingElement && !e.target.closest('#animake-tools')) {
            highlightElement(e.target);
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (isSelectingElement && !e.target.closest('#animake-tools')) {
            removeHighlight();
        }
    });
    
    // Button event listeners
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
    
    console.log('🎬 ANIMAKE Tools Ready - Enhanced with Keypress Emulation!');
})();
`;

// Apply the injection to Playwright
const fs = require('fs');
const path = require('path');

const playwrightPath = path.join(process.cwd(), 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js');

if (fs.existsSync(playwrightPath)) {
    let content = fs.readFileSync(playwrightPath, 'utf8');
    
    // Remove any existing ANIMAKE injection
    content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n?/g, '');
    
    // Find the launchContext line and inject after it
    const launchContextPattern = /(\s+)(const context = await launchContext\([^;]+;)/;
    const match = content.match(launchContextPattern);
    
    if (match) {
        const indentation = match[1];
        const launchLine = match[2];
        
        const injection = `${launchLine}
${indentation}
${indentation}// ANIMAKE INJECTION START
${indentation}await context.addInitScript(() => {
${indentation}    ${injectionCode.split('\n').join(`\n${indentation}    `)}
${indentation}});
${indentation}// ANIMAKE INJECTION END`;
        
        content = content.replace(launchContextPattern, injection);
        
        fs.writeFileSync(playwrightPath, content);
        console.log('✅ Enhanced Playwright injection applied with keypress emulation!');
        console.log('🎹 Now supports proper keypress simulation for better recorder detection');
    } else {
        console.log('❌ Could not find launchContext pattern');
    }
} else {
    console.log('❌ Playwright file not found');
}
