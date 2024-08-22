const fs = require('fs');
require('dotenv').config();

// Process manifest.json
let manifest = fs.readFileSync('manifest.json', 'utf8');
manifest = manifest.replace('__CLIENT_ID__', process.env.CLIENT_ID);
fs.writeFileSync('dist/manifest.json', manifest);

// Process background.js
let background = fs.readFileSync('background.js', 'utf8');
background = background.replace('__SHEET_ID__', process.env.SHEET_ID);
fs.writeFileSync('dist/background.js', background);

console.log('Build completed. Files written to dist/ directory.');
