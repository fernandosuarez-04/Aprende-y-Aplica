/**
 * Script para obtener información de una voz de ElevenLabs por su ID
 * 
 * Uso:
 *   npx ts-node apps/api/scripts/get-elevenlabs-voice.ts <VOICE_ID>
 * 
 * Ejemplo:
 *   npx ts-node apps/api/scripts/get-elevenlabs-voice.ts 15Y62ZlO8it2f5wduybx
 */

import axios from 'axios';

const VOICE_ID = process.argv[2] || '15Y62ZlO8it2f5wduybx';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ Error: ELEVENLABS_API_KEY no está configurada en las variables de entorno');
  console.log('💡 Agrega ELEVENLABS_API_KEY a tu archivo .env');
  process.exit(1);
}

async function getVoiceInfo(voiceId: string) {
  try {
    const response = await axios.get(
      `https://api.elevenlabs.io/v1/voices/${voiceId}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    const voice = response.data;
    
    console.log('\n✅ Información de la voz:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Nombre: ${voice.name}`);
    console.log(`🆔 ID: ${voice.voice_id}`);
    console.log(`📋 Descripción: ${voice.description || 'Sin descripción'}`);
    console.log(`🌍 Categoría: ${voice.category || 'N/A'}`);
    console.log(`🎭 Etiquetas: ${voice.labels ? Object.entries(voice.labels).map(([k, v]) => `${k}: ${v}`).join(', ') : 'N/A'}`);
    console.log(`🎤 Muestra de audio: ${voice.preview_url || 'No disponible'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return voice;
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ Error ${error.response.status}: ${error.response.data?.detail?.message || error.response.data?.message || 'Error desconocido'}`);
    } else if (error.request) {
      console.error('❌ Error: No se pudo conectar con la API de ElevenLabs');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

// Ejecutar
getVoiceInfo(VOICE_ID);


