/**
 * bundle_html.js
 * 
 * Bundles index.html + style.css + adminService.js + script.js into:
 *   1. bundled.html  (standalone HTML with everything inlined)
 *   2. inlineHtml.ts (TypeScript export wrapping the HTML as a string constant)
 *
 * Usage: node bundle_html.js
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets_web');

// Read source files
let html = fs.readFileSync(path.join(ASSETS_DIR, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ASSETS_DIR, 'style.css'), 'utf8');
const adminJs = fs.readFileSync(path.join(ASSETS_DIR, 'adminService.js'), 'utf8');
const orgRegJs = fs.readFileSync(path.join(ASSETS_DIR, 'orgRegistrationService.js'), 'utf8');
const playerJs = fs.readFileSync(path.join(ASSETS_DIR, 'playerService.js'), 'utf8');
const tournamentJs = fs.readFileSync(path.join(ASSETS_DIR, 'tournamentService.js'), 'utf8');
const officialJs = fs.readFileSync(path.join(ASSETS_DIR, 'officialService.js'), 'utf8');
const fixtureJs = fs.readFileSync(path.join(ASSETS_DIR, 'fixtureService.js'), 'utf8');
const scoringJs = fs.readFileSync(path.join(ASSETS_DIR, 'scoringService.js'), 'utf8');
const pointsJs = fs.readFileSync(path.join(ASSETS_DIR, 'pointsService.js'), 'utf8');
const performanceJs = fs.readFileSync(path.join(ASSETS_DIR, 'performanceService.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(ASSETS_DIR, 'script.js'), 'utf8');

// 1. Replace the external CSS link with an inline <style> block
//    Pattern: <link rel="stylesheet" href="style.css?v=...">
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="style\.css[^"]*"\s*>/i,
  `<style>${css}</style>`
);

// 2. Replace the external adminService.js script with inline <script>
html = html.replace(
  /<script\s+src="adminService\.js[^"]*"\s*><\/script>/i,
  `<script>${adminJs}</script>`
);

// 3. Replace the external orgRegistrationService.js script with inline <script>
html = html.replace(
  /<script\s+src="orgRegistrationService\.js[^"]*"\s*><\/script>/i,
  `<script>${orgRegJs}</script>`
);

// 4. Replace the external playerService.js script with inline <script>
html = html.replace(
  /<script\s+src="playerService\.js[^"]*"\s*><\/script>/i,
  `<script>${playerJs}</script>`
);

// 4.5. Replace the external tournamentService.js script with inline <script>
html = html.replace(
  /<script\s+src="tournamentService\.js[^"]*"\s*><\/script>/i,
  `<script>${tournamentJs}</script>`
);

// 4.6. Replace the external officialService.js script with inline <script>
html = html.replace(
  /<script\s+src="officialService\.js[^"]*"\s*><\/script>/i,
  `<script>${officialJs}</script>`
);

// 4.7. Replace the external fixtureService.js script with inline <script>
html = html.replace(
  /<script\s+src="fixtureService\.js[^"]*"\s*><\/script>/i,
  `<script>${fixtureJs}</script>`
);

// 4.8. Replace the external scoringService.js script with inline <script>
html = html.replace(
  /<script\s+src="scoringService\.js[^"]*"\s*><\/script>/i,
  `<script>${scoringJs}</script>`
);

// 4.9. Replace the external pointsService.js script with inline <script>
html = html.replace(
  /<script\s+src="pointsService\.js[^"]*"\s*><\/script>/i,
  `<script>${pointsJs}</script>`
);

// 4.10. Replace the external performanceService.js script with inline <script>
html = html.replace(
  /<script\s+src="performanceService\.js[^"]*"\s*><\/script>/i,
  `<script>${performanceJs}</script>`
);

const dynamicPortalJs = fs.readFileSync(path.join(ASSETS_DIR, 'dynamicPortalService.js'), 'utf8');

// 5. Replace the external script.js with inline <script>
html = html.replace(
  /<script\s+src="script\.js[^"]*"\s*><\/script>/i,
  `<script>${mainJs}</script>\n<script>${dynamicPortalJs}</script>`
);

// Write bundled.html
const bundledPath = path.join(ASSETS_DIR, 'bundled.html');
fs.writeFileSync(bundledPath, html, 'utf8');
console.log(`✅ Written: ${bundledPath} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);

// Also copy to public/bundled.html for Web and mobile
const publicBundledPath = path.join(__dirname, 'public', 'bundled.html');
fs.writeFileSync(publicBundledPath, html, 'utf8');
console.log(`✅ Written: ${publicBundledPath}`);

// 4. Generate inlineHtml.ts
//    Escape special characters for a JS/TS string literal
let escaped = html
  .replace(/\\/g, '\\\\')       // backslashes first
  .replace(/"/g, '\\"')          // double quotes
  .replace(/\n/g, '\\n')        // newlines
  .replace(/\r/g, '\\r')        // carriage returns
  .replace(/\t/g, '\\t');       // tabs

const tsContent = `export const INLINE_HTML = "${escaped}";\n`;
const tsPath = path.join(ASSETS_DIR, 'inlineHtml.ts');
fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log(`✅ Written: ${tsPath} (${(Buffer.byteLength(tsContent) / 1024).toFixed(1)} KB)`);

console.log('\n🎯 Next step: run  node embed_assets.js  to embed base64 images.');
