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
    
    // Iniciar grabación automática con 3 MINUTOS de buffer
    // Se reiniciará automáticamente cada 3 minutos
    sessionRecorder.startRecording(180000); // 3 minutos = 180000ms

    // Reiniciar grabación cada 3 minutos para mantener el sistema activo
    const restartInterval = setInterval(() => {
      console.log('🔄 [Global] Reiniciando grabación automáticamente (ciclo de 3 min)...');
      sessionRecorder.stop();
      // Esperar un tick para limpiar antes de reiniciar
      setTimeout(() => {
        sessionRecorder.startRecording(180000);
      }, 100);
    }, 180000); // 3 minutos

    // Cleanup al desmontar (aunque normalmente no se desmonta)
    return () => {
      console.log('🛑 [Global] Deteniendo grabación global');
      clearInterval(restartInterval);
      sessionRecorder.stop();
    };
  }, []);
}
