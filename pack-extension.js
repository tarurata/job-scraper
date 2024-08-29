const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config();

function packExtension() {
  console.log('Packing extension...');

  // Pack the extension
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const extensionPath = path.join(__dirname, 'dist');
  const privateKeyPath = path.join(__dirname, 'private_key.pem');

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
}

module.exports = packExtension;