const fs = require('fs');
const html = fs.readFileSync('assets_web/index.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<!-- PAGE') || l.includes('id="page-')) {
    console.log(i + 1, l.trim());
  }
});
