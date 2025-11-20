'use client';

import React from 'react';

/**
 * Utilidad para resetear el onboarding
 * Útil para desarrollo y testing
 */
export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('has-seen-onboarding');
    console.log('✅ Onboarding reseteado. Recarga la página en /dashboard para verlo de nuevo.');
  }
}

/**
 * Hook para verificar si el usuario ha visto el onboarding
 */
export function useHasSeenOnboarding() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('has-seen-onboarding') === 'true';
}

/**
 * Función para abrir el onboarding manualmente
 * Útil para botones como "Ver Tour del Curso"
 */
export function openOnboarding() {
  if (typeof window !== 'undefined') {
    // Remover el flag para permitir que se abra
    localStorage.removeItem('has-seen-onboarding');
    // Disparar evento personalizado para abrir el modal
    window.dispatchEvent(new CustomEvent('open-onboarding'));
  }
}

/**
 * Botón de desarrollo para resetear onboarding
 * Solo visible en desarrollo
 */
export function DevResetOnboardingButton() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button
      onClick={resetOnboarding}
      className="fixed bottom-4 left-4 z-[10000] px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-lg shadow-lg transition-colors"
      title="Resetear onboarding (solo desarrollo)"
    >
      🔄 Reset Onboarding
    </button>
  );
}
