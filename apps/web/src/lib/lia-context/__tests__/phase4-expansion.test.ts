/**
 * Tests para la Fase 4 - Expansión y Optimización
 * 
 * Verifica:
 * - Nuevas páginas de Admin Panel con metadata
 * - Nuevas páginas de Business Panel con metadata
 * - Sistema de caché
 * - CourseContextProvider
 * 
 * Para ejecutar: npx tsx apps/web/src/lib/lia-context/__tests__/phase4-expansion.test.ts
 */

import { PageContextService } from '../services/page-context.service';
import { ContextCacheService } from '../services/context-cache.service';
import { PAGE_METADATA, getRegisteredRoutes } from '../config/page-metadata';

console.log('\n🧪 === TESTS DE EXPANSIÓN DE LIA (FASE 4) ===\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error}`);
    failed++;
  }
}

// ============================================================================
// Test 1: Nuevas páginas de Admin Panel
// ============================================================================
console.log('\n📋 Tests de páginas Admin Panel:\n');

const adminPages = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/companies',
  '/admin/reportes',
  '/admin/lia-analytics',
  '/admin/news',
  '/admin/communities',
];

adminPages.forEach(page => {
  test(`Página ${page} tiene metadata`, () => {
    const metadata = PageContextService.getPageMetadata(page);
    return metadata !== null;
  });
});

// ============================================================================
// Test 2: Nuevas páginas de Business Panel
// ============================================================================
console.log('\n📋 Tests de páginas Business Panel:\n');

const businessPages = [
  '/acme/business-panel/dashboard',
  '/acme/business-panel/analytics',
  '/acme/business-panel/progress',
  '/acme/business-panel/reports',
  '/acme/business-panel/settings',
  '/acme/business-panel/hierarchy',
  '/acme/business-panel/courses',
  '/acme/business-panel/users',
];

businessPages.forEach(page => {
  test(`Página ${page} tiene metadata`, () => {
    const metadata = PageContextService.getPageMetadata(page);
    return metadata !== null;
  });
});

// ============================================================================
// Test 3: Total de páginas registradas
// ============================================================================
console.log('\n📋 Tests de cantidad de páginas:\n');

test('Hay al menos 18 páginas registradas', () => {
  const routes = getRegisteredRoutes();
  console.log(`   → Total de páginas: ${routes.length}`);
  return routes.length >= 18;
});

test('Las páginas tienen componentes definidos', () => {
  for (const [route, metadata] of Object.entries(PAGE_METADATA)) {
    if (!metadata.components || metadata.components.length === 0) {
      console.log(`   → ${route} no tiene componentes`);
      return false;
    }
  }
  return true;
});

test('Las páginas tienen APIs definidas', () => {
  for (const [route, metadata] of Object.entries(PAGE_METADATA)) {
    if (!metadata.apis || metadata.apis.length === 0) {
      console.log(`   → ${route} no tiene APIs`);
      return false;
    }
  }
  return true;
});

// ============================================================================
// Test 4: Sistema de caché
// ============================================================================
console.log('\n📋 Tests de sistema de caché:\n');

test('ContextCacheService está disponible', () => {
  return typeof ContextCacheService.get === 'function' &&
         typeof ContextCacheService.set === 'function';
});

test('Cache set/get funciona correctamente', () => {
  const testKey = 'test-key';
  const testValue = 'test-value';
  
  ContextCacheService.set(testKey, testValue);
  const retrieved = ContextCacheService.get<string>(testKey);
  
  return retrieved === testValue;
});

test('Cache de página funciona', () => {
  const page = '/test/page';
  const context = 'Test context content';
  
  ContextCacheService.setPageContext(page, context);
  const retrieved = ContextCacheService.getPageContext(page);
  
  return retrieved === context;
});

test('Cache getStats retorna información', () => {
  const stats = ContextCacheService.getStats();
  return 'hits' in stats && 
         'misses' in stats && 
         'entries' in stats && 
         'hitRate' in stats;
});

test('Cache invalidateByPattern funciona', () => {
  ContextCacheService.set('pattern:test1', 'value1');
  ContextCacheService.set('pattern:test2', 'value2');
  ContextCacheService.set('other:test', 'value3');
  
  const invalidated = ContextCacheService.invalidateByPattern('pattern:');
  
  return invalidated === 2 && 
         ContextCacheService.get('pattern:test1') === undefined &&
         ContextCacheService.get('other:test') === 'value3';
});

test('Cache clear limpia todo', () => {
  ContextCacheService.set('clear-test', 'value');
  ContextCacheService.clear();
  
  return ContextCacheService.get('clear-test') === undefined;
});

// ============================================================================
// Test 5: CourseContextProvider
// ============================================================================
console.log('\n📋 Tests de CourseContextProvider:\n');

test('CourseContextProvider se puede importar', async () => {
  try {
    const module = await import('../providers/course');
    return 'CourseContextProvider' in module;
  } catch {
    return false;
  }
});

test('CourseContextProvider tiene prioridad correcta', async () => {
  try {
    const { CourseContextProvider } = await import('../providers/course');
    const provider = new CourseContextProvider();
    return provider.priority === 60;
  } catch {
    return false;
  }
});

test('CourseContextProvider.shouldInclude funciona', async () => {
  try {
    const { CourseContextProvider } = await import('../providers/course');
    const provider = new CourseContextProvider();
    return provider.shouldInclude('course') && 
           provider.shouldInclude('learning') &&
           !provider.shouldInclude('admin');
  } catch {
    return false;
  }
});

// ============================================================================
// RESUMEN
// ============================================================================

console.log('\n📊 === RESUMEN DE TESTS FASE 4 ===\n');
console.log(`✅ Tests pasados: ${passed}`);
console.log(`❌ Tests fallidos: ${failed}`);
console.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed === 0) {
  console.log('🎉 ¡Todos los tests de Fase 4 pasaron!\n');
} else {
  console.log('⚠️ Algunos tests fallaron. Revisar la implementación.\n');
  process.exit(1);
}

// ============================================================================
// DEMO: Estadísticas de páginas
// ============================================================================

console.log('📄 === ESTADÍSTICAS DE PÁGINAS ===\n');

const routes = getRegisteredRoutes();
const byCategory: Record<string, number> = {};

routes.forEach(route => {
  let category = 'Otras';
  if (route.includes('admin')) category = 'Admin Panel';
  else if (route.includes('business-panel')) category = 'Business Panel';
  else if (route.includes('business-user')) category = 'Business User';
  else if (route.includes('courses')) category = 'Cursos';
  else if (route.includes('study-planner')) category = 'Study Planner';
  
  byCategory[category] = (byCategory[category] || 0) + 1;
});

console.log('Páginas por categoría:');
Object.entries(byCategory).forEach(([category, count]) => {
  console.log(`  - ${category}: ${count} páginas`);
});
console.log(`\nTotal: ${routes.length} páginas con metadata\n`);

// ============================================================================
// DEMO: Cache stats
// ============================================================================

console.log('📊 === ESTADÍSTICAS DE CACHÉ ===\n');
const cacheStats = ContextCacheService.getStats();
console.log(`  - Entradas: ${cacheStats.entries}`);
console.log(`  - Hits: ${cacheStats.hits}`);
console.log(`  - Misses: ${cacheStats.misses}`);
console.log(`  - Hit Rate: ${cacheStats.hitRate}%\n`);






