const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../apps/web/public');

// Combined replacements (Accents + Emojis)
const replacements = {
    // Accents
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
    'Â¿': '¿',
    // Emojis
    'ðŸ” ': '🔍',
    'ðŸ”„': '🔄',
    'âœ…': '✅',
    'â Œ': '❌',
    'ðŸ ª': '🍪',
    'ðŸ”’': '🔒',
    'ðŸ‘¤': '👤',
    'ðŸ‘‘': '👑',
    'ðŸ“±': '📱',
    'ðŸ’¡': '💡',
    'âš ï¸ ': '⚠️',
    'ðŸš€': '🚀',
    'âœ¨': '✨',
};

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
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

console.log('Starting public folder fix scan...');

walkDir(targetDir, (filePath) => {
    // Process json and other text files
    if (!filePath.match(/\.(json|txt|html|xml|webmanifest)$/)) return;

    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let hasChanges = false;

        for (const [bad, good] of Object.entries(replacements)) {
            if (content.includes(bad)) {
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
console.log(`Fixed ${fixedCount} files.`);
