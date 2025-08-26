const fs = require('fs');
const path = require('path');

const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Remove our previous injection (it has duplicate const page)
content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n/g, '');

// Now find the original const page line
const pageLineRegex = /const page = await openPage\(context, url\);/g;
const matches = [...content.matchAll(pageLineRegex)];

if (matches.length === 0) {
  console.error('Could not find openPage call');
  process.exit(1);
}

// Get the last match (should be the only one now)
const lastMatch = matches[matches.length - 1];
const insertPosition = lastMatch.index + lastMatch[0].length;

// Create our injection without the duplicate const page line
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting tools into codegen...');
  
  try {
    // Add init script to the context, not the page
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

// Insert our injection after the const page line
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Fixed duplicate const page issue and re-injected Animake tools');
