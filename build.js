const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

// Function to copy a file
function copyFile(source, target) {
    fs.copyFileSync(source, target);
}

// Function to process a file (replace placeholders or copy)
function processFile(filename) {
    const source = path.join(__dirname, filename);
    const target = path.join(__dirname, 'dist', filename);

    let content = fs.readFileSync(source, 'utf8');

    // Replace placeholders
    if (filename === 'manifest.json') {
        content = content.replace('__CLIENT_ID__', process.env.CLIENT_ID);
    } else if (filename === 'background.js') {
        content = content.replace('__SHEET_ID__', process.env.SHEET_ID);
    }

    // Write processed file
    fs.writeFileSync(target, content);
}

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
}

// List of files to process/copy
const filesToProcess = [
    'manifest.json',
    'background.js',
    'content.js',
    'popup.js',
    'popup.html',
];

// Process each file
filesToProcess.forEach(processFile);

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