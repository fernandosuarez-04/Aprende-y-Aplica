/**
 * Script para remover console.log del código
 * Mantiene console.warn y console.error
 *
 * Uso: node scripts/remove-console-logs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Directorios a procesar
const DIRS_TO_PROCESS = [
  'apps/web/src',
  'apps/api/src'
];

// Extensiones a procesar
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Patrones a remover (console.log y console.info)
const CONSOLE_PATTERNS = [
  // console.log(...) en una línea
  /^\s*console\.log\([^)]*\);?\s*$/gm,
  // console.info(...) en una línea
  /^\s*console\.info\([^)]*\);?\s*$/gm,
  // console.debug(...) en una línea
  /^\s*console\.debug\([^)]*\);?\s*$/gm,
  // console.table(...) en una línea
  /^\s*console\.table\([^)]*\);?\s*$/gm,
  // console.dir(...) en una línea
  /^\s*console\.dir\([^)]*\);?\s*$/gm,
  // console.trace(...) en una línea
  /^\s*console\.trace\([^)]*\);?\s*$/gm,
  // console.time/timeEnd en una línea
  /^\s*console\.time(?:End)?\([^)]*\);?\s*$/gm,
];

// Patrones multilínea más agresivos
const MULTILINE_PATTERNS = [
  // console.log con template literals o strings multilínea
  /^\s*console\.log\([^;]*\);?\s*$/gm,
  // console.log seguido de objeto en la siguiente línea
  /^\s*console\.log\(\s*['"`][^'"`]*['"`]\s*,\s*\{[\s\S]*?\}\s*\);?\s*$/gm,
];

let stats = {
  filesProcessed: 0,
  filesModified: 0,
  logsRemoved: 0,
  errors: []
};

function getAllFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Ignorar node_modules, .next, dist
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(item)) {
          getAllFiles(fullPath, files);
        }
      } else if (EXTENSIONS.includes(path.extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    stats.errors.push(`Error reading directory ${dir}: ${err.message}`);
  }

  return files;
}

function countConsoleLogs(content) {
  const matches = content.match(/console\.(log|info|debug|table|dir|trace|time|timeEnd)\(/g);
  return matches ? matches.length : 0;
}

function removeConsoleLogs(content) {
  let modified = content;
  let removed = 0;

  // Primero, intentar remover líneas completas de console.log
  for (const pattern of CONSOLE_PATTERNS) {
    const beforeCount = (modified.match(pattern) || []).length;
    modified = modified.replace(pattern, '');
    removed += beforeCount;
  }

  // Limpiar líneas vacías múltiples dejadas
  modified = modified.replace(/\n{3,}/g, '\n\n');

  return { content: modified, removed };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const initialCount = countConsoleLogs(content);

    if (initialCount === 0) {
      return; // No hay console.logs
    }

    stats.filesProcessed++;

    const { content: newContent, removed } = removeConsoleLogs(content);
    const finalCount = countConsoleLogs(newContent);
    const actualRemoved = initialCount - finalCount;

    if (actualRemoved > 0) {
      stats.logsRemoved += actualRemoved;
      stats.filesModified++;

      const relativePath = path.relative(process.cwd(), filePath);

      if (VERBOSE || DRY_RUN) {
        console.log(`  ${relativePath}: ${actualRemoved} logs removidos (${finalCount} restantes)`);
      }

      if (!DRY_RUN) {
        fs.writeFileSync(filePath, newContent, 'utf8');
      }
    }
  } catch (err) {
    stats.errors.push(`Error processing ${filePath}: ${err.message}`);
  }
}

function main() {
  console.log('');
  console.log('='.repeat(60));
  console.log('  REMOVE CONSOLE LOGS');
  console.log('='.repeat(60));
  console.log('');

  if (DRY_RUN) {
    console.log('  MODO: Dry Run (no se modificarán archivos)');
    console.log('');
  }

  const allFiles = [];

  for (const dir of DIRS_TO_PROCESS) {
    const fullDir = path.join(process.cwd(), dir);
    if (fs.existsSync(fullDir)) {
      console.log(`  Escaneando: ${dir}`);
      getAllFiles(fullDir, allFiles);
    } else {
      console.log(`  Directorio no existe: ${dir}`);
    }
  }

  console.log('');
  console.log(`  Total archivos encontrados: ${allFiles.length}`);
  console.log('');
  console.log('  Procesando...');
  console.log('');

  for (const file of allFiles) {
    processFile(file);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('  RESULTADOS');
  console.log('='.repeat(60));
  console.log('');
  console.log(`  Archivos con console.logs: ${stats.filesProcessed}`);
  console.log(`  Archivos modificados: ${stats.filesModified}`);
  console.log(`  Console.logs removidos: ${stats.logsRemoved}`);

  if (stats.errors.length > 0) {
    console.log('');
    console.log('  ERRORES:');
    stats.errors.forEach(err => console.log(`    - ${err}`));
  }

  console.log('');

  if (DRY_RUN && stats.logsRemoved > 0) {
    console.log('  Para aplicar los cambios, ejecuta:');
    console.log('  node scripts/remove-console-logs.js');
    console.log('');
  }
}

main();
