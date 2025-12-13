'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface CalendarConnectionProps {
  isConnected: boolean;
  provider?: 'google' | 'microsoft';
  onConnect?: (provider: 'google' | 'microsoft') => void;
  onDisconnect?: () => void;
  onAnalyze?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function CalendarConnection({
  isConnected,
  provider,
  onConnect,
  onDisconnect,
  onAnalyze,
  isLoading = false,
  error = null,
}: CalendarConnectionProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'microsoft' | null>(null);

  // Manejar conexión
  const handleConnect = async (selectedProvider: 'google' | 'microsoft') => {
    setConnectingProvider(selectedProvider);
    
    try {
      // Llamar a la API para obtener URL de autorización
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider }),
      });
      
      if (!response.ok) {
        throw new Error('Error al iniciar la conexión');
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.authUrl) {
        // Abrir ventana de autorización
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      console.error('Error conectando calendario:', err);
      setConnectingProvider(null);
    }
  };

  // Manejar desconexión
  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      if (response.ok) {
        onDisconnect?.();
      }
    } catch (err) {
      console.error('Error desconectando calendario:', err);
    }
  };

  // Detectar conexión exitosa desde URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calendarConnected = params.get('calendar_connected');
    const calendarError = params.get('calendar_error');
    
    if (calendarConnected) {
      // Limpiar parámetros de URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    if (calendarError) {
      console.error('Error de calendario:', calendarError);
      // Limpiar parámetros de URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const providerName = provider === 'google' ? 'Google Calendar' : 'Microsoft Calendar';
  const providerIcon = provider === 'google' 
    ? '/icons/google-calendar.svg' 
    : '/icons/microsoft-outlook.svg';

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isConnected ? (
          // Estado conectado
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-lg">
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Calendario conectado
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {providerName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {onAnalyze && (
                  <motion.button
                    onClick={onAnalyze}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Analizar
                  </motion.button>
                )}
                
                <motion.button
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/30 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : showOptions ? (
          // Opciones de conexión
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              Selecciona tu proveedor de calendario:
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Google Calendar */}
              <motion.button
                onClick={() => handleConnect('google')}
                disabled={connectingProvider !== null}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingProvider === 'google' ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Google Calendar
                </span>
              </motion.button>
              
              {/* Microsoft Calendar */}
              <motion.button
                onClick={() => handleConnect('microsoft')}
                disabled={connectingProvider !== null}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingProvider === 'microsoft' ? (
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-8 h-8">
                      <path fill="#F25022" d="M1 1h10v10H1z"/>
                      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                      <path fill="#FFB900" d="M13 13h10v10H13z"/>
                    </svg>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  Microsoft
                </span>
              </motion.button>
            </div>
            
            <button
              onClick={() => setShowOptions(false)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2"
            >
              Cancelar
            </button>
          </motion.div>
        ) : (
          // Botón para conectar
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <motion.button
              onClick={() => setShowOptions(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25"
            >
              <Calendar className="w-5 h-5" />
              Conectar Calendario
            </motion.button>
            
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Conecta tu calendario para analizar tu disponibilidad real
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

export default CalendarConnection;

