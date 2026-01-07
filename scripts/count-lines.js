#!/usr/bin/env node

/**
 * Script para contar líneas de código en el proyecto
 * 
 * Uso: node scripts/count-lines.js
 * 
 * Cuenta líneas de código en archivos:
 * - TypeScript/JavaScript: .ts, .tsx, .js, .jsx
 * - Estilos: .css, .scss
 * - Documentación: .md
 * - Configuración: .json
 * - SQL: .sql
 * - HTML: .html
 */

const fs = require('fs');
const path = require('path');

// Configuración
const ROOT_DIR = path.resolve(__dirname, '..');

// Extensiones a contar
const EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx',  // JavaScript/TypeScript
  '.css', '.scss',               // Estilos
  '.md',                         // Documentación
  '.json',                       // Configuración
  '.sql',                        // Base de datos
  '.html',                       // HTML
  '.yaml', '.yml',               // YAML
];

// Directorios a ignorar
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.idea',
  '.vscode',
  '.claude',
];

// Archivos a ignorar
const IGNORE_FILES = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

// Estadísticas por extensión
const stats = {};

// Inicializar estadísticas
EXTENSIONS.forEach(ext => {
  stats[ext] = {
    files: 0,
    lines: 0,
    blankLines: 0,
    commentLines: 0,
    codeLines: 0,
  };
});

/**
 * Cuenta las líneas de un archivo
 */
function countFileLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const ext = path.extname(filePath).toLowerCase();
  
  let blankLines = 0;
  let commentLines = 0;
  let codeLines = 0;
  let inBlockComment = false;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Línea vacía
    if (trimmedLine === '') {
      blankLines++;
      return;
    }
    
    // Detectar comentarios según el tipo de archivo
    if (['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'].includes(ext)) {
      // Comentarios de bloque
      if (inBlockComment) {
        commentLines++;
        if (trimmedLine.includes('*/')) {
          inBlockComment = false;
        }
        return;
      }
      
      if (trimmedLine.startsWith('/*')) {
        commentLines++;
        if (!trimmedLine.includes('*/')) {
          inBlockComment = true;
        }
        return;
      }
      
      // Comentarios de línea
      if (trimmedLine.startsWith('//')) {
        commentLines++;
        return;
      }
    }
    
    // Comentarios en Markdown (no contamos como comentarios, todo es "código")
    if (ext === '.md') {
      codeLines++;
      return;
    }
    
    // SQL comments
    if (ext === '.sql') {
      if (trimmedLine.startsWith('--') || trimmedLine.startsWith('#')) {
        commentLines++;
        return;
      }
    }
    
    // HTML comments
    if (ext === '.html') {
      if (trimmedLine.startsWith('<!--')) {
        commentLines++;
        return;
      }
    }
    
    // YAML comments
    if (['.yaml', '.yml'].includes(ext)) {
      if (trimmedLine.startsWith('#')) {
        commentLines++;
        return;
      }
    }
    
    codeLines++;
  });
  
  return {
    total: lines.length,
    blankLines,
    commentLines,
    codeLines,
  };
}

/**
 * Recorre el directorio recursivamente
 */
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Ignorar directorios específicos
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(filePath, callback);
      }
    } else {
      // Ignorar archivos específicos
      if (!IGNORE_FILES.includes(file)) {
        callback(filePath);
      }
    }
  });
}

/**
 * Procesa todos los archivos
 */
function processFiles() {
  console.log('\n🔍 Escaneando proyecto...\n');
  console.log(`📁 Directorio raíz: ${ROOT_DIR}\n`);
  
  const filesByFolder = {};
  
  walkDir(ROOT_DIR, (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    if (EXTENSIONS.includes(ext)) {
      try {
        const counts = countFileLines(filePath);
        
        stats[ext].files++;
        stats[ext].lines += counts.total;
        stats[ext].blankLines += counts.blankLines;
        stats[ext].commentLines += counts.commentLines;
        stats[ext].codeLines += counts.codeLines;
        
        // Agrupar por carpeta principal
        const relativePath = path.relative(ROOT_DIR, filePath);
        const mainFolder = relativePath.split(path.sep)[0];
        
        if (!filesByFolder[mainFolder]) {
          filesByFolder[mainFolder] = { files: 0, lines: 0 };
        }
        filesByFolder[mainFolder].files++;
        filesByFolder[mainFolder].lines += counts.total;
        
      } catch (error) {
        console.error(`Error procesando ${filePath}: ${error.message}`);
      }
    }
  });
  
  return filesByFolder;
}

/**
 * Formatea un número con separadores de miles
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Imprime los resultados
 */
function printResults(filesByFolder) {
  console.log('═'.repeat(80));
  console.log('📊 RESUMEN POR TIPO DE ARCHIVO');
  console.log('═'.repeat(80));
  
  // Encabezado de tabla
  console.log(
    '│ Extensión'.padEnd(14) +
    '│ Archivos'.padEnd(12) +
    '│ Total'.padEnd(12) +
    '│ Código'.padEnd(12) +
    '│ Comentarios'.padEnd(14) +
    '│ Vacías'.padEnd(10) +
    '│'
  );
  console.log('─'.repeat(80));
  
  // Totales generales
  let totalFiles = 0;
  let totalLines = 0;
  let totalCode = 0;
  let totalComments = 0;
  let totalBlank = 0;
  
  // Ordenar por número de líneas
  const sortedStats = Object.entries(stats)
    .filter(([_, data]) => data.files > 0)
    .sort((a, b) => b[1].lines - a[1].lines);
  
  sortedStats.forEach(([ext, data]) => {
    console.log(
      `│ ${ext.padEnd(11)} ` +
      `│ ${formatNumber(data.files).padStart(9)} ` +
      `│ ${formatNumber(data.lines).padStart(9)} ` +
      `│ ${formatNumber(data.codeLines).padStart(9)} ` +
      `│ ${formatNumber(data.commentLines).padStart(11)} ` +
      `│ ${formatNumber(data.blankLines).padStart(7)} ` +
      `│`
    );
    
    totalFiles += data.files;
    totalLines += data.lines;
    totalCode += data.codeLines;
    totalComments += data.commentLines;
    totalBlank += data.blankLines;
  });
  
  // Línea de totales
  console.log('─'.repeat(80));
  console.log(
    `│ ${'TOTAL'.padEnd(11)} ` +
    `│ ${formatNumber(totalFiles).padStart(9)} ` +
    `│ ${formatNumber(totalLines).padStart(9)} ` +
    `│ ${formatNumber(totalCode).padStart(9)} ` +
    `│ ${formatNumber(totalComments).padStart(11)} ` +
    `│ ${formatNumber(totalBlank).padStart(7)} ` +
    `│`
  );
  console.log('═'.repeat(80));
  
  // Resumen por carpeta
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('📁 RESUMEN POR CARPETA PRINCIPAL');
  console.log('═'.repeat(50));
  
  const sortedFolders = Object.entries(filesByFolder)
    .sort((a, b) => b[1].lines - a[1].lines);
  
  sortedFolders.forEach(([folder, data]) => {
    const bar = '█'.repeat(Math.ceil(data.lines / totalLines * 30));
    const percentage = ((data.lines / totalLines) * 100).toFixed(1);
    console.log(
      `${folder.padEnd(20)} ${formatNumber(data.lines).padStart(8)} líneas (${percentage.padStart(5)}%) ${bar}`
    );
  });
  
  console.log('═'.repeat(50));
  
  // Resumen final
  console.log('\n');
  console.log('╔' + '═'.repeat(40) + '╗');
  console.log('║' + ' 📈 ESTADÍSTICAS FINALES '.padStart(27).padEnd(40) + '║');
  console.log('╠' + '═'.repeat(40) + '╣');
  console.log(`║ 📄 Total de archivos:    ${formatNumber(totalFiles).padStart(12)} ║`);
  console.log(`║ 📝 Total de líneas:      ${formatNumber(totalLines).padStart(12)} ║`);
  console.log(`║ 💻 Líneas de código:     ${formatNumber(totalCode).padStart(12)} ║`);
  console.log(`║ 💬 Líneas de comentario: ${formatNumber(totalComments).padStart(12)} ║`);
  console.log(`║ ⬜ Líneas vacías:        ${formatNumber(totalBlank).padStart(12)} ║`);
  console.log('╚' + '═'.repeat(40) + '╝');
  
  // Porcentajes
  if (totalLines > 0) {
    console.log('\n📊 Distribución:');
    console.log(`   Código:      ${((totalCode / totalLines) * 100).toFixed(1)}%`);
    console.log(`   Comentarios: ${((totalComments / totalLines) * 100).toFixed(1)}%`);
    console.log(`   Vacías:      ${((totalBlank / totalLines) * 100).toFixed(1)}%`);
  }
  
  console.log('\n✅ Análisis completado!\n');
}

// Ejecutar
const filesByFolder = processFiles();
printResults(filesByFolder);
