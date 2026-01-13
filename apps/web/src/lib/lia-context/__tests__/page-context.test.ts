/**
 * Tests para el Sistema de Contexto Dinámico de LIA - Fase 1
 * 
 * Este archivo contiene tests para verificar el funcionamiento del
 * PageContextService y el sistema de metadata de páginas.
 * 
 * Para ejecutar: npx ts-node apps/web/src/lib/lia-context/__tests__/page-context.test.ts
 */

import { PageContextService } from '../services/page-context.service';
import { PAGE_METADATA, getRegisteredRoutes, hasPageMetadata } from '../config/page-metadata';

// ============================================================================
// TESTS
// ============================================================================

console.log('\n🧪 === TESTS DEL SISTEMA DE CONTEXTO DINÁMICO DE LIA ===\n');

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

// ----------------------------------------------------------------------------
// Test 1: Verificar que hay páginas registradas
// ----------------------------------------------------------------------------
test('Hay páginas registradas en PAGE_METADATA', () => {
  const routes = getRegisteredRoutes();
  console.log(`   → Páginas registradas: ${routes.length}`);
  return routes.length >= 5;
});

// ----------------------------------------------------------------------------
// Test 2: Verificar las 5 páginas críticas
// ----------------------------------------------------------------------------
const criticalPages = [
  '/[orgSlug]/business-panel/courses',
  '/[orgSlug]/business-panel/users',
  '/[orgSlug]/business-user/dashboard',
  '/courses/[slug]/learn',
  '/study-planner/dashboard'
];

criticalPages.forEach(page => {
  test(`Página crítica "${page}" tiene metadata`, () => {
    return hasPageMetadata(page);
  });
});

// ----------------------------------------------------------------------------
// Test 3: Verificar matching de rutas dinámicas
// ----------------------------------------------------------------------------
test('Matching de ruta dinámica /acme/business-panel/courses', () => {
  const metadata = PageContextService.getPageMetadata('/acme/business-panel/courses');
  return metadata !== null && metadata.pageType === 'business_panel_courses';
});

test('Matching de ruta dinámica /company-xyz/business-user/dashboard', () => {
  const metadata = PageContextService.getPageMetadata('/company-xyz/business-user/dashboard');
  return metadata !== null && metadata.pageType === 'business_user_dashboard';
});

test('Matching de ruta dinámica /courses/react-basics/learn', () => {
  const metadata = PageContextService.getPageMetadata('/courses/react-basics/learn');
  return metadata !== null && metadata.pageType === 'course_learn';
});

// ----------------------------------------------------------------------------
// Test 4: Verificar contenido del contexto de página
// ----------------------------------------------------------------------------
test('buildPageContext incluye componentes', () => {
  const context = PageContextService.buildPageContext('/acme/business-panel/courses');
  return context.includes('Componentes') && context.includes('BusinessCoursesPage');
});

test('buildPageContext incluye APIs', () => {
  const context = PageContextService.buildPageContext('/acme/business-panel/courses');
  return context.includes('APIs') && context.includes('/api/');
});

test('buildPageContext incluye flujos de usuario', () => {
  const context = PageContextService.buildPageContext('/acme/business-panel/courses');
  return context.includes('Flujos') && context.includes('Asignar curso');
});

// ----------------------------------------------------------------------------
// Test 5: Verificar contexto de bug report
// ----------------------------------------------------------------------------
test('buildBugReportContext incluye información técnica detallada', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.includes('INFORMACIÓN TÉCNICA') && 
         context.includes('Archivo:') && 
         context.includes('Errores comunes');
});

test('buildBugReportContext incluye problemas conocidos y soluciones', () => {
  const context = PageContextService.buildBugReportContext('/acme/business-panel/courses');
  return context.includes('Problemas conocidos') && context.includes('Soluciones');
});

// ----------------------------------------------------------------------------
// Test 6: Verificar que ruta inexistente retorna mensaje apropiado
// ----------------------------------------------------------------------------
test('Ruta inexistente retorna mensaje de "no hay metadata"', () => {
  const context = PageContextService.buildPageContext('/pagina/que/no/existe');
  return context.includes('No hay metadata');
});

// ----------------------------------------------------------------------------
// Test 7: Verificar estructura de metadata
// ----------------------------------------------------------------------------
test('Cada página tiene todos los campos requeridos', () => {
  for (const [route, metadata] of Object.entries(PAGE_METADATA)) {
    if (!metadata.route || !metadata.routePattern || !metadata.pageType) {
      console.log(`   → Fallo en: ${route}`);
      return false;
    }
    if (!Array.isArray(metadata.components) || !Array.isArray(metadata.apis)) {
      console.log(`   → Fallo en arrays: ${route}`);
      return false;
    }
  }
  return true;
});

// ----------------------------------------------------------------------------
// Test 8: Verificar estimación de tokens
// ----------------------------------------------------------------------------
test('estimateTokens calcula aproximadamente bien', () => {
  const text = 'Este es un texto de prueba con 100 caracteres aproximadamente para verificar la estimación.....';
  const tokens = PageContextService.estimateTokens(text);
  // ~100 chars / 4 = ~25 tokens
  return tokens >= 20 && tokens <= 30;
});

// ============================================================================
// RESUMEN
// ============================================================================

console.log('\n📊 === RESUMEN DE TESTS ===\n');
console.log(`✅ Tests pasados: ${passed}`);
console.log(`❌ Tests fallidos: ${failed}`);
console.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

if (failed === 0) {
  console.log('🎉 ¡Todos los tests pasaron! El sistema de contexto dinámico está funcionando correctamente.\n');
} else {
  console.log('⚠️ Algunos tests fallaron. Revisar la implementación.\n');
  process.exit(1);
}

// ============================================================================
// DEMO: Mostrar contexto generado
// ============================================================================

console.log('📄 === DEMO: CONTEXTO GENERADO ===\n');

const demoRoutes = [
  '/acme/business-panel/courses',
  '/company/business-user/dashboard'
];

demoRoutes.forEach(route => {
  console.log(`\n--- Contexto para: ${route} ---\n`);
  const context = PageContextService.buildPageContext(route);
  console.log(context.substring(0, 1000) + (context.length > 1000 ? '\n...[truncado]' : ''));
});






