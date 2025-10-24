const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReactionInsert() {
  console.log('🧪 Testing Reaction Insert...\n');

  try {
    // 1. Obtener un post de prueba
    console.log('1️⃣ Obteniendo post de prueba...');
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('id, title, reaction_count')
      .limit(1);

    if (postsError || !posts.length) {
      console.error('❌ No se encontraron posts para probar');
      return;
    }

    const testPost = posts[0];
    console.log(`✅ Post de prueba: ${testPost.title} (ID: ${testPost.id})`);
    console.log(`   Reacciones actuales: ${testPost.reaction_count}`);

    // 2. Simular usuario de prueba
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testReactionType = 'like';

    // 3. Verificar reacciones existentes del usuario
    console.log('\n2️⃣ Verificando reacciones existentes...');
    const { data: existingReactions, error: checkError } = await supabase
      .from('community_reactions')
      .select('id, reaction_type')
      .eq('post_id', testPost.id)
      .eq('user_id', testUserId);

    if (checkError) {
      console.error('❌ Error al verificar reacciones:', checkError);
      return;
    }

    console.log(`✅ Reacciones existentes: ${existingReactions.length}`);
    if (existingReactions.length > 0) {
      console.log(`   Reacción actual: ${existingReactions[0].reaction_type}`);
    }

    // 4. Simular flujo de reacción
    console.log('\n3️⃣ Simulando flujo de reacción...');
    
    if (existingReactions.length > 0) {
      // Si ya tiene reacción, cambiar a diferente
      const currentReaction = existingReactions[0];
      const newReactionType = currentReaction.reaction_type === 'like' ? 'love' : 'like';
      
      console.log(`🔄 Cambiando reacción de ${currentReaction.reaction_type} a ${newReactionType}`);
      
      // Actualizar reacción
      const { data: updateData, error: updateError } = await supabase
        .from('community_reactions')
        .update({ 
          reaction_type: newReactionType,
          created_at: new Date().toISOString()
        })
        .eq('id', currentReaction.id)
        .select();

      if (updateError) {
        console.error('❌ Error al actualizar reacción:', updateError);
      } else {
        console.log('✅ Reacción actualizada:', updateData[0]);
      }
    } else {
      // Si no tiene reacción, agregar nueva
      console.log(`➕ Agregando nueva reacción: ${testReactionType}`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('community_reactions')
        .insert({
          post_id: testPost.id,
          user_id: testUserId,
          reaction_type: testReactionType
        })
        .select();

      if (insertError) {
        console.error('❌ Error al insertar reacción:', insertError);
      } else {
        console.log('✅ Reacción insertada:', insertData[0]);
      }
    }

    // 5. Verificar conteo actualizado
    console.log('\n4️⃣ Verificando conteo actualizado...');
    const { data: updatedPost, error: updatedError } = await supabase
      .from('community_posts')
      .select('reaction_count')
      .eq('id', testPost.id)
      .single();

    if (updatedError) {
      console.error('❌ Error al verificar conteo:', updatedError);
    } else {
      console.log(`✅ Conteo actualizado: ${updatedPost.reaction_count} reacciones`);
    }

    // 6. Verificar reacciones del usuario
    console.log('\n5️⃣ Verificando reacciones del usuario...');
    const { data: userReactions, error: userError } = await supabase
      .from('community_reactions')
      .select('reaction_type, created_at')
      .eq('post_id', testPost.id)
      .eq('user_id', testUserId);

    if (userError) {
      console.error('❌ Error al verificar reacciones del usuario:', userError);
    } else {
      console.log(`✅ Reacciones del usuario: ${userReactions.length}`);
      userReactions.forEach(reaction => {
        console.log(`   ${reaction.reaction_type} - ${reaction.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar prueba
testReactionInsert().then(() => {
  console.log('\n🏁 Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
