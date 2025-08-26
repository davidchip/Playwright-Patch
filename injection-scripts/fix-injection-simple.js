const fs = require('fs');
const path = require('path');

const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Remove all previous injections to ensure a clean slate
content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n/g, '');

// Find the correct openPage call inside the codegen function
const codegenOpenPageRegex = /if \(!dependencies \|\| dependencies\.length === 0\) \{\s*await openPage\(context, url\);\s*\}/;
const match = content.match(codegenOpenPageRegex);

if (!match) {
  console.error('Could not find the correct openPage call in codegen function');
  process.exit(1);
}

const insertPosition = content.indexOf(match[0]) + match[0].length;

// Create our new, simplified injection for debugging
const injection = `
  
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting simplified debug script...');
  
  try {
    await context.addInitScript(() => {
      // This is the simplest way to see if our script runs
      alert('✅ Animake Tools Injected!'); 
      console.log('%c[ANIMAKE] INIT SCRIPT EXECUTED!', 'color: lime; font-size: 20px;');
      debugger; // This will pause execution if devtools are open
    });
    
    console.log('🎭 Animake: Simplified init script added successfully');
  } catch (error) {
    console.error('🎭 Animake: Failed to inject simplified script:', error);
  }
  // ANIMAKE INJECTION END
`;

// Insert our injection after the openPage call
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected simplified Animake debug script.');
