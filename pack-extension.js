const fs = require('fs');
const { exec } = require('child_process');
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

// Pack the extension
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extensionPath = `${__dirname}/dist`;
const privateKeyPath = `${__dirname}/private_key.pem`;

exec(`"${chromePath}" --pack-extension="${extensionPath}" --pack-extension-key="${privateKeyPath}"`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error packing extension: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Packing stderr: ${stderr}`);
  }
  console.log(`Extension packed successfully: ${stdout}`);
  
  // Move the .crx file to the dist directory
  fs.renameSync('dist.crx', 'dist/extension.crx');
  console.log('Packed extension moved to dist/extension.crx');
});