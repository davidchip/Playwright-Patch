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

// Create our simplified injection for debugging
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting script immediately after context creation...');
  
  try {
    await context.addInitScript(() => {
      alert('✅ Animake Tools Injected!'); 
      console.log('%c[ANIMAKE] INIT SCRIPT EXECUTED!', 'color: lime; font-size: 20px;');
      debugger;
    });
    
    console.log('🎭 Animake: Init script added successfully');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject script:', error);
  }
  // ANIMAKE INJECTION END
`;

// Insert our injection right after the context is created
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected Animake debug script after launchContext.');
