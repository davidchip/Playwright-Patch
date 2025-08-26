// ANIMAKE INJECTION - SIMPLIFIED PATTERN REPLACER VERSION
// This version monitors Playwright's generated code and replaces patterns automatically

if (window.animakePatternReplacer) {
  console.log('🎬 Animake pattern replacer already loaded');
  return;
}
window.animakePatternReplacer = true;

console.log('🎬 Loading Animake Pattern Replacer...');

// Monitor Playwright's code generation and replace patterns
let lastCodeContent = '';

function processGeneratedCode() {
  // Find Playwright's code area (usually a textarea or pre element)
  const codeElements = [
    ...document.querySelectorAll('textarea'),
    ...document.querySelectorAll('pre'),
    ...document.querySelectorAll('[data-testid*="code"]'),
    ...document.querySelectorAll('.monaco-editor')
  ];
  
  codeElements.forEach(element => {
    let content = element.value || element.textContent || element.innerText || '';
    
    if (content && content !== lastCodeContent) {
      lastCodeContent = content;
      
      // Pattern: .fill("_random_text_123_") -> var + fill
      const randomTextPattern = /(\S+)\.fill\(["']_random_text_(\d+)_["']\)/g;
      content = content.replace(randomTextPattern, (match, selector, number) => {
        return `var random_text_${number} = random_text_function(); // inline function\n${selector}.fill(random_text_${number})`;
      });
      
      // Pattern: .fill("_random_int_123_") -> var + fill  
      const randomIntPattern = /(\S+)\.fill\(["']_random_int_(\d+)_["']\)/g;
      content = content.replace(randomIntPattern, (match, selector, number) => {
        return `var random_int_${number} = random_int_function(); // inline function\n${selector}.fill(random_int_${number})`;
      });
      
      // Update the element if content changed
      if (content !== (element.value || element.textContent || element.innerText || '')) {
        if (element.value !== undefined) {
          element.value = content;
        } else {
          element.textContent = content;
        }
        console.log('🔄 Animake: Replaced patterns in generated code');
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

console.log('🎬 Animake Pattern Replacer loaded successfully!');
console.log('📝 Usage: Type _random_text_1_ or _random_int_2_ in inputs, and code will be auto-replaced');
