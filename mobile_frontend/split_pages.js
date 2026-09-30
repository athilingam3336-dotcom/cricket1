const fs = require('fs');
let html = fs.readFileSync('assets_web/index.html', 'utf8');

const sectionsToExtract = [
  'operations-hub',
  'match-centre',
  'tournaments',
  'points-table',
  'stats',
  'players-spotlight',
  'about',
  'grounds',
  'academy',
  'news',
  'gallery',
  'contact'
];

// Instead of extracting HTML physically which is risky and might break layout (e.g. footer inside/outside), 
// let's just make the existing `navigateToRoute` hide other sections inside page-home!
// Actually, modifying `script.js` is much safer and meets requirements exactly.
