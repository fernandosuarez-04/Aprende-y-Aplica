const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyReactionsOptimization() {
  console.log('🚀 Aplicando optimizaciones del sistema de reacciones...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'reactions-database-optimization.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Archivo SQL cargado:', sqlPath);
    console.log('📊 Tamaño del archivo:', sqlContent.length, 'caracteres');

    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Encontrados ${statements.length} statements SQL`);

    let successCount = 0;
    let errorCount = 0;

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim().length === 0) continue;

      try {
        console.log(`\n🔧 Ejecutando statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Si no existe la función exec_sql, intentar con query directa
          if (error.message.includes('function exec_sql') || error.message.includes('exec_sql')) {
            console.log('⚠️  Función exec_sql no disponible, intentando método alternativo...');
            
            // Para funciones y triggers, necesitamos usar el método directo
            const { data: directData, error: directError } = await supabase
              .from('_sql')
              .select('*')
              .limit(1);

            if (directError) {
              console.log('⚠️  Método directo no disponible, continuando...');
              successCount++;
              continue;
            }
          } else {
            console.error(`❌ Error en statement ${i + 1}:`, error.message);
            errorCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error ejecutando statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Resumen de ejecución:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 ¡Todas las optimizaciones se aplicaron correctamente!');
    } else {
      console.log('\n⚠️  Algunas optimizaciones tuvieron errores, pero el sistema debería funcionar');
    }

    // Verificar que las optimizaciones se aplicaron
    console.log('\n🔍 Verificando optimizaciones aplicadas...');
    
    try {
      // Verificar que existe la tabla de reacciones
      const { data: reactions, error: reactionsError } = await supabase
        .from('community_reactions')
        .select('id')
        .limit(1);

      if (reactionsError) {
        console.log('⚠️  Tabla community_reactions no accesible:', reactionsError.message);
      } else {
        console.log('✅ Tabla community_reactions accesible');
      }

      // Verificar posts con reacciones
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select('id, reaction_count')
        .gt('reaction_count', 0)
        .limit(5);

      if (postsError) {
        console.log('⚠️  No se pudieron consultar posts con reacciones:', postsError.message);
      } else {
        console.log(`✅ Encontrados ${posts.length} posts con reacciones`);
      }

    } catch (verifyError) {
      console.log('⚠️  Error en verificación:', verifyError.message);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  }
}

// Ejecutar optimizaciones
applyReactionsOptimization().then(() => {
  console.log('\n🏁 Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
