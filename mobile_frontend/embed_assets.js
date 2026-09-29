const fs = require('fs');
const path = require('path');

let htmlContent = fs.readFileSync('assets_web/inlineHtml.ts', 'utf8');
let bundledHtmlContent = fs.readFileSync('assets_web/bundled.html', 'utf8');

const assetsDir = path.join(__dirname, '../assets');

const filesToEmbed = {
    'assets/logo_transparent.png': 'image/png',
    'assets/logo.jpg': 'image/jpeg',
    'assets/stadium.jpg': 'image/jpeg',
    'assets/watermark.png': 'image/png',
    'assets/batsman.jpg': 'image/jpeg',
    'assets/champions.jpg': 'image/jpeg'
};

for (const [assetPath, mimeType] of Object.entries(filesToEmbed)) {
    const filePath = path.join(assetsDir, path.basename(assetPath));
    if (fs.existsSync(filePath)) {
        const base64Data = fs.readFileSync(filePath).toString('base64');
        const dataUri = `data:${mimeType};base64,${base64Data}`;
        
        // Use a global regular expression to replace all occurrences
        const regex = new RegExp(assetPath.replace(/\//g, '\\/') + '(\\?v=[a-zA-Z0-9_]+)?', 'g');
        htmlContent = htmlContent.replace(regex, dataUri);
        bundledHtmlContent = bundledHtmlContent.replace(regex, dataUri);
        console.log(`Embedded ${assetPath}`);
    } else {
        console.log(`Warning: ${filePath} not found.`);
    }
}

fs.writeFileSync('assets_web/inlineHtml.ts', htmlContent);
console.log('Successfully updated inlineHtml.ts');

fs.writeFileSync('public/bundled.html', bundledHtmlContent);
console.log('Successfully updated public/bundled.html');
