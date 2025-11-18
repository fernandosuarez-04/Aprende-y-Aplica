'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { CalendarIntegration } from '@repo/shared/types';
import { Button } from '@aprende-y-aplica/ui';

interface CalendarSyncSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarSyncSettings({ isOpen, onClose }: CalendarSyncSettingsProps) {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Verificar y refrescar tokens automáticamente al abrir el modal
      loadIntegrations(true);
    }
  }, [isOpen]);

  const loadIntegrations = async (verifyTokens = false) => {
    setLoading(true);
    setError(null);
    try {
      // Si verifyTokens es true, verificar y refrescar tokens automáticamente
      const endpoint = verifyTokens 
        ? '/api/study-planner/calendar-integrations/verify'
        : '/api/study-planner/calendar-integrations';
      
      const method = verifyTokens ? 'POST' : 'GET';
      
      const response = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: verifyTokens ? { 'Content-Type': 'application/json' } : undefined,
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Si se verificaron tokens, los datos vienen en data.data.integrations
        const integrationsData = verifyTokens && data.data?.integrations 
          ? data.data.integrations 
          : data.data || [];
        
        setIntegrations(integrationsData);
        
        // Mostrar errores de verificación si los hay
        if (verifyTokens && data.data?.errors && data.data.errors.length > 0) {
          const errorMessages = data.data.errors.map((e: { provider: string; error: string }) => 
            `${e.provider}: ${e.error}`
          ).join('; ');
          setError(`Algunas integraciones tienen problemas: ${errorMessages}`);
        }
      } else {
        setError(data.error?.message || 'Error al cargar integraciones');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar integraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: 'google' | 'microsoft' | 'apple') => {
    setLoading(true);
    setError(null);
    try {
      // Iniciar OAuth flow
      const response = await fetch(`/api/study-planner/calendar-integrations/oauth/${provider}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success && data.authUrl) {
        // Redirigir a la URL de autorización
        window.location.href = data.authUrl;
      } else {
        setError('Error al iniciar la conexión');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('¿Estás seguro de que deseas desconectar este calendario?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/study-planner/calendar-integrations/${integrationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        await loadIntegrations();
      } else {
        setError('Error al desconectar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar-integrations/export/ics', {
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study-sessions.ics';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'microsoft':
        return 'Microsoft Calendar';
      case 'apple':
        return 'Apple Calendar';
      default:
        return provider;
    }
  };

  const getProviderIcon = (provider: string) => {
    return CalendarIcon; // Puedes usar iconos específicos aquí
  };

  const isConnected = (provider: string) => {
    return integrations.some((int) => int.provider === provider);
  };

  const isExpired = (integration: CalendarIntegration) => {
    if (!integration.expires_at) return false;
    return new Date(integration.expires_at) < new Date();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sincronización de Calendarios
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Conecta tus calendarios externos para sincronizar tus sesiones de estudio
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Google Calendar */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Google Calendar
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sincroniza con tu cuenta de Google
                    </p>
                  </div>
                </div>
                {isConnected('google') ? (
                  <div className="flex items-center gap-3">
                    {integrations
                      .filter((int) => int.provider === 'google')
                      .map((int) => (
                        <div key={int.id} className="flex items-center gap-2">
                          {isExpired(int) ? (
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(int.id)}
                            disabled={loading}
                          >
                            Desconectar
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect('google')}
                    disabled={loading}
                    size="sm"
                  >
                    Conectar
                  </Button>
                )}
              </div>
            </div>

            {/* Microsoft Calendar */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Microsoft Calendar
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sincroniza con Outlook/Office 365
                    </p>
                  </div>
                </div>
                {isConnected('microsoft') ? (
                  <div className="flex items-center gap-3">
                    {integrations
                      .filter((int) => int.provider === 'microsoft')
                      .map((int) => (
                        <div key={int.id} className="flex items-center gap-2">
                          {isExpired(int) ? (
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(int.id)}
                            disabled={loading}
                          >
                            Desconectar
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect('microsoft')}
                    disabled={loading}
                    size="sm"
                  >
                    Conectar
                  </Button>
                )}
              </div>
            </div>

            {/* Apple Calendar */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Apple Calendar
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Descarga o suscríbete al calendario ICS
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownloadICS}
                    disabled={loading}
                  >
                    Descargar ICS
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Generar URL de suscripción
                        const subscribeUrl = `${window.location.origin}/api/study-planner/calendar-integrations/subscribe/ics`;
                        await navigator.clipboard.writeText(subscribeUrl);
                        alert('URL de suscripción copiada al portapapeles. Puedes agregarla a tu calendario Apple/iCal.');
                      } catch (err) {
                        console.error('Error copying URL:', err);
                        alert('Error al copiar URL. Por favor, cópiala manualmente desde la barra de direcciones.');
                      }
                    }}
                    disabled={loading}
                    size="sm"
                  >
                    Copiar URL de Suscripción
                  </Button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> Las sesiones de estudio se sincronizarán automáticamente
                con tus calendarios conectados. Los cambios realizados en la aplicación se
                reflejarán en tus calendarios externos.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cerrar
            </Button>
            <Button onClick={() => loadIntegrations(true)} disabled={loading}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

