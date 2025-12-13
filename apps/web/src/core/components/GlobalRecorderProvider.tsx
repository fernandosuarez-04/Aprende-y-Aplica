'use client';

import { useState, useEffect, type ComponentType } from 'react';

/**
 * Componente wrapper que carga y usa el hook dinámicamente
 * Esto evita que webpack analice el módulo durante el análisis estático del servidor
 */
function RecorderHookWrapper() {
  const [HookUser, setHookUser] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      return;
    }

    // Cargar el hook dinámicamente solo en el cliente
    // Esto evita que webpack intente analizar el módulo durante el SSR
    import('../../lib/rrweb/useGlobalRecorder')
      .then((module) => {
        // Crear un componente que use el hook
        // Los hooks deben llamarse en el nivel superior del componente
        const HookComponent: ComponentType = () => {
          module.useGlobalRecorder();
          return null;
        };
        setHookUser(() => HookComponent);
      })
      .catch((error) => {
        console.error('❌ Error cargando useGlobalRecorder:', error);
      });
  }, []);

  return HookUser ? <HookUser /> : null;
}

/**
 * Componente cliente que inicia la grabación global automáticamente
 * al cargar la aplicación. Mantiene un buffer circular de 60 segundos
 * para capturar el contexto previo a cualquier reporte de bug.
 * 
 * IMPORTANTE: Este componente solo se ejecuta en el cliente para evitar
 * problemas con SSR y análisis estático de webpack. Todas las importaciones
 * relacionadas con rrweb se hacen dinámicamente.
 */
export function GlobalRecorderProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Solo marcar como cliente cuando realmente estemos en el navegador
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  return (
    <>
      {children}
      {isClient && <RecorderHookWrapper />}
    </>
  );
}
