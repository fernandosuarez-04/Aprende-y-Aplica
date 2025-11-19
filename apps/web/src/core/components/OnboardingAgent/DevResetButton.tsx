'use client';

import React from 'react';
import { resetOnboarding } from './utils';

/**
 * Botón de desarrollo para resetear onboarding
 * ✅ TEMPORAL: Visible también en producción para testing del agente de voz
 */
export function DevResetButton() {
  // ✅ TEMPORAL: Permitir en producción para testing
  // Cambiar a true cuando quieras ocultarlo en producción
  const hideInProduction = false;
  
  if (hideInProduction && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={() => {
        resetOnboarding();
        window.location.reload();
      }}
      className="fixed bottom-4 left-4 z-[10000] px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-lg shadow-lg transition-colors font-semibold"
      title="Resetear onboarding y recargar (testing)"
    >
      🔄 Reset Onboarding
    </button>
  );
}
