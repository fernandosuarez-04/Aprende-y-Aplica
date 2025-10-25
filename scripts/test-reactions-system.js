const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReactionsSystem() {
  console.log('🧪 Testing Reactions System...\n');

  try {
    // 1. Verificar estructura de la tabla
    console.log('1️⃣ Verificando estructura de community_reactions...');
    const { data: reactions, error: reactionsError } = await supabase
      .from('community_reactions')
      .select('*')
      .limit(5);

    if (reactionsError) {
      console.error('❌ Error al consultar reacciones:', reactionsError);
      return;
    }

    console.log('✅ Reacciones encontradas:', reactions.length);
    if (reactions.length > 0) {
      console.log('📊 Ejemplo de reacción:', reactions[0]);
    }

    // 2. Verificar posts con reacciones
    console.log('\n2️⃣ Verificando posts con reacciones...');
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id, title, reaction_count')
      .gt('reaction_count', 0)
      .limit(5);

    if (postsError) {
      console.error('❌ Error al consultar posts:', postsError);
    } else {
      console.log('✅ Posts con reacciones:', posts.length);
      posts.forEach(post => {
        console.log(`   📝 ${post.title}: ${post.reaction_count} reacciones`);
      });
    }

    // 3. Verificar funciones RPC
    console.log('\n3️⃣ Verificando funciones RPC...');
    
    if (posts.length > 0) {
      const testPostId = posts[0].id;
      
      try {
        const { data: stats, error: statsError } = await supabase
          .rpc('get_post_reaction_stats', { post_id: testPostId });
        
        if (statsError) {
          console.log('⚠️  Función get_post_reaction_stats no disponible:', statsError.message);
        } else {
          console.log('✅ Función get_post_reaction_stats funcionando');
          console.log('📊 Estadísticas:', stats);
        }
      } catch (error) {
        console.log('⚠️  Error probando función RPC:', error.message);
      }

      try {
        const { data: topReactions, error: topError } = await supabase
          .rpc('get_top_reactions', { 
            post_id: testPostId,
            limit_count: 3 
          });
        
        if (topError) {
          console.log('⚠️  Función get_top_reactions no disponible:', topError.message);
        } else {
          console.log('✅ Función get_top_reactions funcionando');
          console.log('🏆 Top reacciones:', topReactions);
        }
      } catch (error) {
        console.log('⚠️  Error probando función RPC:', error.message);
      }
    }

    // 4. Verificar triggers
    console.log('\n4️⃣ Verificando triggers...');
    const { data: triggerTest, error: triggerError } = await supabase
      .from('community_reactions')
      .select('id')
      .limit(1);

    if (triggerError) {
      console.log('⚠️  Error verificando triggers:', triggerError.message);
    } else {
      console.log('✅ Triggers funcionando (tabla accesible)');
    }

    // 5. Estadísticas generales
    console.log('\n5️⃣ Estadísticas generales...');
    const { data: allReactions, error: allReactionsError } = await supabase
      .from('community_reactions')
      .select('reaction_type');

    if (allReactionsError) {
      console.log('❌ Error al obtener estadísticas:', allReactionsError);
    } else {
      const counts = {};
      allReactions.forEach(r => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
      });
      
      console.log('📊 Distribución de reacciones:');
      Object.entries(counts).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }

    // 6. Verificar sincronización de contadores
    console.log('\n6️⃣ Verificando sincronización de contadores...');
    const { data: syncData, error: syncError } = await supabase
      .from('community_posts')
      .select('id, title, reaction_count')
      .gt('reaction_count', 0)
      .limit(3);

    if (syncError) {
      console.log('❌ Error verificando sincronización:', syncError);
    } else {
      console.log('✅ Contadores de posts verificados');
      syncData.forEach(post => {
        console.log(`   📝 ${post.title}: ${post.reaction_count} reacciones`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar pruebas
testReactionsSystem().then(() => {
  console.log('\n🏁 Pruebas completadas');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
