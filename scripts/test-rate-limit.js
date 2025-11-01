/**
 * Script para probar el sistema de rate limiting
 * 
 * Uso:
 *   node test-rate-limit.js
 * 
 * Requisitos:
 *   - El servidor debe estar corriendo (npm run dev)
 *   - Ejecutar desde la raíz del proyecto
 */

const BASE_URL = 'http://localhost:3000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test 1: Verificar rate limit en auth endpoint
 */
async function testAuthRateLimit() {
  log('\n=== Test 1: Auth Rate Limit (5 requests / 15 min) ===', 'blue');
  
  const results = [];
  
  for (let i = 1; i <= 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'wrongpassword'
        })
      });
      
      const limit = response.headers.get('X-RateLimit-Limit');
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      
      const result = {
        request: i,
        status: response.status,
        limit,
        remaining,
        reset,
        blocked: response.status === 429
      };
      
      results.push(result);
      
      if (result.blocked) {
        const body = await response.json();
        log(`  Request ${i}: ❌ BLOQUEADO (429) - ${body.error}`, 'red');
        log(`    Retry after: ${body.retryAfter}`, 'gray');
      } else {
        log(`  Request ${i}: ✓ Permitido (${response.status}) - Remaining: ${remaining}/${limit}`, 'green');
      }
      
      // Pequeña pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      log(`  Request ${i}: ❌ Error - ${error.message}`, 'red');
    }
  }
  
  // Verificar resultados
  const blockedCount = results.filter(r => r.blocked).length;
  if (blockedCount > 0) {
    log(`\n✅ Test pasado: ${blockedCount} requests bloqueadas`, 'green');
  } else {
    log('\n⚠️  Test fallido: Ninguna request fue bloqueada', 'yellow');
  }
  
  return results;
}

/**
 * Test 2: Verificar rate limit en API general
 */
async function testApiRateLimit() {
  log('\n=== Test 2: API General Rate Limit (100 requests / 1 min) ===', 'blue');
  
  const testRequests = 105; // Intentar exceder el límite
  let successCount = 0;
  let blockedCount = 0;
  
  log(`Enviando ${testRequests} requests...`, 'gray');
  
  for (let i = 1; i <= testRequests; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/test`, {
        method: 'GET',
      });
      
      if (response.status === 429) {
        blockedCount++;
        if (blockedCount === 1) {
          const body = await response.json();
          log(`  Request ${i}: Primera request bloqueada`, 'yellow');
          log(`    Mensaje: ${body.error}`, 'gray');
        }
      } else {
        successCount++;
      }
      
      // Mostrar progreso cada 10 requests
      if (i % 10 === 0) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        log(`  Progreso: ${i}/${testRequests} - Remaining: ${remaining}`, 'gray');
      }
      
    } catch (error) {
      // Ignorar errores de red
    }
  }
  
  log(`\nResultados:`, 'blue');
  log(`  ✓ Exitosas: ${successCount}`, 'green');
  log(`  ❌ Bloqueadas: ${blockedCount}`, 'red');
  
  if (blockedCount > 0) {
    log(`\n✅ Test pasado: Rate limit funcionando correctamente`, 'green');
  } else {
    log(`\n⚠️  Test fallido: No se bloqueó ninguna request`, 'yellow');
  }
}

/**
 * Test 3: Verificar headers de rate limit
 */
async function testRateLimitHeaders() {
  log('\n=== Test 3: Verificar Headers de Rate Limit ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test`, {
      method: 'GET',
    });
    
    const headers = {
      limit: response.headers.get('X-RateLimit-Limit'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
      reset: response.headers.get('X-RateLimit-Reset')
    };
    
    log('Headers recibidos:', 'gray');
    log(`  X-RateLimit-Limit: ${headers.limit}`, headers.limit ? 'green' : 'red');
    log(`  X-RateLimit-Remaining: ${headers.remaining}`, headers.remaining ? 'green' : 'red');
    log(`  X-RateLimit-Reset: ${headers.reset}`, headers.reset ? 'green' : 'red');
    
    const allPresent = headers.limit && headers.remaining && headers.reset;
    
    if (allPresent) {
      log('\n✅ Test pasado: Todos los headers presentes', 'green');
    } else {
      log('\n⚠️  Test fallido: Faltan algunos headers', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Error verificando headers: ${error.message}`, 'red');
  }
}

/**
 * Test 4: Verificar estadísticas de rate limit
 */
async function testRateLimitStats() {
  log('\n=== Test 4: Estadísticas de Rate Limit ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/rate-limit/stats`, {
      method: 'GET',
    });
    
    if (response.status === 401) {
      log('⚠️  No autenticado - saltando test de estadísticas', 'yellow');
      return;
    }
    
    const data = await response.json();
    
    if (data.success) {
      log(`Total de entradas: ${data.data.totalEntries}`, 'green');
      log(`\nPrimeras 5 entradas:`, 'gray');
      
      data.data.entries.slice(0, 5).forEach((entry, index) => {
        log(`  ${index + 1}. ${entry.identifier}`, 'gray');
        log(`     Count: ${entry.count}, Reset: ${entry.resetTime}`, 'gray');
      });
      
      log('\n✅ Test pasado: Estadísticas disponibles', 'green');
    } else {
      log(`❌ Error: ${data.error}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Error obteniendo estadísticas: ${error.message}`, 'red');
  }
}

/**
 * Test 5: Limpiar rate limits (solo desarrollo)
 */
async function testClearRateLimits() {
  log('\n=== Test 5: Limpiar Rate Limits ===', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/rate-limit/stats`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      log('✅ Rate limits limpiados exitosamente', 'green');
    } else {
      log(`⚠️  ${data.error}`, 'yellow');
    }
    
  } catch (error) {
    log(`❌ Error limpiando rate limits: ${error.message}`, 'red');
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  log('\n╔═══════════════════════════════════════╗', 'blue');
  log('║   TEST SUITE: RATE LIMITING SYSTEM   ║', 'blue');
  log('╚═══════════════════════════════════════╝', 'blue');
  
  try {
    // Test 1: Auth rate limit
    await testAuthRateLimit();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: API general rate limit (comentado por defecto, toma tiempo)
    // await testApiRateLimit();
    // await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Headers
    await testRateLimitHeaders();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Estadísticas
    await testRateLimitStats();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5: Limpiar (para permitir re-ejecutar tests)
    await testClearRateLimits();
    
    log('\n╔═══════════════════════════════════════╗', 'blue');
    log('║        TESTS COMPLETADOS              ║', 'blue');
    log('╚═══════════════════════════════════════╝', 'blue');
    
  } catch (error) {
    log(`\n❌ Error ejecutando tests: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Verificar que el servidor esté corriendo
async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    if (response.ok || response.status === 404) {
      return true;
    }
  } catch (error) {
    log('❌ Error: El servidor no está corriendo en http://localhost:3000', 'red');
    log('   Por favor, ejecuta "npm run dev" primero', 'yellow');
    process.exit(1);
  }
}

// Ejecutar tests
(async () => {
  await checkServer();
  await runAllTests();
})();
