'use client';

import { useState, useEffect, type ComponentType, type ReactNode } from 'react';

/**
 * Componente wrapper que carga y usa el hook dinámicamente
 */
function RecorderHookWrapper() {
  const [HookUser, setHookUser] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Cargar solo el hook principal, sin context markers por ahora
    import('../../lib/rrweb/useGlobalRecorder')
      .then((module) => {
        const HookComponent: ComponentType = () => {
          module.useGlobalRecorder();
          return null;
        };
        setHookUser(() => HookComponent);
      })
      .catch((error) => {
        console.error('[ERROR] Error cargando hook de grabacion:', error);
      });
  }, []);

  return HookUser ? <HookUser /> : null;
}

/**
 * Componente cliente que inicia la grabación global automáticamente
 * al cargar la aplicación.
 */
export function GlobalRecorderProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
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
