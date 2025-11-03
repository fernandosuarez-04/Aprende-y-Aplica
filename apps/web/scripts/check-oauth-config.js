/**
 * Script para verificar la configuración de Google OAuth
 * y generar las URIs correctas que deben configurarse en Google Cloud Console
 */

require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('\n🔍 VERIFICACIÓN DE CONFIGURACIÓN GOOGLE OAUTH\n');
console.log('='.repeat(70));

// 1. Verificar variables de entorno
console.log('\n✅ Variables de entorno:');
console.log(`   GOOGLE_OAUTH_CLIENT_ID: ${CLIENT_ID ? '✓ Configurado' : '✗ FALTA'}`);
console.log(`   GOOGLE_OAUTH_CLIENT_SECRET: ${CLIENT_SECRET ? '✓ Configurado' : '✗ FALTA'}`);
console.log(`   NEXT_PUBLIC_APP_URL: ${APP_URL}`);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ ERROR: Faltan credenciales de Google OAuth en .env.local');
  process.exit(1);
}

// 2. Generar URIs de redirección
const REDIRECT_URI = `${APP_URL}/api/auth/callback/google`;
const ORIGIN_URI = APP_URL;

console.log('\n📋 URIs PARA CONFIGURAR EN GOOGLE CLOUD CONSOLE:');
console.log('='.repeat(70));
console.log('\n1. URI de redirección autorizada (Authorized redirect URIs):');
console.log(`   ${REDIRECT_URI}`);
console.log('\n2. Orígenes de JavaScript autorizados (Authorized JavaScript origins):');
console.log(`   ${ORIGIN_URI}`);

console.log('\n📝 PASOS PARA CONFIGURAR EN GOOGLE CLOUD CONSOLE:');
console.log('='.repeat(70));
console.log('\n1. Ve a: https://console.cloud.google.com/apis/credentials');
console.log(`2. Busca el Client ID: ${CLIENT_ID}`);
console.log('3. Haz clic en el nombre del cliente OAuth 2.0');
console.log('4. En "Orígenes de JavaScript autorizados", agrega:');
console.log(`   → ${ORIGIN_URI}`);
console.log('5. En "URIs de redirección autorizadas", agrega:');
console.log(`   → ${REDIRECT_URI}`);
console.log('6. Haz clic en "GUARDAR"');
console.log('7. Espera 5 minutos para que los cambios se propaguen');

console.log('\n⚠️  IMPORTANTE:');
console.log('   - Las URIs deben coincidir EXACTAMENTE (incluyendo http:// o https://)');
console.log('   - No debe haber espacios ni caracteres extra');
console.log('   - Después de guardar, espera unos minutos antes de probar');

console.log('\n🧪 PARA PROBAR:');
console.log('   1. Reinicia el servidor: npm run dev');
console.log('   2. Ve a: http://localhost:3000/login');
console.log('   3. Haz clic en "Continuar con Google"');
console.log('   4. Deberías ser redirigido a Google sin errores\n');

console.log('='.repeat(70));
console.log('✅ Verificación completada\n');
