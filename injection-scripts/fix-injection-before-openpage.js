const fs = require('fs');
const path = require('path');

const programPath = 'node_modules/.pnpm/playwright-core@1.55.0/node_modules/playwright-core/lib/cli/program.js';
let content = fs.readFileSync(programPath, 'utf-8');

// Remove all previous injections to ensure a clean slate
content = content.replace(/\/\/ ANIMAKE INJECTION START[\s\S]*?\/\/ ANIMAKE INJECTION END\n/g, '');

// Find the line where we will inject, which is right before openPage
const openPageLine = 'await openPage(context, url);';
const injectionTargetRegex = new RegExp(`if \\(!dependencies \\|\\| dependencies\\.length === 0\\) \\{\\s*${openPageLine}\\s*\\}`);

const match = content.match(injectionTargetRegex);

if (!match) {
  console.error('Could not find the injection target line in codegen function');
  process.exit(1);
}

// The injection point is right before the 'await openPage' call.
const insertPosition = content.indexOf(openPageLine, match.index);

// Create our simplified injection for debugging
const injection = `
  // ANIMAKE INJECTION START
  console.log('🎭 Animake: Injecting script BEFORE page is opened...');
  
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

// Insert our injection before the openPage call
content = content.slice(0, insertPosition) + injection + content.slice(insertPosition);

// Write back
fs.writeFileSync(programPath, content);
console.log('✅ Injected Animake debug script before openPage.');
