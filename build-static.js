const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const docsDir = path.join(__dirname, 'docs');

// Read source files
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(publicDir, 'style.css'), 'utf8');
const js = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');

// Build self-contained HTML
let output = html;

// Replace CSS link with inline style
output = output.replace(
  '<link rel="stylesheet" href="style.css">',
  `<style>\n${css}\n</style>`
);

// Remove manifest and service worker references (not needed for static)
output = output.replace('<link rel="manifest" href="manifest.json">\n', '');

// Replace app.js script tag with inline script containing embedded data
output = output.replace(
  '<script src="app.js"></script>',
  `<script>\nwindow.__STATIC_MODE = true;\nwindow.__STATIC_DATA = ${JSON.stringify(data.items, null, 2)};\n</script>\n<script>\n${js}\n</script>`
);

// Ensure docs/ exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
}

fs.writeFileSync(path.join(docsDir, 'index.html'), output, 'utf8');

console.log(`Built docs/index.html (${(Buffer.byteLength(output) / 1024).toFixed(1)} KB)`);
console.log(`Embedded ${data.items.length} items from data.json`);
