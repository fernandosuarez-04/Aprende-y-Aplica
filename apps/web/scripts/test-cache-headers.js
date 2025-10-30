/**
 * Script de Testing para Cache Headers
 * 
 * Ejecutar: node apps/web/scripts/test-cache-headers.js
 * 
 * Este script verifica que los cache headers estén configurados correctamente
 * en las rutas API principales.
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

// Configuración
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

// Rutas a testear con cache esperado
const ROUTES_TO_TEST = [
  {
    path: '/api/communities',
    method: 'GET',
    expectedCache: 'static',
    expectedHeaders: {
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'cdn-cache-control': 'max-age=3600'
    }
  },
  {
    path: '/api/communities/profesionales',
    method: 'GET',
    expectedCache: 'static',
    expectedHeaders: {
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'cdn-cache-control': 'max-age=3600'
    }
  },
  {
    path: '/api/communities/profesionales/posts',
    method: 'GET',
    expectedCache: 'semiStatic',
    expectedHeaders: {
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      'cdn-cache-control': 'max-age=300'
    }
  },
  {
    path: '/api/courses',
    method: 'GET',
    expectedCache: 'static',
    expectedHeaders: {
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'cdn-cache-control': 'max-age=3600'
    }
  },
  {
    path: '/api/auth/me',
    method: 'GET',
    expectedCache: 'private',
    expectedHeaders: {
      'cache-control': 'private, no-cache, no-store, must-revalidate',
      'pragma': 'no-cache',
      'expires': '0'
    }
  },
  {
    path: '/api/admin/communities',
    method: 'GET',
    expectedCache: 'semiStatic',
    expectedHeaders: {
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      'cdn-cache-control': 'max-age=300'
    }
  }
]

/**
 * Test individual de una ruta
 */
async function testRoute(route) {
  const url = `${BASE_URL}${route.path}`
  
  try {
    console.log(`\n${COLORS.cyan}Testing: ${route.method} ${route.path}${COLORS.reset}`)
    console.log(`Expected cache: ${COLORS.yellow}${route.expectedCache}${COLORS.reset}`)
    
    const response = await fetch(url, {
      method: route.method,
      headers: {
        'Accept': 'application/json'
      }
    })

    // Verificar headers
    const headers = {}
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase()
    })

    let passed = true
    const errors = []

    // Verificar cada header esperado
    for (const [headerName, expectedValue] of Object.entries(route.expectedHeaders)) {
      const actualValue = headers[headerName]
      
      if (!actualValue) {
        passed = false
        errors.push(`  ❌ Header "${headerName}" not found`)
      } else if (actualValue !== expectedValue.toLowerCase()) {
        passed = false
        errors.push(`  ❌ Header "${headerName}" mismatch:`)
        errors.push(`     Expected: ${expectedValue}`)
        errors.push(`     Got:      ${actualValue}`)
      } else {
        console.log(`  ✅ ${headerName}: ${actualValue}`)
      }
    }

    if (!passed) {
      console.log(`\n${COLORS.red}FAILED${COLORS.reset}`)
      errors.forEach(err => console.log(err))
      return false
    } else {
      console.log(`\n${COLORS.green}PASSED${COLORS.reset}`)
      return true
    }

  } catch (error) {
    console.log(`\n${COLORS.red}ERROR: ${error.message}${COLORS.reset}`)
    return false
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log(`${COLORS.blue}╔════════════════════════════════════════════╗${COLORS.reset}`)
  console.log(`${COLORS.blue}║  Cache Headers Test Suite                  ║${COLORS.reset}`)
  console.log(`${COLORS.blue}╚════════════════════════════════════════════╝${COLORS.reset}`)
  console.log(`\nBase URL: ${BASE_URL}`)
  console.log(`Total routes to test: ${ROUTES_TO_TEST.length}\n`)

  let passed = 0
  let failed = 0

  for (const route of ROUTES_TO_TEST) {
    const result = await testRoute(route)
    if (result) {
      passed++
    } else {
      failed++
    }
  }

  // Resumen
  console.log(`\n${COLORS.blue}═══════════════════════════════════════════${COLORS.reset}`)
  console.log(`${COLORS.blue}Summary:${COLORS.reset}`)
  console.log(`  Total:  ${ROUTES_TO_TEST.length}`)
  console.log(`  ${COLORS.green}Passed: ${passed}${COLORS.reset}`)
  console.log(`  ${COLORS.red}Failed: ${failed}${COLORS.reset}`)
  
  if (failed === 0) {
    console.log(`\n${COLORS.green}✅ All tests passed!${COLORS.reset}`)
    process.exit(0)
  } else {
    console.log(`\n${COLORS.red}❌ Some tests failed${COLORS.reset}`)
    process.exit(1)
  }
}

// Ejecutar
runAllTests().catch(error => {
  console.error(`${COLORS.red}Fatal error:${COLORS.reset}`, error)
  process.exit(1)
})
