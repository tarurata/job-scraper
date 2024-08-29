const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const ts = require('typescript');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to compile TypeScript
function compileTypeScript() {
    console.log('Compiling TypeScript...');
    const configPath = ts.findConfigFile(
        "./",
        ts.sys.fileExists,
        "tsconfig.json"
    );
    if (!configPath) {
        throw new Error("Could not find a valid 'tsconfig.json'.");
    }

    const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
    const { options, fileNames } = ts.parseJsonConfigFileContent(
        config,
        ts.sys,
        "./"
    );

    const program = ts.createProgram(fileNames, options);
    const emitResult = program.emit();

    const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });

    if (emitResult.emitSkipped) {
        throw new Error("TypeScript compilation failed");
    }
    console.log('TypeScript compilation complete.');
}

// Function to copy a file
function copyFile(source, target) {
    fs.copyFileSync(source, target);
}

// Function to process a file (replace placeholders and handle JSON parsing if needed)
function processFile(filename) {
    const source = path.join(__dirname, 'dist', filename);
    let content = fs.readFileSync(source, 'utf8');

    if (filename === 'manifest.json') {
        // Parse JSON to handle potential nested structures
        let manifestJson = JSON.parse(content);
        manifestJson.oauth2.client_id = process.env.CLIENT_ID;
        content = JSON.stringify(manifestJson, null, 2); // Pretty print with 2 spaces
    } else if (filename === 'background.js') {
        content = content.replace('__SHEET_ID__', process.env.SHEET_ID);
    }

    fs.writeFileSync(source, content);
    console.log(`Processed ${filename}`);
}

// Main build function
function build() {
    console.log('Starting build process...');

    // Compile TypeScript
    compileTypeScript();

    // Create dist directory if it doesn't exist
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    // List of files to process
    const filesToProcess = [
        'manifest.json',
        'background.js',
        'popup.html',
        // Add any other files that need processing
    ];

    // Process each file
    filesToProcess.forEach(processFile);

    console.log('Build completed. Files processed in dist/ directory.');

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
}

// Run the build process
build();