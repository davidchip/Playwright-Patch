// ANIMAKE INJECTION - ENHANCED DEBUGGING VERSION
// This version includes comprehensive debugging and pattern matching

if (window.animakePatternReplacer) {
  console.log('🎬 Animake pattern replacer already loaded');
  return;
}
window.animakePatternReplacer = true;

console.log('🎬 Loading Animake Pattern Replacer with Enhanced Debugging...');

// Monitor Playwright's code generation and replace patterns
let lastCodeContent = '';

function processGeneratedCode() {
  // Find Playwright's code area with more comprehensive search
  const codeElements = [
    ...document.querySelectorAll('textarea'),
    ...document.querySelectorAll('pre'),
    ...document.querySelectorAll('[data-testid*="code"]'),
    ...document.querySelectorAll('.monaco-editor'),
    ...document.querySelectorAll('[class*="editor"]'),
    ...document.querySelectorAll('[role="textbox"]'),
    ...document.querySelectorAll('code')
  ];
  
  codeElements.forEach(element => {
    let content = element.value || element.textContent || element.innerText || '';
    
    if (content && content.trim().length > 0) {
      console.log('🔍 Animake: Found content:', content.substring(0, 100) + '...');
      
      if (content !== lastCodeContent) {
        lastCodeContent = content;
        console.log('🔄 Animake: Processing new content...');
        
        // Check if content contains our patterns
        if (content.includes('_random_text_') || content.includes('_random_int_')) {
          console.log('✅ Animake: Found pattern in content!');
          
          // Pattern: .fill('_random_text_123_') -> var + fill
          const randomTextPattern = /(\S+)\.fill\(['""]_random_text_(\d+)_['"]\)/g;
          const oldContent = content;
          content = content.replace(randomTextPattern, (match, selector, number) => {
            console.log('🔄 Animake: Replacing random text pattern:', match);
            return `var _random_text_${number}_ = text_replace_function()\n${selector}.fill(_random_text_${number}_)`;
          });
          
          // Pattern: .fill('_random_int_123_') -> var + fill  
          const randomIntPattern = /(\S+)\.fill\(['""]_random_int_(\d+)_['"]\)/g;
          content = content.replace(randomIntPattern, (match, selector, number) => {
            console.log('🔄 Animake: Replacing random int pattern:', match);
            return `var _random_int_${number}_ = int_replace_function()\n${selector}.fill(_random_int_${number}_)`;
          });
          
          // Update the element if content changed
          if (content !== oldContent) {
            console.log('📝 Animake: Updating element with new content');
            if (element.value !== undefined) {
              element.value = content;
              // Trigger change events
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              element.textContent = content;
            }
            console.log('🔄 Animake: Replaced patterns in generated code');
          } else {
            console.log('⚠️ Animake: Pattern found but no replacement made');
          }
        }
      }
    }
  });
}

// Monitor for changes every 500ms
setInterval(processGeneratedCode, 500);

// Also monitor on DOM changes
const observer = new MutationObserver(processGeneratedCode);
observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

console.log('🎬 Animake Pattern Replacer with Enhanced Debugging loaded successfully!');
console.log('📝 Usage: Type _random_text_1_ or _random_int_2_ in inputs, and code will be auto-replaced');
console.log('�� Check browser console for detailed debugging output');
