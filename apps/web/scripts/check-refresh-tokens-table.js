/**
 * Script de verificación rápida - Verifica si la tabla refresh_tokens existe
 * Este script se conecta directamente a Supabase para verificar la estructura
 */

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
  console.error('   Necesitas: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('\n🔍 VERIFICANDO TABLA REFRESH_TOKENS\n');
console.log('='.repeat(70));

async function checkTable() {
  try {
    // Verificar si la tabla existe consultando su contenido
    const response = await fetch(`${SUPABASE_URL}/rest/v1/refresh_tokens?limit=0`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ La tabla refresh_tokens EXISTE\n');
      console.log('📊 Contando registros...');
      
      // Obtener el count de registros
      const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/refresh_tokens?select=count`, {
        method: 'HEAD',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact'
        }
      });
      
      const count = countResponse.headers.get('content-range')?.split('/')[1] || '0';
      console.log(`   Total de refresh tokens: ${count}\n`);
      
      console.log('✅ TODO ESTÁ CORRECTO - Puedes proceder con el login\n');
      console.log('🧪 Próximos pasos:');
      console.log('   1. Inicia el servidor: npm run dev');
      console.log('   2. Ve a: http://localhost:3000/login');
      console.log('   3. Ingresa tus credenciales');
      console.log('   4. ✅ El login debería funcionar correctamente\n');
      
    } else if (response.status === 404 || response.status === 400) {
      console.error('❌ La tabla refresh_tokens NO EXISTE\n');
      console.error('🔧 ACCIÓN REQUERIDA:');
      console.error('   1. Ve a: https://supabase.com/dashboard/project/odbxqmhbnkfledqcqujl');
      console.error('   2. Abre el SQL Editor');
      console.error('   3. Ejecuta el script: database-fixes/verify-and-create-auth-tables.sql');
      console.error('   4. Ejecuta este script nuevamente para verificar\n');
      console.error('📄 Más información en: docs/FIX_MISSING_REFRESH_TOKENS_TABLE.md\n');
      process.exit(1);
      
    } else {
      console.error(`❌ Error inesperado: HTTP ${response.status}`);
      const text = await response.text();
      console.error(`   Respuesta: ${text}\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error al verificar la tabla:', error.message);
    console.error('\n🔧 Posibles causas:');
    console.error('   - No hay conexión a internet');
    console.error('   - Las credenciales de Supabase son incorrectas');
    console.error('   - El servicio de Supabase está inaccesible\n');
    process.exit(1);
  }
}

// Verificar también la tabla user_session
async function checkUserSessionTable() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_session?limit=0`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ La tabla user_session existe (sistema legacy)');
    } else {
      console.log('⚠️  La tabla user_session no existe (no crítico)');
    }
    
  } catch (error) {
    console.log('⚠️  No se pudo verificar user_session (no crítico)');
  }
}

// Ejecutar verificaciones
(async () => {
  await checkTable();
  await checkUserSessionTable();
  console.log('='.repeat(70));
  console.log('\n');
})();
