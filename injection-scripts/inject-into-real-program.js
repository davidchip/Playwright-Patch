const fs = require('fs');
const path = require('path');

// The actual program.js that gets executed
const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Find the codegen function
const codegenMatch = content.match(/async function codegen\([^)]+\)\s*{/);
if (!codegenMatch) {
  console.error('Could not find codegen function');
  process.exit(1);
}

// Find where we open the page - look for openPage call
const openPageMatch = content.match(/await openPage\(context, url\);/);
if (!openPageMatch) {
  console.error('Could not find openPage call');
  process.exit(1);
}

// Insert our injection right after openPage
const injectionCode = `
  await openPage(context, url);
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting tools...');
  
  try {
    await context.addInitScript(() => {
      // This runs in every page in this context
      console.log('🎭 Animake tools initializing...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            const panel = document.createElement('div');
            panel.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;z-index:2147483647;font-size:16px;';
            panel.textContent = '🎭 ANIMAKE TOOLS ACTIVE';
            document.body.appendChild(panel);
            console.log('🎭 Animake panel added to page');
          }, 1000);
        });
      } else {
        setTimeout(() => {
          const panel = document.createElement('div');
          panel.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;z-index:2147483647;font-size:16px;';
          panel.textContent = '🎭 ANIMAKE TOOLS ACTIVE';
          document.body.appendChild(panel);
          console.log('🎭 Animake panel added to page');
        }, 1000);
      }
    });
    console.log('🎭 Animake: Init script added successfully');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject:', error);
  }
  // ANIMAKE INJECTION END
`;

// Replace the line
content = content.replace(
  'await openPage(context, url);',
  injectionCode
);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Successfully injected Animake tools into the REAL program.js');
console.log('📍 Location:', programPath);
