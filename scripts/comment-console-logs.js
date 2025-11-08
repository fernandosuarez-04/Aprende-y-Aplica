const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Archivos a excluir (loggers y scripts de utilidad)
const EXCLUDED_FILES = [
  'secure-logger.ts',
  'dev-logger.ts',
  'clean-console-logs.js',
  'comment-console-logs.js'
];

// Directorios a excluir
const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git'
];

// Extensiones a procesar
const INCLUDED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Excluir archivos específicos
  if (EXCLUDED_FILES.some(excluded => fileName.includes(excluded))) {
    return false;
  }
  
  // Excluir directorios
  const parts = filePath.split(path.sep);
  if (EXCLUDED_DIRS.some(dir => parts.includes(dir))) {
    return false;
  }
  
  // Solo procesar extensiones específicas
  const ext = path.extname(filePath);
  return INCLUDED_EXTENSIONS.includes(ext);
}

function commentConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Patrón para encontrar console.log/error/warn/info/debug que no estén ya comentados
    // Busca líneas que empiecen con espacios/tabs seguidos de console.*
    const patterns = [
      // console.log con diferentes niveles de indentación
      /^(\s+)(console\.(log|error|warn|info|debug)\([^)]*\);?)$/gm,
      // console.log multi-línea (primeras líneas)
      /^(\s+)(console\.(log|error|warn|info|debug)\([^)]*)$/gm,
    ];
    
    // Reemplazar console.* que no estén comentados
    content = content.replace(/^(\s*)(console\.(log|error|warn|info|debug)\([^)]*\);?)$/gm, (match, indent, consoleCall) => {
      // Si ya está comentado, no hacer nada
      if (indent.trim().startsWith('//')) {
        return match;
      }
      // Comentar la línea
      return `${indent}// ${consoleCall}`;
    });
    
    // Si hubo cambios, escribir el archivo
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
    return false;
  }
}

// Encontrar todos los archivos TypeScript/JavaScript
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Procesar archivos
const rootDir = path.join(__dirname, '..');
const files = findFiles(rootDir);

console.log(`Encontrados ${files.length} archivos para procesar`);

let processed = 0;
let modified = 0;

files.forEach(file => {
  processed++;
  if (commentConsoleLogs(file)) {
    modified++;
    console.log(`✓ ${file}`);
  }
});

console.log(`\nProcesados: ${processed} archivos`);
console.log(`Modificados: ${modified} archivos`);

