'use client';

import React from 'react';
import { resetOnboarding } from './utils';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { usePathname } from 'next/navigation';

/**
 * Botón para volver a ver la experiencia de bienvenida con LIA
 * Permite al usuario acceder nuevamente al tour guiado con el agente de voz
 * Solo visible para usuarios autenticados y solo en el dashboard
 */
export function DevResetButton() {
  const { user } = useAuth();
  const pathname = usePathname();

  // Solo mostrar si el usuario está autenticado y está en el dashboard
  if (!user || pathname !== '/dashboard') {
    return null;
  }

  return (
    <button
      onClick={() => {
        resetOnboarding();
        window.location.reload();
      }}
      className="fixed bottom-4 left-4 z-[10000] px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs rounded-lg shadow-lg transition-all duration-200 font-semibold flex items-center gap-2 hover:scale-105"
      title="Volver a ver la experiencia de bienvenida con LIA"
    >
      <span className="text-base">🎙️</span>
      <span>Ver Tour con LIA</span>
    </button>
  );
}
