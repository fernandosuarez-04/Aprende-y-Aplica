/**
 * Hook global para grabar sesiones en background
 * Se inicia automáticamente al montar la app y mantiene los últimos 60 segundos
 */

import { useEffect } from 'react';
import { sessionRecorder } from './session-recorder';

export function useGlobalRecorder() {
  useEffect(() => {
    // Solo en el cliente
    if (typeof window === 'undefined') return;

    console.log('🎬 [Global] Iniciando grabación automática en background...');
    
    // Iniciar grabación automática con 60 segundos de buffer
    sessionRecorder.startRecording(60000);

    // Cleanup al desmontar (aunque normalmente no se desmonta)
    return () => {
      console.log('🛑 [Global] Deteniendo grabación global');
      sessionRecorder.stop();
    };
  }, []);
}
