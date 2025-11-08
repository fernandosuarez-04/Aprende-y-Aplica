const fs = require('fs');
const path = require('path');

// Archivos a excluir (loggers)
const EXCLUDED_FILES = [
  'secure-logger.ts',
  'dev-logger.ts'
];

// Directorios a excluir
const EXCLUDED_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'scripts'
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
    
    // Dividir en líneas para procesar una por una
    const lines = content.split('\n');
    let inMultiLineConsole = false;
    let multiLineIndent = '';
    
    const processedLines = lines.map((line, index) => {
      // Si la línea ya está comentada completamente, no hacer nada
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) {
        return line;
      }
      
      // Detectar inicio de console.log multi-línea
      const consoleStartMatch = line.match(/^(\s*)(console\.(log|error|warn|info|debug)\([^)]*)$/);
      if (consoleStartMatch && !line.includes(');')) {
        inMultiLineConsole = true;
        multiLineIndent = consoleStartMatch[1];
        return `${multiLineIndent}// ${consoleStartMatch[2]}`;
      }
      
      // Si estamos en un console.log multi-línea, comentar todas las líneas hasta encontrar el cierre
      if (inMultiLineConsole) {
        // Detectar cierre del console.log
        if (line.includes(');') || line.includes('); //')) {
          inMultiLineConsole = false;
          // Comentar la línea de cierre manteniendo la indentación original
          const closeMatch = line.match(/^(\s*)(.*\);.*)$/);
          if (closeMatch) {
            return `${closeMatch[1]}// ${closeMatch[2]}`;
          }
        } else {
          // Comentar línea intermedia manteniendo indentación
          const indentMatch = line.match(/^(\s*)(.*)$/);
          if (indentMatch) {
            return `${indentMatch[1]}// ${indentMatch[2]}`;
          }
        }
      }
      
      // Buscar console.log/error/warn/info/debug en una sola línea (puede tener comentario al final)
      const consoleMatch = line.match(/^(\s*)(console\.(log|error|warn|info|debug)\(.*?\);?\s*(?:\/\/.*)?)$/);
      if (consoleMatch) {
        const indent = consoleMatch[1];
        const consoleCall = consoleMatch[2];
        return `${indent}// ${consoleCall}`;
      }
      
      return line;
    });
    
    const newContent = processedLines.join('\n');
    
    // Si hubo cambios, escribir el archivo
    if (newContent !== originalContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
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
  try {
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
  } catch (error) {
    // Ignorar errores de acceso
  }
  
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
    if (modified % 10 === 0) {
      console.log(`Procesados ${processed}/${files.length}, modificados: ${modified}`);
    }
  }
});

console.log(`\nProcesados: ${processed} archivos`);
console.log(`Modificados: ${modified} archivos`);

