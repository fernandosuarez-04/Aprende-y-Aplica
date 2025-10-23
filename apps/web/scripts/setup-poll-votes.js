const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitarás esta clave

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('\nAsegúrate de tener estas variables en tu archivo .env.local');
  process.exit(1);
}

// Crear cliente de Supabase con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPollVotesTable() {
  try {
    console.log('🚀 Iniciando configuración de la tabla community_poll_votes...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-poll-votes-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      
      // Si el RPC no existe, intentar ejecutar directamente
      console.log('🔄 Intentando ejecutar SQL directamente...');
      
      // Dividir el SQL en statements individuales
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase
            .from('community_poll_votes')
            .select('id')
            .limit(1);
          
          if (stmtError && stmtError.code === 'PGRST116') {
            // La tabla no existe, necesitamos crearla
            console.log('📝 Tabla community_poll_votes no existe, necesitas crearla manualmente en Supabase');
            console.log('📋 Ejecuta este SQL en el editor SQL de Supabase:');
            console.log('\n' + '='.repeat(80));
            console.log(sqlContent);
            console.log('='.repeat(80) + '\n');
            break;
          }
        } catch (e) {
          console.log('📝 Tabla community_poll_votes no existe, necesitas crearla manualmente en Supabase');
          console.log('📋 Ejecuta este SQL en el editor SQL de Supabase:');
          console.log('\n' + '='.repeat(80));
          console.log(sqlContent);
          console.log('='.repeat(80) + '\n');
          break;
        }
      }
    } else {
      console.log('✅ Tabla community_poll_votes configurada exitosamente');
    }
    
  } catch (error) {
    console.error('❌ Error en la configuración:', error);
    console.log('\n📋 Ejecuta este SQL manualmente en el editor SQL de Supabase:');
    console.log('\n' + '='.repeat(80));
    const sqlPath = path.join(__dirname, 'create-poll-votes-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log(sqlContent);
    console.log('='.repeat(80) + '\n');
  }
}

// Ejecutar la configuración
setupPollVotesTable();
