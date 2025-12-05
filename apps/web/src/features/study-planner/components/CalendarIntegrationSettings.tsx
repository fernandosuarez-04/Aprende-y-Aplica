'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Download,
  Link as LinkIcon,
} from 'lucide-react';
import { CalendarIntegration } from '@aprende-y-aplica/shared';

interface CalendarIntegrationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onIntegrationChange?: () => void; // Callback opcional para notificar cambios
}

export function CalendarIntegrationSettings({
  isOpen,
  onClose,
  onIntegrationChange,
}: CalendarIntegrationSettingsProps) {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [subscriptionToken, setSubscriptionToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIntegrations();
      loadSubscriptionToken();
    }
  }, [isOpen]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/study-planner/calendar-integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Error loading integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionToken = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar-integrations/subscription-token');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionToken(data.token);
      }
    } catch (error) {
      console.error('Error loading subscription token:', error);
    }
  };

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    try {
      setConnecting(provider);
      const response = await fetch(`/api/study-planner/calendar-integrations/oauth/${provider}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.authorization_url) {
          // Redirigir a la URL de autorización
          window.location.href = data.authorization_url;
        } else {
          throw new Error('No se recibió la URL de autorización');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error en respuesta OAuth:', errorData);
        
        // Mostrar mensaje de error detallado
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\n${errorData.details}\n\n${errorData.requiredEnvVars ? `Variables requeridas:\n${errorData.requiredEnvVars.join('\n')}` : ''}`
          : errorData.error || 'Error al iniciar la conexión';
        
        alert(errorMessage);
        setConnecting(null);
      }
    } catch (error) {
      console.error('Error connecting calendar:', error);
      const errorMessage = error instanceof Error 
        ? `Error al conectar el calendario: ${error.message}`
        : 'Error al conectar el calendario';
      alert(errorMessage);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('¿Estás seguro de que quieres desconectar este calendario?')) {
      return;
    }

    try {
      const response = await fetch('/api/study-planner/calendar-integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integration_id: integrationId }),
      });

      if (response.ok) {
        // Recargar solo las integraciones, no toda la página
        await loadIntegrations();
        // Notificar al padre si es necesario
        onIntegrationChange?.();
      } else {
        alert('Error al desconectar el calendario');
      }
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Error al desconectar el calendario');
    }
  };

  const handleExportICS = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar-integrations/export-ics');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plan-estudio.ics';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al exportar el calendario');
      }
    } catch (error) {
      console.error('Error exporting ICS:', error);
      alert('Error al exportar el calendario');
    }
  };

  const handleCopySubscriptionUrl = () => {
    if (!subscriptionToken) return;

    const url = `${window.location.origin}/api/study-planner/calendar-integrations/subscribe/ics/${subscriptionToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google Calendar';
      case 'microsoft':
        return 'Microsoft Outlook';
      case 'apple':
        return 'Apple Calendar';
      default:
        return provider;
    }
  };

  const GoogleIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const MicrosoftIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.4 11.4H1V1h10.4v10.4z" fill="#F25022"/>
      <path d="M23 11.4H12.6V1H23v10.4z" fill="#7FBA00"/>
      <path d="M11.4 23H1V12.6h10.4V23z" fill="#00A4EF"/>
      <path d="M23 23H12.6V12.6H23V23z" fill="#FFB900"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <GoogleIcon />;
      case 'microsoft':
        return <MicrosoftIcon />;
      case 'apple':
        return <AppleIcon />;
      default:
        return <Calendar className="w-8 h-8 text-slate-400" />;
    }
  };

  const isConnected = (provider: string) => {
    return integrations.some((i) => i.provider === provider);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // Cerrar modal solo si se hace clic en el fondo, no en el contenido
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()} // Prevenir que los clics dentro del modal se propaguen
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-400" />
              Integración de Calendarios
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Proveedores de Calendario */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Conectar Calendarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Google Calendar */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getProviderIcon('google')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {getProviderName('google')}
                        </h4>
                        {isConnected('google') && (
                          <div className="flex items-center gap-1 text-green-400 text-sm mt-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Conectado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isConnected('google') ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDisconnect(
                          integrations.find((i) => i.provider === 'google')!.id
                        );
                      }}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConnect('google');
                      }}
                      disabled={connecting === 'google'}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting === 'google' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          Conectar
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Microsoft Calendar */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getProviderIcon('microsoft')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">
                          {getProviderName('microsoft')}
                        </h4>
                        {isConnected('microsoft') && (
                          <div className="flex items-center gap-1 text-green-400 text-sm mt-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Conectado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {isConnected('microsoft') ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDisconnect(
                          integrations.find((i) => i.provider === 'microsoft')!.id
                        );
                      }}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleConnect('microsoft');
                      }}
                      disabled={connecting === 'microsoft'}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting === 'microsoft' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          Conectar
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Exportación ICS */}
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Exportar Calendario
              </h3>
              <div className="space-y-4">
                {/* Descarga directa */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExportICS();
                  }}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Descargar archivo .ics
                </button>

                {/* Suscripción ICS */}
                {subscriptionToken && (
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Suscripción ICS (Apple Calendar)
                    </h4>
                    <p className="text-slate-300 text-sm mb-3">
                      Copia esta URL y agrégalo a tu aplicación de calendario para
                      mantener tus sesiones sincronizadas automáticamente.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/study-planner/calendar-integrations/subscribe/ics/${subscriptionToken}`}
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCopySubscriptionUrl();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

