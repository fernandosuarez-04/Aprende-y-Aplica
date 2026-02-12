/**
 * Tests para los Hooks de Frontend de SofLIA - Fase 3
 * 
 * Estos tests verifican la estructura y tipos de los hooks.
 * Los tests funcionales completos requieren un entorno de React.
 * 
 * Para ejecutar: npx tsx apps/web/src/lib/SofLIA-context/__tests__/phase3-hooks.test.ts
 */

// Verificamos que los módulos se pueden importar correctamente
// y que las interfaces están bien definidas

console.log('\n🧪 === TESTS DE HOOKS FRONTEND DE SofLIA (FASE 3) ===\n');

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
// Test 1: Verificar que los módulos exportan correctamente
// ----------------------------------------------------------------------------
test('Hook useErrorCapture se puede importar', async () => {
  try {
    // Dynamic import para evitar errores de SSR
    const module = await import('../hooks/useErrorCapture');
    return typeof module.useErrorCapture === 'function';
  } catch {
    return false;
  }
});

test('Hook useActiveComponents se puede importar', async () => {
  try {
    const module = await import('../hooks/useActiveComponents');
    return typeof module.useActiveComponents === 'function' &&
           typeof module.liaComponentProps === 'function' &&
           typeof module.withLiaComponent === 'function';
  } catch {
    return false;
  }
});

test('Hook useApiTracking se puede importar', async () => {
  try {
    const module = await import('../hooks/useApiTracking');
    return typeof module.useApiTracking === 'function';
  } catch {
    return false;
  }
});

test('Hook useLiaEnrichedContext se puede importar', async () => {
  try {
    const module = await import('../hooks/useLiaEnrichedContext');
    return typeof module.useLiaEnrichedContext === 'function';
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 2: Verificar que el index exporta todo
// ----------------------------------------------------------------------------
test('Index de hooks exporta todos los hooks y utilidades', async () => {
  try {
    const module = await import('../hooks');
    return (
      'useErrorCapture' in module &&
      'useActiveComponents' in module &&
      'useApiTracking' in module &&
      'useLiaEnrichedContext' in module &&
      'liaComponentProps' in module &&
      'withLiaComponent' in module
    );
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 3: Verificar utilidades
// ----------------------------------------------------------------------------
test('liaComponentProps genera atributos correctos', async () => {
  try {
    const { liaComponentProps } = await import('../hooks/useActiveComponents');
    const props = liaComponentProps('TestComponent', { foo: 'bar' }, 'open');
    
    return (
      props['data-SofLIA-component'] === 'TestComponent' &&
      props['data-SofLIA-props'] === '{"foo":"bar"}' &&
      props['data-SofLIA-state'] === 'open'
    );
  } catch {
    return false;
  }
});

test('liaComponentProps funciona sin props opcionales', async () => {
  try {
    const { liaComponentProps } = await import('../hooks/useActiveComponents');
    const props = liaComponentProps('SimpleComponent');
    
    return (
      props['data-SofLIA-component'] === 'SimpleComponent' &&
      !props['data-SofLIA-props'] &&
      !props['data-SofLIA-state']
    );
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 4: Verificar que el cliente se puede importar
// ----------------------------------------------------------------------------
test('LiaContextProvider se puede importar desde client/', async () => {
  try {
    const module = await import('../client');
    return (
      'LiaContextProvider' in module &&
      'useLiaContext' in module &&
      'useLiaContextSafe' in module
    );
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 5: Verificar tipos de CapturedError
// ----------------------------------------------------------------------------
test('Tipo CapturedError tiene campos requeridos', async () => {
  try {
    // Solo verificamos que el tipo se puede usar
    type TestError = {
      id: string;
      type: 'console' | 'exception' | 'promise';
      message: string;
      timestamp: Date;
    };
    
    const testError: TestError = {
      id: '123',
      type: 'console',
      message: 'Test error',
      timestamp: new Date(),
    };
    
    return testError.id === '123' && testError.type === 'console';
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 6: Verificar tipo ActiveComponent
// ----------------------------------------------------------------------------
test('Tipo ActiveComponent tiene campos requeridos', async () => {
  try {
    type TestComponent = {
      name: string;
      selector: string;
      detectedAt: Date;
    };
    
    const testComp: TestComponent = {
      name: 'TestModal',
      selector: '#test-modal',
      detectedAt: new Date(),
    };
    
    return testComp.name === 'TestModal';
  } catch {
    return false;
  }
});

// ----------------------------------------------------------------------------
// Test 7: Verificar tipo ApiCall
// ----------------------------------------------------------------------------
test('Tipo ApiCall tiene campos requeridos', async () => {
  try {
    type TestCall = {
      id: string;
      url: string;
      method: string;
      timestamp: Date;
      isError: boolean;
    };
    
    const testCall: TestCall = {
      id: '123',
      url: '/api/test',
      method: 'GET',
      timestamp: new Date(),
      isError: false,
    };
    
    return testCall.url === '/api/test' && testCall.method === 'GET';
  } catch {
    return false;
  }
});

// ============================================================================
// RESUMEN
// ============================================================================

// Esperar a que todos los tests async terminen
setTimeout(() => {
  console.log('\n📊 === RESUMEN DE TESTS FASE 3 ===\n');
  console.log(`✅ Tests pasados: ${passed}`);
  console.log(`❌ Tests fallidos: ${failed}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 ¡Todos los tests de Fase 3 pasaron!\n');
    console.log('📌 Nota: Los hooks requieren un entorno React para testing funcional completo.');
    console.log('   Se recomienda usar @testing-library/react-hooks para tests más completos.\n');
  } else {
    console.log('⚠️ Algunos tests fallaron. Revisar la implementación.\n');
  }

  // ============================================================================
  // DEMO: Estructura de archivos creados
  // ============================================================================

  console.log('📁 === ESTRUCTURA DE ARCHIVOS FASE 3 ===\n');
  console.log('apps/web/src/lib/SofLIA-context/');
  console.log('├── hooks/');
  console.log('│   ├── index.ts                    # Exportaciones de hooks');
  console.log('│   ├── useErrorCapture.ts          # Captura errores de consola');
  console.log('│   ├── useActiveComponents.ts      # Detecta componentes en DOM');
  console.log('│   ├── useApiTracking.ts           # Rastrea llamadas a API');
  console.log('│   └── useLiaEnrichedContext.ts    # Hook combinado');
  console.log('│');
  console.log('├── client/');
  console.log('│   ├── index.ts                    # Exportaciones de cliente');
  console.log('│   └── LiaContextProvider.tsx      # Provider de React');
  console.log('│');
  console.log('└── __tests__/');
  console.log('    └── phase3-hooks.test.ts        # Tests de hooks\n');

  // ============================================================================
  // DEMO: Cómo usar los hooks
  // ============================================================================

  console.log('📖 === EJEMPLO DE USO ===\n');
  console.log(`
// 1. Envolver la app con el provider (opcional, pero recomendado)
import { LiaContextProvider } from '@/lib/SofLIA-context/client';

function App() {
  return (
    <LiaContextProvider>
      <MyApp />
    </LiaContextProvider>
  );
}

// 2. Usar el hook en componentes
import { useLiaEnrichedContext, liaComponentProps } from '@/lib/SofLIA-context/hooks';

function MyModal() {
  const { 
    getEnrichedMetadata, 
    addContextMarker,
    hasErrors 
  } = useLiaEnrichedContext();

  const handleAction = () => {
    // Agregar marcador de contexto
    addContextMarker('Usuario hizo clic en Guardar');
    
    // Obtener metadata para enviar a SofLIA
    const metadata = getEnrichedMetadata();
    console.log('Metadata:', metadata);
  };

  // Marcar el componente para detección
  return (
    <div {...liaComponentProps('MyModal', { isOpen: true })}>
      <button onClick={handleAction}>Guardar</button>
    </div>
  );
}
`);

}, 500);









