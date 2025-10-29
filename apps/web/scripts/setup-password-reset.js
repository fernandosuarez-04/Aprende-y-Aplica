/**
 * Script para crear la tabla password_reset_tokens en Supabase
 *
 * Uso:
 *   node scripts/setup-password-reset.js
 *
 * Variables de entorno requeridas:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log('\n🚀 Iniciando configuración de tabla password_reset_tokens...', 'cyan');

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log('\n❌ Error: Variables de entorno no configuradas', 'red');
    log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local', 'yellow');
    process.exit(1);
  }

  log('✅ Variables de entorno encontradas', 'green');

  // Crear cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  log('✅ Cliente Supabase creado', 'green');

  try {
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, 'create-password-reset-tokens-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    log('✅ Archivo SQL leído correctamente', 'green');

    log('\n📋 Ejecutando SQL...', 'blue');

    // Ejecutar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Si exec_sql no existe, intentar con query directo
      log('⚠️  RPC exec_sql no disponible, intentando ejecución directa...', 'yellow');

      // Dividir SQL en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      log(`\n📝 Ejecutando ${statements.length} statements...`, 'blue');

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        log(`  ${i + 1}/${statements.length}: Ejecutando...`, 'cyan');

        // Nota: Supabase no permite ejecutar SQL directamente desde el cliente
        // Se debe ejecutar manualmente en Supabase Dashboard → SQL Editor
        log(`  ℹ️  Statement ${i + 1} preparado (ejecutar en Supabase Dashboard)`, 'yellow');
      }

      log('\n⚠️  No se puede ejecutar SQL directamente desde Node.js', 'yellow');
      log('\n📋 ACCIÓN REQUERIDA:', 'bright');
      log('1. Abre Supabase Dashboard → SQL Editor', 'cyan');
      log('2. Copia el contenido de: scripts/create-password-reset-tokens-table.sql', 'cyan');
      log('3. Pega y ejecuta el SQL en el editor', 'cyan');
      log('4. Verifica que la tabla se creó: SELECT * FROM password_reset_tokens LIMIT 1;', 'cyan');

      log('\n💡 Alternativa: Usa la línea de comandos de Supabase:', 'yellow');
      log('   supabase db push', 'cyan');

    } else {
      log('✅ SQL ejecutado correctamente', 'green');
      log('\n🎉 Tabla password_reset_tokens creada exitosamente!', 'green');
    }

    // Verificar que la tabla existe
    log('\n🔍 Verificando tabla...', 'blue');
    const { data: tableCheck, error: checkError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .limit(1);

    if (checkError) {
      if (checkError.code === '42P01') {
        log('⚠️  Tabla no encontrada. Ejecuta el SQL manualmente en Supabase Dashboard.', 'yellow');
        log('\n📋 Pasos:', 'cyan');
        log('1. Abre: https://app.supabase.com', 'cyan');
        log('2. SQL Editor → New Query', 'cyan');
        log('3. Copia el contenido de: scripts/create-password-reset-tokens-table.sql', 'cyan');
        log('4. Ejecuta el SQL', 'cyan');
      } else {
        log(`❌ Error verificando tabla: ${checkError.message}`, 'red');
      }
    } else {
      log('✅ Tabla verificada correctamente', 'green');
      log('\n🎉 Configuración completada!', 'green');
      log('\n📊 Estructura de la tabla:', 'blue');
      log('  - id (UUID)', 'cyan');
      log('  - user_id (UUID) → users.id', 'cyan');
      log('  - token (VARCHAR 255) UNIQUE', 'cyan');
      log('  - expires_at (TIMESTAMP)', 'cyan');
      log('  - created_at (TIMESTAMP)', 'cyan');
      log('  - used_at (TIMESTAMP)', 'cyan');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    log('\n📋 Para ejecutar manualmente:', 'yellow');
    log('1. Abre Supabase Dashboard → SQL Editor', 'cyan');
    log('2. Ejecuta el contenido de: scripts/create-password-reset-tokens-table.sql', 'cyan');
    process.exit(1);
  }

  log('\n✨ Script completado', 'green');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');
}

// Ejecutar
main().catch((error) => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
