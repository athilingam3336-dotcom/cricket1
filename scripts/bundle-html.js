const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const cricnativeDir = path.resolve(__dirname, '../');

console.log('Reading files from:', rootDir);

const htmlPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'style.css');
const jsPath = path.join(rootDir, 'script.js');
const assetsDir = path.join(rootDir, 'assets');

let html = fs.readFileSync(htmlPath, 'utf8');
let css = fs.readFileSync(cssPath, 'utf8');
let js = fs.readFileSync(jsPath, 'utf8');

console.log('Original files read successfully.');

// Helper to get base64 data URI
function getBase64DataUri(filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return '';
  }
  const fileData = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${fileData.toString('base64')}`;
}

const mimeMap = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// Map assets to base64
const assetFiles = fs.readdirSync(assetsDir);
assetFiles.forEach((file) => {
  const ext = path.extname(file).toLowerCase();
  const mime = mimeMap[ext] || 'application/octet-stream';
  const fullPath = path.join(assetsDir, file);
  const dataUri = getBase64DataUri(fullPath, mime);

  // Replace exact occurrences like "assets/logo_transparent.png"
  const regex = new RegExp(`assets/${file.replace('.', '\\.')}(\\?[^"']*)?`, 'g');
  html = html.replace(regex, dataUri);
  css = css.replace(regex, dataUri);
});

// Inline CSS
html = html.replace(/<link\s+rel="stylesheet"\s+href="style\.css[^"]*"\s*\/?>/i, `<style>\n${css}\n</style>`);

// Inline JS
html = html.replace(/<script\s+src="script\.js[^"]*"\s*><\/script>/i, `<script>\n${js}\n</script>`);

const outDir = path.join(cricnativeDir, 'src', 'generated');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outFilePath = path.join(outDir, 'inlinedHtml.js');
const fileContent = `/* Auto-generated exact 1:1 carbon-copy HTML/CSS/JS bundle */
export const INLINED_HTML = ${JSON.stringify(html)};
`;

fs.writeFileSync(outFilePath, fileContent, 'utf8');
console.log('Successfully bundled exact inlined HTML to:', outFilePath);
