/**
 * Hook global para grabar sesiones en background
 * Se inicia automáticamente al montar la app y mantiene los últimos 60 segundos
 */

'use client';

import { useEffect } from 'react';

// Importación dinámica para evitar problemas en el servidor
// Usar tipo genérico en lugar de typeof import para evitar análisis estático
import type { SessionRecorderInstance } from './session-recorder';

let sessionRecorder: SessionRecorderInstance | null = null;

async function getSessionRecorder() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!sessionRecorder) {
    const module = await import('./session-recorder');
    sessionRecorder = module.sessionRecorder;
  }
  
  return sessionRecorder;
}

export function useGlobalRecorder() {
  useEffect(() => {
    // Solo en el cliente
    if (typeof window === 'undefined') return;

    // Cargar sessionRecorder de forma asíncrona
    let restartInterval: NodeJS.Timeout | null = null;
    
    getSessionRecorder().then((recorder) => {
      if (!recorder) {
        console.warn('⚠️ [Global] sessionRecorder no está disponible');
        return;
      }

      console.log('🎬 [Global] Iniciando grabación automática en background...');
      
      // Iniciar grabación automática con 3 MINUTOS de buffer
      // Se reiniciará automáticamente cada 3 minutos
      recorder.startRecording(180000).catch((error) => {
        console.error('❌ [Global] Error al iniciar grabación:', error);
      }); // 3 minutos = 180000ms

      // Reiniciar grabación cada 3 minutos para mantener el sistema activo
      restartInterval = setInterval(() => {
        console.log('🔄 [Global] Reiniciando grabación automáticamente (ciclo de 3 min)...');
        recorder.stop();
        // Esperar un tick para limpiar antes de reiniciar
        setTimeout(() => {
          recorder.startRecording(180000).catch((error) => {
            console.error('❌ [Global] Error al reiniciar grabación:', error);
          });
        }, 100);
      }, 180000); // 3 minutos
    }).catch((error) => {
      console.error('❌ [Global] Error cargando sessionRecorder:', error);
    });

    // Cleanup al desmontar (aunque normalmente no se desmonta)
    return () => {
      console.log('🛑 [Global] Deteniendo grabación global');
      if (restartInterval) {
        clearInterval(restartInterval);
      }
      getSessionRecorder().then((recorder) => {
        if (recorder) {
          recorder.stop();
        }
      });
    };
  }, []);
}
