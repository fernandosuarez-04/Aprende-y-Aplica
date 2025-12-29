/**
 * InactivityWarningModal
 * 
 * Modal que aparece 5 minutos antes del logout por inactividad.
 * Muestra countdown y permite al usuario continuar o cerrar sesión.
 */

'use client';

import React from 'react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  minutesRemaining: number;
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
}

export function InactivityWarningModal({
  isOpen,
  minutesRemaining,
  secondsRemaining,
  onContinue,
  onLogout
}: InactivityWarningModalProps) {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-200">
        {/* Icono de advertencia */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-amber-600 dark:text-amber-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          ¿Sigues ahí?
        </h2>

        {/* Mensaje */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
          No hemos detectado actividad en los últimos minutos. 
          Tu sesión se cerrará automáticamente por seguridad.
        </p>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <span className="text-3xl font-bold text-white font-mono">
              {timeDisplay}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tiempo restante
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-colors font-medium shadow-lg shadow-blue-500/25"
          >
            Continuar
          </button>
        </div>

        {/* Nota */}
        <p className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
          Por tu seguridad, cerramos sesiones inactivas automáticamente.
        </p>
      </div>
    </div>
  );
}

/**
 * SessionClosedMessage
 * 
 * Toast/Banner que se muestra cuando el usuario vuelve después de un cierre por inactividad.
 */
interface SessionClosedMessageProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function SessionClosedMessage({
  isOpen,
  onDismiss
}: SessionClosedMessageProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] max-w-sm w-full animate-in slide-in-from-right duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg 
              className="w-5 h-5 text-blue-600 dark:text-blue-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Sesión cerrada por inactividad
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Tu sesión de estudio anterior fue cerrada automáticamente. 
              El progreso se guardó hasta tu última actividad.
            </p>
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default InactivityWarningModal;
