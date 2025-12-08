/**
 * Script para traducir todas las lecciones existentes
 * 
 * Uso:
 * node scripts/translate-all-lessons.mjs
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = `${API_URL}/api/admin/translate-existing-lessons`;

async function translateAllLessons() {
  console.log('🚀 Iniciando traducción de todas las lecciones...');
  console.log(`📡 Endpoint: ${ENDPOINT}`);
  console.log('');

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Resultado:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log(`📊 Resumen:`);
      console.log(`   - Traducidas: ${result.translated}`);
      console.log(`   - Fallidas: ${result.failed}`);
      console.log(`   - Saltadas (ya traducidas): ${result.skipped}`);
      console.log(`   - Total procesadas: ${result.translated + result.failed + result.skipped}`);
      
      if (result.details && result.details.length > 0) {
        console.log('');
        console.log('📝 Detalles (primeras 10):');
        result.details.slice(0, 10).forEach((detail) => {
          const icon = detail.status === 'translated' ? '✅' : detail.status === 'failed' ? '❌' : '⏭️';
          console.log(`   ${icon} ${detail.lessonTitle} (${detail.status})`);
          if (detail.languages) {
            console.log(`      Idiomas: ${detail.languages.join(', ')}`);
          }
          if (detail.error) {
            console.log(`      Error: ${detail.error}`);
          }
        });
        
        if (result.details.length > 10) {
          console.log(`   ... y ${result.details.length - 10} más`);
        }
      }
    } else {
      console.error('❌ Error:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error ejecutando traducción:', error.message);
    console.error('');
    console.error('💡 Asegúrate de que:');
    console.error('   1. El servidor Next.js esté corriendo (npm run dev)');
    console.error('   2. Estés autenticado como admin');
    console.error('   3. Las variables de entorno estén configuradas');
    process.exit(1);
  }
}

// Ejecutar
translateAllLessons();

