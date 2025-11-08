#!/usr/bin/env node

/**
 * ⚡ SCRIPT DE LIMPIEZA DE CONSOLE.LOG
 *
 * Elimina todos los console.log, console.warn, console.info de archivos sensibles
 * Mantiene solo console.error para errores críticos
 *
 * USO:
 * node scripts/clean-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Archivos y directorios a limpiar (rutas relativas desde la raíz del proyecto)
const TARGETS = [
  // Autenticación (CRÍTICO - expone tokens, user IDs)
  'apps/web/src/features/auth/actions/login.ts',
  'apps/web/src/lib/auth/refreshToken.service.ts',
  'apps/web/src/features/auth/hooks/useSessionRefresh.ts',
  'apps/web/src/features/auth/actions/reset-password.ts',

  // Cuestionarios (CRÍTICO - expone datos de usuario)
  'apps/web/src/app/questionnaire/direct/page.tsx',
  'apps/web/src/app/questionnaire/page.tsx',

  // Servicios Admin (expone estadísticas y datos de negocio)
  'apps/web/src/features/admin/services/',

  // Servicios Business Panel
  'apps/web/src/features/business-panel/services/',

  // Servicios Instructor
  'apps/web/src/features/instructor/services/',

  // API Routes (expone queries y respuestas)
  'apps/web/src/app/api/',

  // Core components
  'apps/web/src/core/components/AIChatAgent/',
  'apps/web/src/core/components/VideoPlayer/',
  'apps/web/src/core/components/ReporteProblema/',
];

// Patrones a eliminar (regex)
const PATTERNS_TO_REMOVE = [
  // console.log con cualquier contenido
  /console\.log\([^)]*\);?\s*\n?/g,

  // console.info
  /console\.info\([^)]*\);?\s*\n?/g,

  // console.warn (excepto en archivos de pooling)
  /console\.warn\([^)]*\);?\s*\n?/g,

  // console.debug
  /console\.debug\([^)]*\);?\s*\n?/g,
];

// Archivos donde SOLO limpiar pero mantener en DEV mode
const DEV_ONLY_FILES = [
  'apps/web/src/lib/supabase/pool.ts',
  'apps/web/src/lib/supabase/request-deduplication.ts',
  'apps/web/src/lib/supabase/server.ts',
];

let totalFilesProcessed = 0;
let totalLogsRemoved = 0;

/**
 * Procesa un archivo individual
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let logsRemoved = 0;

    // Contar cuántos console.log hay antes
    const beforeCount = (content.match(/console\.(log|info|warn|debug)/g) || []).length;

    // Para archivos DEV_ONLY, envolver en if (process.env.NODE_ENV === 'development')
    if (DEV_ONLY_FILES.some(devFile => filePath.includes(devFile))) {
      // Ya tienen protección DEV, solo mantener
      console.log(`  ⏭️  Skipping ${path.basename(filePath)} (DEV-only file - already protected)`);
      return;
    }

    // Aplicar cada patrón de eliminación
    PATTERNS_TO_REMOVE.forEach(pattern => {
      content = content.replace(pattern, '');
    });

    // Limpiar líneas vacías múltiples (dejar máximo 2)
    content = content.replace(/\n\n\n+/g, '\n\n');

    // Contar cuántos quedaron
    const afterCount = (content.match(/console\.(log|info|warn|debug)/g) || []).length;
    logsRemoved = beforeCount - afterCount;

    if (logsRemoved > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ ${path.basename(filePath)}: ${logsRemoved} console statements removed`);
      totalLogsRemoved += logsRemoved;
    }

    totalFilesProcessed++;

  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Procesa un directorio recursivamente
 */
function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Ignorar node_modules y .next
        if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist') {
          processDirectory(fullPath);
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        processFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

/**
 * Main
 */
function main() {
  console.log('🧹 Starting console.log cleanup...\n');

  const rootDir = path.join(__dirname, '..');

  TARGETS.forEach(target => {
    const fullPath = path.join(rootDir, target);

    console.log(`📁 Processing: ${target}`);

    try {
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        processDirectory(fullPath);
      } else if (stats.isFile()) {
        processFile(fullPath);
      }
    } catch (error) {
      console.log(`  ⚠️  Path not found (skipping): ${target}`);
    }

    console.log('');
  });

  console.log('=' .repeat(60));
  console.log(`✨ Cleanup complete!`);
  console.log(`📊 Files processed: ${totalFilesProcessed}`);
  console.log(`🗑️  Console statements removed: ${totalLogsRemoved}`);
  console.log('=' .repeat(60));
  console.log('\n⚠️  IMPORTANT: Review changes before committing!');
  console.log('   git diff to see what was removed\n');
}

main();
