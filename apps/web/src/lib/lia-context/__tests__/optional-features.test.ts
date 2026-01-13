/**
 * Tests para las funcionalidades opcionales del sistema de contexto de LIA
 * 
 * Incluye:
 * - Nuevas páginas con metadata
 * - UserContextProvider
 * - PlatformContextProvider
 * - ContextMetricsService
 * - Utilidades de data-lia-component
 */

// Mock de parseLiaElement para entorno sin DOM
function parseLiaElement(element: { getAttribute: (name: string) => string | null }) {
  const name = element.getAttribute('data-lia-component');
  if (!name) return null;
  return { name };
}

// ============================================================================
// TEST: METADATA DE PÁGINAS ADICIONALES
// ============================================================================

import { PAGE_METADATA, getRegisteredRoutes, hasPageMetadata } from '../config/page-metadata';
import { PageContextService } from '../services/page-context.service';

function testNewPageMetadata() {
  console.log('\n📄 TEST: METADATA DE PÁGINAS ADICIONALES\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Verificar que hay más de 30 páginas registradas
  const routes = getRegisteredRoutes();
  if (routes.length >= 30) {
    console.log(`✅ Hay ${routes.length} páginas registradas (>= 30)`);
    passed++;
  } else {
    console.log(`❌ Solo hay ${routes.length} páginas, se esperaban >= 30`);
    failed++;
  }

  // Test 2: Verificar páginas de Auth
  const authPages = routes.filter(r => r.includes('/auth'));
  if (authPages.length >= 5) {
    console.log(`✅ ${authPages.length} páginas de Auth registradas`);
    passed++;
  } else {
    console.log(`❌ Solo ${authPages.length} páginas de Auth`);
    failed++;
  }

  // Test 3: Verificar páginas de Admin
  const adminPages = routes.filter(r => r.startsWith('/admin'));
  if (adminPages.length >= 10) {
    console.log(`✅ ${adminPages.length} páginas de Admin registradas`);
    passed++;
  } else {
    console.log(`❌ Solo ${adminPages.length} páginas de Admin`);
    failed++;
  }

  // Test 4: Verificar que /profile existe
  if (hasPageMetadata('/profile')) {
    console.log('✅ Página /profile tiene metadata');
    passed++;
  } else {
    console.log('❌ Página /profile no tiene metadata');
    failed++;
  }

  // Test 5: Verificar que /certificates existe
  if (hasPageMetadata('/certificates')) {
    console.log('✅ Página /certificates tiene metadata');
    passed++;
  } else {
    console.log('❌ Página /certificates no tiene metadata');
    failed++;
  }

  // Test 6: Verificar página de comunidades
  if (hasPageMetadata('/communities/[slug]')) {
    console.log('✅ Página /communities/[slug] tiene metadata');
    passed++;
  } else {
    console.log('❌ Página /communities/[slug] no tiene metadata');
    failed++;
  }

  // Test 7: Verificar páginas de instructor
  const instructorPages = routes.filter(r => r.includes('/instructor'));
  if (instructorPages.length >= 3) {
    console.log(`✅ ${instructorPages.length} páginas de Instructor registradas`);
    passed++;
  } else {
    console.log(`❌ Solo ${instructorPages.length} páginas de Instructor`);
    failed++;
  }

  // Test 8: Verificar páginas del Study Planner
  const studyPlannerPages = routes.filter(r => r.includes('/study-planner'));
  if (studyPlannerPages.length >= 3) {
    console.log(`✅ ${studyPlannerPages.length} páginas de Study Planner`);
    passed++;
  } else {
    console.log(`❌ Solo ${studyPlannerPages.length} páginas de Study Planner`);
    failed++;
  }

  // Test 9: Verificar que la metadata de /auth tiene userFlows
  const authMeta = PAGE_METADATA['/auth'];
  if (authMeta && authMeta.userFlows && authMeta.userFlows.length > 0) {
    console.log(`✅ /auth tiene ${authMeta.userFlows.length} flujos de usuario`);
    passed++;
  } else {
    console.log('❌ /auth no tiene flujos de usuario');
    failed++;
  }

  // Test 10: Verificar metadata de /dashboard
  if (hasPageMetadata('/dashboard')) {
    console.log('✅ Página /dashboard tiene metadata');
    passed++;
  } else {
    console.log('❌ Página /dashboard no tiene metadata');
    failed++;
  }

  // Test 11: Conteo de páginas por categoría
  const categories = {
    admin: routes.filter(r => r.startsWith('/admin')).length,
    business: routes.filter(r => r.includes('business-panel') || r.includes('business-user')).length,
    auth: routes.filter(r => r.includes('/auth')).length,
    courses: routes.filter(r => r.includes('/courses') || r.includes('/course')).length,
    instructor: routes.filter(r => r.includes('/instructor')).length,
    other: 0
  };
  categories.other = routes.length - Object.values(categories).reduce((a, b) => a + b, 0);
  
  console.log('\n📊 Distribución de páginas:');
  console.log(`   Admin: ${categories.admin}`);
  console.log(`   Business: ${categories.business}`);
  console.log(`   Auth: ${categories.auth}`);
  console.log(`   Courses: ${categories.courses}`);
  console.log(`   Instructor: ${categories.instructor}`);
  console.log(`   Otras: ${categories.other}`);

  return { passed, failed };
}

// ============================================================================
// TEST: USER CONTEXT PROVIDER
// ============================================================================

import { UserContextProvider } from '../providers/user/UserContextProvider';

async function testUserContextProvider() {
  console.log('\n👤 TEST: USER CONTEXT PROVIDER\n');
  let passed = 0;
  let failed = 0;

  const provider = new UserContextProvider();

  // Test 1: Nombre y prioridad
  if (provider.name === 'user') {
    console.log('✅ Provider name es "user"');
    passed++;
  } else {
    console.log(`❌ Provider name es "${provider.name}"`);
    failed++;
  }

  if (provider.priority === 30) {
    console.log('✅ Prioridad es 30');
    passed++;
  } else {
    console.log(`❌ Prioridad es ${provider.priority}`);
    failed++;
  }

  // Test 2: shouldInclude
  if (provider.shouldInclude('general')) {
    console.log('✅ Se incluye en contexto "general"');
    passed++;
  } else {
    console.log('❌ No se incluye en contexto "general"');
    failed++;
  }

  if (provider.shouldInclude('bug-report')) {
    console.log('✅ Se incluye en contexto "bug-report"');
    passed++;
  } else {
    console.log('❌ No se incluye en contexto "bug-report"');
    failed++;
  }

  // Test 3: Sin userId no retorna contexto
  const noUserContext = await provider.getContext({
    contextType: 'general'
  });
  if (noUserContext === null) {
    console.log('✅ Sin userId retorna null');
    passed++;
  } else {
    console.log('❌ Sin userId debería retornar null');
    failed++;
  }

  // Test 4: Con userId retorna contexto
  const withUserContext = await provider.getContext({
    contextType: 'general',
    userId: 'test-user-123',
    enrichedMetadata: {
      sessionDuration: 300000, // 5 minutos
      viewport: { width: 1920, height: 1080 },
      platform: { browser: 'Chrome', os: 'Windows' },
      timezone: 'America/Mexico_City',
      language: 'es-MX'
    }
  });
  if (withUserContext && withUserContext.content) {
    console.log('✅ Con userId retorna contexto');
    passed++;

    if (withUserContext.content.includes('CONTEXTO DEL USUARIO')) {
      console.log('✅ Contexto incluye header correcto');
      passed++;
    } else {
      console.log('❌ Contexto no incluye header esperado');
      failed++;
    }

    if (withUserContext.content.includes('5 minutos')) {
      console.log('✅ Contexto incluye duración de sesión');
      passed++;
    } else {
      console.log('❌ Contexto no incluye duración de sesión');
      failed++;
    }

    if (withUserContext.content.includes('Desktop')) {
      console.log('✅ Contexto detecta tipo de dispositivo');
      passed++;
    } else {
      console.log('❌ Contexto no detecta tipo de dispositivo');
      failed++;
    }
  } else {
    console.log('❌ Con userId debería retornar contexto');
    failed++;
  }

  return { passed, failed };
}

// ============================================================================
// TEST: PLATFORM CONTEXT PROVIDER
// ============================================================================

import { PlatformContextProvider } from '../providers/platform/PlatformContextProvider';

async function testPlatformContextProvider() {
  console.log('\n🌐 TEST: PLATFORM CONTEXT PROVIDER\n');
  let passed = 0;
  let failed = 0;

  const provider = new PlatformContextProvider();

  // Test 1: Nombre y prioridad
  if (provider.name === 'platform') {
    console.log('✅ Provider name es "platform"');
    passed++;
  } else {
    console.log(`❌ Provider name es "${provider.name}"`);
    failed++;
  }

  if (provider.priority === 10) {
    console.log('✅ Prioridad es 10 (baja)');
    passed++;
  } else {
    console.log(`❌ Prioridad es ${provider.priority}`);
    failed++;
  }

  // Test 2: shouldInclude
  if (provider.shouldInclude('general')) {
    console.log('✅ Se incluye en contexto "general"');
    passed++;
  } else {
    console.log('❌ No se incluye en contexto "general"');
    failed++;
  }

  if (!provider.shouldInclude('bug-report')) {
    console.log('✅ No se incluye en contexto "bug-report"');
    passed++;
  } else {
    console.log('❌ No debería incluirse en "bug-report"');
    failed++;
  }

  // Test 3: Genera contexto sin página
  const generalContext = await provider.getContext({
    contextType: 'general'
  });
  if (generalContext && generalContext.content) {
    console.log('✅ Genera contexto general');
    passed++;

    if (generalContext.content.includes('SOFIA')) {
      console.log('✅ Contexto menciona SOFIA');
      passed++;
    } else {
      console.log('❌ Contexto no menciona SOFIA');
      failed++;
    }

    if (generalContext.content.includes('Módulos Principales')) {
      console.log('✅ Contexto incluye módulos');
      passed++;
    } else {
      console.log('❌ Contexto no incluye módulos');
      failed++;
    }
  } else {
    console.log('❌ Debería generar contexto general');
    failed++;
  }

  // Test 4: Contexto con página específica
  const courseContext = await provider.getContext({
    contextType: 'general',
    currentPage: '/courses/react-basics/learn'
  });
  if (courseContext && courseContext.content.includes('Cursos')) {
    console.log('✅ Contexto de curso incluye módulo de Cursos');
    passed++;
  } else {
    console.log('❌ Contexto de curso debería incluir módulo de Cursos');
    failed++;
  }

  // Test 5: Contexto de ayuda incluye roles
  const helpContext = await provider.getContext({
    contextType: 'help'
  });
  if (helpContext && helpContext.content.includes('Roles de Usuario')) {
    console.log('✅ Contexto de ayuda incluye roles');
    passed++;
  } else {
    console.log('❌ Contexto de ayuda debería incluir roles');
    failed++;
  }

  return { passed, failed };
}

// ============================================================================
// TEST: CONTEXT METRICS SERVICE
// ============================================================================

import { ContextMetricsService, recordContextUsage, getContextStats } from '../services/context-metrics.service';

function testContextMetricsService() {
  console.log('\n📊 TEST: CONTEXT METRICS SERVICE\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Singleton
  const instance1 = ContextMetricsService.getInstance();
  const instance2 = ContextMetricsService.getInstance();
  if (instance1 === instance2) {
    console.log('✅ ContextMetricsService es singleton');
    passed++;
  } else {
    console.log('❌ No es singleton');
    failed++;
  }

  // Test 2: Registrar métricas
  recordContextUsage({
    contextType: 'general',
    currentPage: '/test/page',
    providersUsed: ['page', 'user'],
    totalTokens: 500,
    buildTimeMs: 50,
    isBugReport: false,
    userId: 'test-user',
    cached: false,
    fragmentCount: 2
  });

  recordContextUsage({
    contextType: 'bug-report',
    currentPage: '/test/page',
    providersUsed: ['page', 'bug-report'],
    totalTokens: 800,
    buildTimeMs: 100,
    isBugReport: true,
    userId: 'test-user',
    cached: false,
    fragmentCount: 3
  });

  const stats = getContextStats();
  
  if (stats.totalRequests >= 2) {
    console.log(`✅ ${stats.totalRequests} requests registrados`);
    passed++;
  } else {
    console.log(`❌ Solo ${stats.totalRequests} requests`);
    failed++;
  }

  // Test 3: Stats de tokens
  if (stats.averageTokens > 0) {
    console.log(`✅ Average tokens: ${stats.averageTokens}`);
    passed++;
  } else {
    console.log('❌ Average tokens es 0');
    failed++;
  }

  // Test 4: Stats de providers
  if (stats.providerUsageCount['page'] >= 2) {
    console.log(`✅ Provider 'page' usado ${stats.providerUsageCount['page']} veces`);
    passed++;
  } else {
    console.log('❌ Provider page no registrado correctamente');
    failed++;
  }

  // Test 5: Stats de bugs
  if (stats.bugReportCount >= 1) {
    console.log(`✅ ${stats.bugReportCount} bug reports registrados`);
    passed++;
  } else {
    console.log('❌ Bug reports no registrados');
    failed++;
  }

  // Test 6: Provider performance
  const performance = instance1.getProviderPerformance();
  if (Object.keys(performance).length > 0) {
    console.log('✅ Performance de providers disponible');
    passed++;
  } else {
    console.log('❌ Performance de providers vacía');
    failed++;
  }

  // Test 7: Bug report stats
  const bugStats = instance1.getBugReportStats();
  if (bugStats.total >= 1) {
    console.log(`✅ Bug report stats: ${bugStats.total} total`);
    passed++;
  } else {
    console.log('❌ Bug report stats vacías');
    failed++;
  }

  return { passed, failed };
}

// ============================================================================
// TEST: LIA COMPONENT UTILITIES
// ============================================================================

import { 
  liaComponent, 
  liaMarker, 
  liaModal, 
  liaForm, 
  liaDataTable,
  liaErrorBoundary,
  LIA_DATA_ATTRIBUTES
} from '../utils/lia-component';

function testLiaComponentUtilities() {
  console.log('\n🧩 TEST: LIA COMPONENT UTILITIES\n');
  let passed = 0;
  let failed = 0;

  // Test 1: liaComponent básico
  const basic = liaComponent({ name: 'TestComponent' });
  if (basic[LIA_DATA_ATTRIBUTES.COMPONENT] === 'TestComponent') {
    console.log('✅ liaComponent genera atributo correcto');
    passed++;
  } else {
    console.log('❌ liaComponent no genera atributo correcto');
    failed++;
  }

  // Test 2: liaComponent con props
  const withProps = liaComponent({ 
    name: 'Card', 
    props: { id: '123', isOpen: true },
    state: 'active'
  });
  if (withProps[LIA_DATA_ATTRIBUTES.PROPS]) {
    console.log('✅ liaComponent incluye props');
    passed++;
  } else {
    console.log('❌ liaComponent no incluye props');
    failed++;
  }

  // Test 3: liaMarker simple
  const marker = liaMarker('Button', 'disabled');
  if (marker[LIA_DATA_ATTRIBUTES.COMPONENT] === 'Button' && 
      marker[LIA_DATA_ATTRIBUTES.STATE] === 'disabled') {
    console.log('✅ liaMarker genera nombre y estado');
    passed++;
  } else {
    console.log('❌ liaMarker no funciona correctamente');
    failed++;
  }

  // Test 4: liaModal
  const modalOpen = liaModal('ConfirmDialog', true);
  const modalClosed = liaModal('ConfirmDialog', false);
  if (modalOpen[LIA_DATA_ATTRIBUTES.STATE] === 'open' &&
      modalClosed[LIA_DATA_ATTRIBUTES.STATE] === 'closed') {
    console.log('✅ liaModal maneja estado open/closed');
    passed++;
  } else {
    console.log('❌ liaModal no maneja estados correctamente');
    failed++;
  }

  // Test 5: liaForm
  const form = liaForm('LoginForm', { step: 2, hasErrors: true });
  if (form[LIA_DATA_ATTRIBUTES.STATE]?.includes('step-2') &&
      form[LIA_DATA_ATTRIBUTES.STATE]?.includes('has-errors') &&
      form[LIA_DATA_ATTRIBUTES.FEATURE] === 'form') {
    console.log('✅ liaForm genera estado y feature');
    passed++;
  } else {
    console.log('❌ liaForm no genera correctamente');
    failed++;
  }

  // Test 6: liaDataTable
  const table = liaDataTable('UsersTable', { itemCount: 50, page: 2, hasFilters: true });
  if (table[LIA_DATA_ATTRIBUTES.STATE]?.includes('items-50') &&
      table[LIA_DATA_ATTRIBUTES.STATE]?.includes('page-2') &&
      table[LIA_DATA_ATTRIBUTES.STATE]?.includes('filtered')) {
    console.log('✅ liaDataTable genera estado correcto');
    passed++;
  } else {
    console.log('❌ liaDataTable no genera estado correcto');
    failed++;
  }

  // Test 7: liaErrorBoundary
  const errorBoundary = liaErrorBoundary('AppBoundary');
  if (errorBoundary[LIA_DATA_ATTRIBUTES.ERROR_BOUNDARY] === 'true') {
    console.log('✅ liaErrorBoundary marca error boundary');
    passed++;
  } else {
    console.log('❌ liaErrorBoundary no marca correctamente');
    failed++;
  }

  // Test 8: Sanitización de props sensibles
  const sensitiveProps = liaComponent({
    name: 'LoginForm',
    props: {
      email: 'test@example.com',
      password: 'secret123',
      token: 'abc123',
      normalProp: 'visible'
    }
  });
  const propsStr = sensitiveProps[LIA_DATA_ATTRIBUTES.PROPS] || '';
  if (!propsStr.includes('password') && !propsStr.includes('token') && !propsStr.includes('secret123')) {
    console.log('✅ Props sensibles son sanitizadas');
    passed++;
  } else {
    console.log('❌ Props sensibles no se sanitizan');
    failed++;
  }

  // Test 9: LIA_DATA_ATTRIBUTES constantes
  if (LIA_DATA_ATTRIBUTES.COMPONENT === 'data-lia-component' &&
      LIA_DATA_ATTRIBUTES.STATE === 'data-lia-state') {
    console.log('✅ Constantes de atributos correctas');
    passed++;
  } else {
    console.log('❌ Constantes incorrectas');
    failed++;
  }

  return { passed, failed };
}

// ============================================================================
// TEST: CONTEXT BUILDER CON NUEVOS PROVIDERS
// ============================================================================

import { ContextBuilderService } from '../services/context-builder.service';

async function testContextBuilderWithNewProviders() {
  console.log('\n🔧 TEST: CONTEXT BUILDER CON NUEVOS PROVIDERS\n');
  let passed = 0;
  let failed = 0;

  const builder = new ContextBuilderService({
    enableMetrics: false // Desactivar métricas para este test
  });

  // Test 1: Verificar que los providers están registrados
  const stats = builder.getStats();
  if (stats.registeredProviders >= 5) {
    console.log(`✅ ${stats.registeredProviders} providers registrados`);
    passed++;
  } else {
    console.log(`❌ Solo ${stats.registeredProviders} providers`);
    failed++;
  }

  // Test 2: Verificar que user y platform están en la lista
  if (stats.providerNames.includes('user')) {
    console.log('✅ UserContextProvider registrado');
    passed++;
  } else {
    console.log('❌ UserContextProvider no registrado');
    failed++;
  }

  if (stats.providerNames.includes('platform')) {
    console.log('✅ PlatformContextProvider registrado');
    passed++;
  } else {
    console.log('❌ PlatformContextProvider no registrado');
    failed++;
  }

  // Test 3: Construir contexto general
  const context = await builder.buildContext({
    contextType: 'general',
    userId: 'test-user',
    currentPage: '/dashboard',
    enrichedMetadata: {
      viewport: { width: 1200, height: 800 },
      platform: { browser: 'Firefox', os: 'Linux' }
    }
  });

  if (context && context.length > 100) {
    console.log(`✅ Contexto general generado (${context.length} chars)`);
    passed++;
  } else {
    console.log('❌ Contexto general muy corto o vacío');
    failed++;
  }

  // Test 4: El contexto incluye información de plataforma
  if (context.includes('SOFIA')) {
    console.log('✅ Contexto incluye info de SOFIA');
    passed++;
  } else {
    console.log('❌ Contexto no incluye info de SOFIA');
    failed++;
  }

  return { passed, failed };
}

// ============================================================================
// EJECUTAR TODOS LOS TESTS
// ============================================================================

async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🧪 TESTS DE FUNCIONALIDADES OPCIONALES DE LIA');
  console.log('='.repeat(60));

  const results = {
    pageMetadata: testNewPageMetadata(),
    userProvider: await testUserContextProvider(),
    platformProvider: await testPlatformContextProvider(),
    metrics: testContextMetricsService(),
    utilities: testLiaComponentUtilities(),
    builder: await testContextBuilderWithNewProviders()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMEN DE TESTS');
  console.log('='.repeat(60));

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [name, result] of Object.entries(results)) {
    const status = result.failed === 0 ? '✅' : '⚠️';
    console.log(`${status} ${name}: ${result.passed} passed, ${result.failed} failed`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  console.log('-'.repeat(60));
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((totalPassed / (totalPassed + totalFailed)) * 100)}%`);

  if (totalFailed === 0) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  } else {
    console.log(`\n⚠️ ${totalFailed} tests fallaron`);
    process.exit(1);
  }
}

runAllTests().catch(console.error);






