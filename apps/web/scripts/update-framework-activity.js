/**
 * Script para actualizar la actividad "Framework de 3 Columnas" a tipo ai_chat
 * con un guión conversacional estructurado para LIA
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan las credenciales de Supabase');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const activityContent = `Lia (IA): ¡Hola! 👋 Soy LIA, tu tutora personalizada. Hoy vamos a trabajar juntos en una actividad super práctica: el Framework de 3 Columnas para identificar oportunidades de IA en tu trabajo.

Este framework te ayudará a descubrir procesos que son perfectos para automatizar con IA. ¿Estás listo para comenzar? 💪

Usuario: [Respuesta del usuario]

---

Lia (IA): ¡Perfecto! Vamos a crear una tabla con 3 columnas. Yo iré guardando toda la información que me des y al final te generaré un archivo CSV con todos tus resultados. 📊

Las 3 columnas serán:
1. Tarea Repetitiva
2. Datos (Inputs)
3. Decisión (Inferencia)

Paso 1: Tareas Repetitivas 📝

Piensa en tu trabajo diario o semanal. Necesito que me menciones entre 5 y 10 tareas que:
- Sean repetitivas
- Te parezcan tediosas
- Sientas que podrías hacer "con los ojos cerrados"

Algunos ejemplos: revisar facturas, clasificar correos, asignar tickets de soporte, revisar CVs, transcribir reuniones, actualizar reportes...

Tómate un minuto y dime: ¿Cuáles son esas tareas repetitivas en tu trabajo?

Usuario: [Lista de tareas]

---

Lia (IA): ¡Excelente lista! Ya tengo tus tareas en la Columna 1. Vamos a trabajar ahora con los DATOS. 📊

Paso 2: Identificar los Datos (Inputs)

Para cada tarea que mencionaste, necesito que identifiques: ¿Qué información (datos) necesitas mirar para completar esa tarea?

Te voy a preguntar una por una. Empecemos con tu primera tarea.

¿Qué datos o información necesitas revisar para hacer esta tarea?

Ejemplos de datos:
- Si es "Revisar facturas": Monto, Proveedor, Fecha, Número de orden
- Si es "Asignar tickets": Texto del correo, Cliente, Asunto
- Si es "Revisar CVs": Años de experiencia, Habilidades, Título

Usuario: [Datos para la tarea 1]

---

Lia (IA): Perfecto, ya tengo los datos para tu primera tarea. Ahora vamos con la siguiente.

¿Qué datos necesitas revisar para completar esta otra tarea?

Usuario: [Datos para la tarea 2]

---

Lia (IA): ¡Genial! Ya tenemos todas las tareas (Columna 1) y sus datos (Columna 2) completos. 🎉

Paso 3: Definir la Decisión (La Inferencia) 🎯

Ahora la parte más importante: para cada tarea, necesito que me digas cuál es la DECISIÓN FINAL y CONCRETA que tomas después de ver los datos.

⚠️ MUY IMPORTANTE: La decisión debe ser:
- Clara y específica (una etiqueta, categoría o número)
- NO vaga como "analizar", "revisar" o "entender"

Ejemplos buenos:
- "Aprobar" o "Rechazar"
- "Soporte", "Ventas" o "Facturación"
- "Entrevistar" o "Descartar"
- "Alto", "Medio" o "Bajo"

Empecemos con tu primera tarea. ¿Cuál es la decisión final que tomas? (Sé específico)

Usuario: [Decisión para tarea 1]

---

Lia (IA): Muy bien. Siguiente tarea: ¿Cuál es tu decisión final aquí?

Usuario: [Decisión para tarea 2]

---

Lia (IA): ¡Excelente trabajo! Ya tenemos tu tabla completa con las 3 columnas. 📋

Paso 4: Evaluación y Selección del Mejor Caso de Uso 🏆

Ahora vamos a evaluar tus tareas usando 3 criterios clave:

1. ✅ Alto Volumen: ¿Ocurre muy a menudo?
2. ✅ Basada en Datos: ¿La decisión depende directamente de los datos, no de intuición?
3. ✅ Decisión Clara: ¿El resultado es una acción concreta y específica?

Voy a analizar cada una de tus tareas y te diré cuáles son las mejores oportunidades para IA.

Dame un momento para evaluar tus tareas... 🤔

Usuario: [Confirmación]

---

Lia (IA): Perfecto. He analizado todas tus tareas y aquí está el ranking de mejores oportunidades para IA:

[Aquí presentaré cada tarea con su evaluación según los 3 criterios]

Paso 5: Tu Caso de Uso N°1 de IA 🎯

Según el análisis, tu MEJOR caso de uso para IA es la tarea que mejor cumple con los 3 criterios.

¿Te gustaría que seleccione la mejor o prefieres elegir tú?

Usuario: [Confirmación o selección]

---

Lia (IA): ¡Excelente decisión! 🎉

Has completado el Framework de 3 Columnas con éxito. Ahora voy a generar tu archivo CSV con todos los resultados.

📥 Aquí está tu tabla completa en formato CSV:

[Generaré un CSV con todas las tareas, datos, decisiones y evaluaciones]

Formato:
Tarea Repetitiva,Datos (Inputs),Decisión (Inferencia),Alto Volumen,Basada en Datos,Decisión Clara,Es Caso de Uso #1

💡 Recomendaciones finales:

1. Copia este CSV y pégalo en Excel o Google Sheets
2. Tu Caso de Uso #1 es el mejor punto de partida para implementar IA
3. En las siguientes lecciones aprenderemos cómo llevar este caso a la práctica

¿Tienes alguna pregunta sobre el framework o sobre tu caso de uso seleccionado? 🤔

Usuario: [Pregunta final o confirmación]

---

Lia (IA): ¡Felicidades por completar esta actividad! 🎊

Has dado el primer paso crítico: identificar dónde la IA puede tener el mayor impacto en tu trabajo. Conserva tu CSV y tu Caso de Uso #1 - los usaremos en las próximas lecciones.

¡Nos vemos en la siguiente actividad! 💪✨`;

async function updateActivity() {
  console.log('🚀 Iniciando actualización de la actividad "Framework de 3 Columnas"...\n');

  try {
    // Buscar la actividad existente
    console.log('🔍 Buscando la actividad...');
    const { data: activities, error: searchError } = await supabase
      .from('activities')
      .select('activity_id, activity_title, activity_type, lesson_id')
      .or('activity_title.ilike.%Framework de 3 Columnas%,activity_title.ilike.%Identificando Oportunidades%,activity_description.ilike.%Framework de 3 Columnas%');

    if (searchError) {
      throw new Error(`Error buscando actividad: ${searchError.message}`);
    }

    if (!activities || activities.length === 0) {
      console.log('⚠️  No se encontró la actividad. Buscando por descripción más amplia...');
      
      const { data: altActivities, error: altError } = await supabase
        .from('activities')
        .select('activity_id, activity_title, activity_type, activity_description, lesson_id')
        .ilike('activity_description', '%Framework%')
        .limit(5);

      if (altError || !altActivities || altActivities.length === 0) {
        console.log('❌ No se encontró ninguna actividad relacionada con "Framework de 3 Columnas"');
        console.log('\n💡 Sugerencia: Verifica manualmente en la base de datos o crea la actividad primero.');
        process.exit(1);
      }

      console.log('\n📋 Actividades encontradas:');
      altActivities.forEach((act, idx) => {
        console.log(`${idx + 1}. ${act.activity_title} (ID: ${act.activity_id}, Tipo: ${act.activity_type})`);
      });
      console.log('\n⚠️  Por favor, verifica manualmente cuál es la correcta y actualiza el script.');
      process.exit(0);
    }

    console.log(`✅ Actividad encontrada: "${activities[0].activity_title}"`);
    console.log(`   ID: ${activities[0].activity_id}`);
    console.log(`   Tipo actual: ${activities[0].activity_type}`);
    console.log(`   Lesson ID: ${activities[0].lesson_id}`);

    // Actualizar la actividad
    console.log('\n📝 Actualizando actividad...');
    const { data: updateData, error: updateError } = await supabase
      .from('activities')
      .update({
        activity_type: 'ai_chat',
        activity_content: activityContent,
        updated_at: new Date().toISOString()
      })
      .eq('activity_id', activities[0].activity_id)
      .select();

    if (updateError) {
      throw new Error(`Error actualizando actividad: ${updateError.message}`);
    }

    console.log('✅ Actividad actualizada exitosamente!');
    console.log(`   Tipo nuevo: ai_chat`);
    console.log(`   Contenido: ${activityContent.substring(0, 100)}...`);

    // Verificar la actualización
    console.log('\n🔍 Verificando actualización...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('activities')
      .select('activity_id, activity_title, activity_type')
      .eq('activity_id', activities[0].activity_id)
      .single();

    if (verifyError) {
      throw new Error(`Error verificando actualización: ${verifyError.message}`);
    }

    if (verifyData.activity_type === 'ai_chat') {
      console.log('✅ Verificación exitosa! El tipo de actividad es ahora: ai_chat');
      console.log('\n🎉 ¡Actualización completada con éxito!');
      console.log('\n📌 Próximos pasos:');
      console.log('1. Ve a la lección 3.1 en la interfaz');
      console.log('2. Navega a la pestaña "Actividades"');
      console.log('3. Deberías ver el botón "Interactuar con LIA"');
      console.log('4. Haz clic y prueba la nueva experiencia interactiva');
    } else {
      console.log('⚠️  Advertencia: El tipo de actividad no se actualizó correctamente');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar la actualización
updateActivity();
