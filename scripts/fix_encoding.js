const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../apps/web/src');

// Map of corrupted characters to their correct values
const replacements = {
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã±': 'ñ',
    'Ã‘': 'Ñ',
    'Ã“': 'Ó',
    'Ãš': 'Ú',
    'Ã‰': 'É',
    'Ã ': 'à',
    'Ã¼': 'ü',
    'Â¡': '¡',
    'Â¿': '¿'
};

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

let fixedCount = 0;
let filesCount = 0;

console.log('Starting encoding fix scan...');

walkDir(targetDir, (filePath) => {
    // Only process text files
    if (!filePath.match(/\.(ts|tsx|js|jsx|json|md|css|html)$/)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        let hasChanges = false;

        // Naive replacement - iterate over keys
        for (const [bad, good] of Object.entries(replacements)) {
            if (content.includes(bad)) {
                // Global replace
                content = content.split(bad).join(good);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${filePath}`);
            fixedCount++;
        }
        filesCount++;
    } catch (e) {
        console.error(`Error processing ${filePath}:`, e.message);
    }
});

console.log(`\nScan complete.`);
console.log(`Processed ${filesCount} files.`);
console.log(`Fixed encoding in ${fixedCount} files.`);
