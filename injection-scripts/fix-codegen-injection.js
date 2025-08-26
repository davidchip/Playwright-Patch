const fs = require('fs');

const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Remove all previous injections
content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n/g, '');

// Find the correct openPage call inside the codegen function (around line 590)
const codegenOpenPageRegex = /if \(!dependencies \|\| dependencies\.length === 0\) \{\s*await openPage\(context, url\);\s*\}/;
const match = content.match(codegenOpenPageRegex);

if (!match) {
  console.error('Could not find the correct openPage call in codegen function');
  process.exit(1);
}

const insertPosition = content.indexOf(match[0]) + match[0].length;

// Create our injection 
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting tools into codegen...');
  
  try {
    // Add init script to the context
    await context.addInitScript(() => {
      console.log('🎭 Animake init script running in browser...');
      
      // Wait for DOM to be ready then inject our tools
      function injectTools() {
        // Create visible panel
        const panel = document.createElement('div');
        panel.id = 'animake-tools-panel';
        panel.style.cssText = 'position:fixed;top:10px;right:10px;background:#ff0000;color:white;padding:15px;z-index:2147483647;font-size:18px;font-weight:bold;border:3px solid white;border-radius:8px;cursor:pointer;';
        panel.textContent = '🎭 ANIMAKE TOOLS ACTIVE';
        panel.onclick = () => alert('Animake tools are active! Check console for logs.');
        
        if (document.body) {
          document.body.appendChild(panel);
          console.log('🎭 Animake panel added to page');
        } else {
          console.error('🎭 Could not find document.body');
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(injectTools, 500);
        });
      } else {
        setTimeout(injectTools, 500);
      }
    });
    
    console.log('🎭 Animake: Init script added successfully');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject:', error);
  }
  // ANIMAKE INJECTION END
`;

// Insert our injection after the openPage call
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected Animake tools into the correct codegen function');
