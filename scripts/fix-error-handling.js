/**
 * Script para automatizar el fix de error handling en archivos API
 * Fix del Issue #2: Stack traces expuestos en respuestas de error
 */

const fs = require('fs');
const path = require('path');

// Archivos a arreglar
const filesToFix = [
  'apps/web/src/app/api/admin/prompts/[id]/toggle-featured/route.ts',
  'apps/web/src/app/api/admin/prompts/[id]/toggle-status/route.ts',
  'apps/web/src/app/api/admin/upload/community-image/route.ts',
  'apps/web/src/app/api/admin/debug/tables/route.ts',
  'apps/web/src/app/api/ai-directory/generate-prompt/route.ts',
  'apps/web/src/app/api/categories/route.ts',
  'apps/web/src/app/api/communities/[slug]/leagues/route.ts',
  'apps/web/src/app/api/communities/[slug]/members/route.ts',
  'apps/web/src/app/api/courses/route.ts',
  'apps/web/src/app/api/courses/[slug]/route.ts',
  'apps/web/src/app/api/favorites/route.ts',
  'apps/web/src/app/api/news/route.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return false;
  }

  console.log(`🔧 Procesando: ${filePath}`);

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. Agregar import si no existe
  if (!content.includes('formatApiError') && !content.includes('logError')) {
    const importMatch = content.match(/^(import .* from 'next\/server'.*\n)/m);
    if (importMatch) {
      const importLine = "import { formatApiError, logError } from '@/core/utils/api-errors'\n";
      content = content.replace(
        importMatch[0],
        importMatch[0] + importLine
      );
      modified = true;
      console.log(`  ✅ Import agregado`);
    }
  }

  // 2. Reemplazar console.error + return con logError + formatApiError
  const errorPatterns = [
    // Patrón 1: console.error con error.stack expuesto
    {
      regex: /console\.error\(['"].*?Error.*?:['"],\s*error\)[\s\S]*?return NextResponse\.json\(\s*\{[\s\S]*?error:\s*error instanceof Error \? error\.message.*?details:\s*error instanceof Error \? error\.stack.*?\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      replacement: (match, status, errorMsg) => {
        const msgMatch = match.match(/['"]([^'"]*Error[^'"]*)['"]/) || [];
        const message = msgMatch[1] || 'Error en la operación';
        const cleanMessage = message
          .replace('💥 Error in ', '')
          .replace('Error in ', '')
          .replace(/:/g, '')
          .trim();

        return `logError('${cleanMessage}', error)\n    return NextResponse.json(\n      formatApiError(error, '${extractUserMessage(message)}'),\n      { status: ${status} }\n    )`;
      }
    },
    // Patrón 2: console.error simple con error.message
    {
      regex: /console\.error\(['"].*?Error.*?:['"],\s*error\)[\s\S]*?return NextResponse\.json\(\s*\{[\s\S]*?error:\s*error instanceof Error \? error\.message.*?\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      replacement: (match, status) => {
        const msgMatch = match.match(/['"]([^'"]*Error[^'"]*)['"]/) || [];
        const message = msgMatch[1] || 'Error en la operación';
        const cleanMessage = message
          .replace('💥 Error in ', '')
          .replace('Error in ', '')
          .replace(/:/g, '')
          .trim();

        const userMsg = extractUserMessage(match);
        return `logError('${cleanMessage}', error)\n    return NextResponse.json(\n      formatApiError(error, '${userMsg}'),\n      { status: ${status} }\n    )`;
      }
    }
  ];

  errorPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern.regex);
    if (matches && matches.length > 0) {
      content = content.replace(pattern.regex, (match, ...args) => {
        const status = args[args.length - 3]; // El status está en el penúltimo grupo de captura
        return pattern.replacement(match, status);
      });
      modified = true;
      console.log(`  ✅ Patrón ${index + 1} corregido (${matches.length} ocurrencias)`);
    }
  });

  // Guardar archivo modificado
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Archivo guardado\n`);
    return true;
  } else {
    console.log(`  ℹ️  No se requieren cambios\n`);
    return false;
  }
}

function extractUserMessage(errorBlock) {
  // Extraer mensaje amigable para el usuario del bloque de error
  const userMsgMatch = errorBlock.match(/error:\s*['"]([^'"]+)['"]/);
  if (userMsgMatch && userMsgMatch[1] !== 'error instanceof Error ? error.message') {
    return userMsgMatch[1];
  }

  // Fallback: generar mensaje genérico
  if (errorBlock.includes('crear')) return 'Error al crear recurso';
  if (errorBlock.includes('actualizar')) return 'Error al actualizar recurso';
  if (errorBlock.includes('eliminar')) return 'Error al eliminar recurso';
  if (errorBlock.includes('obtener')) return 'Error al obtener datos';

  return 'Error en la operación';
}

// Ejecutar fix
console.log('\n🚀 Iniciando fix de error handling...\n');
console.log(`📝 Total de archivos a procesar: ${filesToFix.length}\n`);

let fixedCount = 0;
let skippedCount = 0;

filesToFix.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  } else {
    skippedCount++;
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN');
console.log('='.repeat(50));
console.log(`✅ Archivos modificados: ${fixedCount}`);
console.log(`ℹ️  Archivos sin cambios: ${skippedCount}`);
console.log(`📁 Total procesados: ${filesToFix.length}`);
console.log('='.repeat(50) + '\n');

if (fixedCount > 0) {
  console.log('🎉 Fix completado exitosamente!');
  console.log('\n💡 Próximos pasos:');
  console.log('  1. Revisar cambios con git diff');
  console.log('  2. Ejecutar npm run build para verificar');
  console.log('  3. Testear endpoints afectados\n');
}
