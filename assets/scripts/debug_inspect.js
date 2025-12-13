// This script finds the code block and logs any span inside it that still has a class but NO inline style
// This indicates a missing mapping.

const codeBlocks = document.querySelectorAll('.hljs code');
const unstyledClasses = new Set();

codeBlocks.forEach(block => {
    const spans = block.querySelectorAll('span');
    spans.forEach(span => {
        // If it has a class starting with hljs- but NO style attribute (or empty style)
        if (span.className.includes('hljs-') && !span.getAttribute('style')) {
            unstyledClasses.add(span.className);
            span.style.border = '1px solid red'; // Visual marker
        }
    });
});

console.log('Unstyled HLJS Classes found:', Array.from(unstyledClasses));

// Also dump the innerHTML of the first code block for manual review
if (codeBlocks.length > 0) {
    console.log('First code block HTML:', codeBlocks[0].innerHTML);
}
