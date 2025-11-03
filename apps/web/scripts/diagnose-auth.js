/**
 * Script de diagnóstico completo del sistema de autenticación
 * Verifica todas las configuraciones necesarias para login
 */

require('dotenv').config({ path: '.env.local' });
const https = require('https');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, colors.bright);
  console.log('='.repeat(70) + '\n');
}

// Variables de entorno
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

header('🔍 DIAGNÓSTICO DEL SISTEMA DE AUTENTICACIÓN');

let hasErrors = false;

// 1. Verificar variables de entorno de Supabase
header('1️⃣  Variables de Entorno - Supabase');
if (SUPABASE_URL) {
  success('NEXT_PUBLIC_SUPABASE_URL está configurado');
  info(`   URL: ${SUPABASE_URL}`);
} else {
  error('NEXT_PUBLIC_SUPABASE_URL NO está configurado');
  hasErrors = true;
}

if (SUPABASE_ANON_KEY) {
  success('NEXT_PUBLIC_SUPABASE_ANON_KEY está configurado');
} else {
  error('NEXT_PUBLIC_SUPABASE_ANON_KEY NO está configurado');
  hasErrors = true;
}

if (SUPABASE_SERVICE_KEY) {
  success('SUPABASE_SERVICE_ROLE_KEY está configurado');
} else {
  warning('SUPABASE_SERVICE_ROLE_KEY NO está configurado (opcional)');
}

// 2. Verificar variables de Google OAuth
header('2️⃣  Variables de Entorno - Google OAuth');
if (GOOGLE_CLIENT_ID) {
  success('GOOGLE_OAUTH_CLIENT_ID está configurado');
  info(`   Client ID: ${GOOGLE_CLIENT_ID}`);
} else {
  error('GOOGLE_OAUTH_CLIENT_ID NO está configurado');
  hasErrors = true;
}

if (GOOGLE_CLIENT_SECRET) {
  success('GOOGLE_OAUTH_CLIENT_SECRET está configurado');
} else {
  error('GOOGLE_OAUTH_CLIENT_SECRET NO está configurado');
  hasErrors = true;
}

if (APP_URL) {
  success('NEXT_PUBLIC_APP_URL está configurado');
  info(`   URL: ${APP_URL}`);
} else {
  warning('NEXT_PUBLIC_APP_URL NO está configurado');
  info('   Se usará: http://localhost:3000 por defecto');
}

// 3. Generar URIs de OAuth
header('3️⃣  URIs de OAuth a Configurar en Google Cloud Console');
const baseUrl = APP_URL || 'http://localhost:3000';
const redirectUri = `${baseUrl}/api/auth/callback/google`;
const origin = baseUrl;

info('Debes agregar estas URIs EXACTAMENTE en Google Cloud Console:\n');
log('🔗 Orígenes de JavaScript autorizados:', colors.bright);
console.log(`   ${origin}\n`);
log('🔗 URIs de redirección autorizadas:', colors.bright);
console.log(`   ${redirectUri}\n`);

info('Accede a: https://console.cloud.google.com/apis/credentials');

// 4. Verificar conectividad con Supabase
header('4️⃣  Conectividad con Supabase');
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  info('Verificando conexión con Supabase...');
  
  const supabaseHost = new URL(SUPABASE_URL).hostname;
  
  const req = https.get(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  }, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      success('Conexión con Supabase exitosa');
    } else {
      error(`Error de conexión: HTTP ${res.statusCode}`);
      hasErrors = true;
    }
  });

  req.on('error', (err) => {
    error(`No se pudo conectar a Supabase: ${err.message}`);
    hasErrors = true;
  });

  req.end();
} else {
  warning('No se puede verificar conexión (faltan credenciales)');
}

// 5. Verificar archivos críticos
header('5️⃣  Archivos de Configuración');
const fs = require('fs');
const path = require('path');

const criticalFiles = [
  'src/features/auth/actions/login.ts',
  'src/features/auth/actions/oauth.ts',
  'src/features/auth/components/LoginForm/LoginForm.tsx',
  'src/lib/supabase/server.ts',
  'src/lib/oauth/google.ts',
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    success(`${file} existe`);
  } else {
    error(`${file} NO existe`);
    hasErrors = true;
  }
});

// 6. Resumen final
header('📊 RESUMEN DEL DIAGNÓSTICO');

if (!hasErrors) {
  success('✨ Todas las verificaciones pasaron correctamente');
  console.log('\n📝 PRÓXIMOS PASOS:\n');
  console.log('1. Configura las URIs en Google Cloud Console (mostradas arriba)');
  console.log('2. Espera 5-10 minutos para que los cambios se propaguen');
  console.log('3. Reinicia el servidor: npm run dev');
  console.log('4. Prueba el login en: http://localhost:3000/login\n');
} else {
  error('⚠️  Se encontraron problemas que deben ser corregidos');
  console.log('\n🔧 ACCIONES REQUERIDAS:\n');
  console.log('1. Corrige las variables de entorno en .env.local');
  console.log('2. Verifica que todos los archivos existan');
  console.log('3. Ejecuta este script nuevamente: node scripts/diagnose-auth.js\n');
}

// Mostrar comandos útiles
header('🛠️  COMANDOS ÚTILES');
console.log('# Verificar configuración OAuth:');
console.log('node scripts/check-oauth-config.js\n');
console.log('# Iniciar servidor en desarrollo:');
console.log('npm run dev\n');
console.log('# Limpiar caché y reiniciar:');
console.log('rm -rf .next && npm run dev\n');

console.log('='.repeat(70) + '\n');
