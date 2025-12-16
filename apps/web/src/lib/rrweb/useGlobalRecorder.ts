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

      // Iniciar grabación automática con 3 MINUTOS de buffer
      // Se reiniciará automáticamente cada 3 minutos
      recorder.startRecording(180000).catch((error) => {
        console.error('❌ [Global] Error al iniciar grabación:', error);
      }); // 3 minutos = 180000ms

      // Reiniciar grabación cada 3 minutos para mantener el sistema activo
      // Usar reinicio seguro para evitar race conditions y pérdida de eventos
      restartInterval = setInterval(async () => {
        try {
          
          // Detener grabación actual de forma segura
          const stoppedSession = recorder.stop();
          
          if (stoppedSession) {

          }
          
          // Esperar un tiempo suficiente para asegurar que la limpieza se complete
          // Esto previene race conditions donde el recorder aún está procesando
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verificar que el recorder no esté activo antes de reiniciar
          if (recorder.isActive()) {
            console.warn('⚠️ [Global] El recorder aún está activo, esperando más tiempo...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Iniciar nueva grabación
          await recorder.startRecording(180000);

        } catch (error) {
          console.error('❌ [Global] Error al reiniciar grabación:', error);
          // Intentar reiniciar después de un delay más largo en caso de error
          setTimeout(async () => {
            try {
              await recorder.startRecording(180000);

            } catch (retryError) {
              console.error('❌ [Global] Error en reintento de grabación:', retryError);
            }
          }, 2000);
        }
      }, 180000); // 3 minutos
    }).catch((error) => {
      console.error('❌ [Global] Error cargando sessionRecorder:', error);
    });

    // Cleanup al desmontar (aunque normalmente no se desmonta)
    return () => {

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
