'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useVoiceAgent } from '@/lib/voice';

/**
 * Página de prueba para Gemini Live API
 * Accede en: http://localhost:3000/test-gemini
 */
export default function TestGeminiPage() {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Gemini Test] ${message}`);
  };

  const voice = useVoiceAgent({
    mode: 'gemini',
    context: 'conversational',
    language: 'es-ES',
    systemInstruction: 'Eres un asistente de voz amigable. Responde de forma breve y clara.',
    onError: (error) => {
      addLog(`❌ Error: ${error.message}`);
    },
  });

  // Conectar al montar
  useEffect(() => {
    addLog('🚀 Iniciando prueba de Gemini Live API...');

    const connectToGemini = async () => {
      try {
        addLog('🔌 Intentando conectar a Gemini...');
        await voice.connect();
        addLog('✅ Conexión exitosa!');
      } catch (error: any) {
        addLog(`❌ Error al conectar: ${error.message}`);
      }
    };

    connectToGemini();

    return () => {
      addLog('🔌 Desconectando...');
      voice.disconnect();
    };
  }, []);

  // Monitorear cambios de estado
  useEffect(() => {
    addLog(`📊 Estado de conexión: ${voice.connectionState}`);
  }, [voice.connectionState]);

  useEffect(() => {
    if (voice.isListening) {
      addLog('🎤 Escuchando...');
    } else {
      addLog('🔇 Micrófono detenido');
    }
  }, [voice.isListening]);

  useEffect(() => {
    if (voice.isSpeaking) {
      addLog('🔊 Gemini está hablando...');
    }
  }, [voice.isSpeaking]);

  const handleToggleListen = async () => {
    try {
      if (voice.isListening) {
        addLog('⏹️ Deteniendo micrófono...');
        voice.stopListening();
      } else {
        addLog('🎙️ Iniciando micrófono...');
        await voice.startListening();
        addLog('✅ Micrófono iniciado - ¡Puedes hablar ahora!');
      }
    } catch (error: any) {
      addLog(`❌ Error con micrófono: ${error.message}`);
    }
  };

  const handleTestTTS = async () => {
    try {
      addLog('🗣️ Enviando texto de prueba...');
      await voice.speak('Hola, soy Gemini. Esto es una prueba de síntesis de voz.');
      addLog('✅ Texto enviado');
    } catch (error: any) {
      addLog(`❌ Error en TTS: ${error.message}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🧪 Prueba de Gemini Live API
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Prueba la funcionalidad de conversación bidireccional
          </p>
        </div>

        {/* Estado de Conexión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            📊 Estado del Sistema
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatusCard
              label="Conexión"
              value={voice.connectionState}
              icon={
                voice.connectionState === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )
              }
              color={
                voice.connectionState === 'connected'
                  ? 'green'
                  : voice.connectionState === 'connecting'
                  ? 'yellow'
                  : 'red'
              }
            />

            <StatusCard
              label="Micrófono"
              value={voice.isListening ? 'Activo' : 'Inactivo'}
              icon={
                voice.isListening ? (
                  <Mic className="w-5 h-5 text-green-500" />
                ) : (
                  <MicOff className="w-5 h-5 text-gray-400" />
                )
              }
              color={voice.isListening ? 'green' : 'gray'}
            />

            <StatusCard
              label="Gemini"
              value={voice.isSpeaking ? 'Hablando' : 'Silencio'}
              icon={
                voice.isSpeaking ? (
                  <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )
              }
              color={voice.isSpeaking ? 'blue' : 'gray'}
            />

            <StatusCard
              label="Agente"
              value={voice.selectedAgent}
              icon={
                <span className="text-2xl">
                  {voice.selectedAgent === 'gemini' ? '🤖' : '🔊'}
                </span>
              }
              color="purple"
            />
          </div>
        </motion.div>

        {/* Controles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🎮 Controles
          </h2>

          <div className="flex flex-wrap gap-4">
            {/* Botón de Micrófono */}
            <motion.button
              onClick={handleToggleListen}
              disabled={!voice.isConnected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 min-w-[200px] px-6 py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                voice.isListening
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : voice.isConnected
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {voice.isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>Detener Micrófono</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>Activar Micrófono</span>
                  </>
                )}
              </div>
            </motion.button>

            {/* Botón de Prueba TTS */}
            <motion.button
              onClick={handleTestTTS}
              disabled={!voice.isConnected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 min-w-[200px] px-6 py-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                voice.isConnected
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span>Probar Voz</span>
              </div>
            </motion.button>

            {/* Botón de Detener Audio */}
            <motion.button
              onClick={() => {
                voice.stopAllAudio();
                addLog('⏹️ Audio detenido');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-4 rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <VolumeX className="w-5 h-5" />
                <span>Detener Audio</span>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              📝 Logs del Sistema
            </h2>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">Sin logs aún...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Instrucciones */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
            📖 Instrucciones
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
            <li>Espera a que el estado de conexión sea "connected" (verde)</li>
            <li>Haz clic en "Activar Micrófono" y permite el acceso al micrófono</li>
            <li>Habla claramente hacia el micrófono</li>
            <li>Gemini procesará tu voz y responderá automáticamente</li>
            <li>Puedes interrumpir a Gemini hablando mientras está respondiendo</li>
            <li>Usa "Detener Micrófono" cuando termines de hablar</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}

function StatusCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'purple';
}) {
  const colorClasses = {
    green: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    yellow: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    blue: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    gray: 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
    purple: 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div
      className={`border-2 rounded-lg p-4 ${colorClasses[color]} transition-all`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
        {value}
      </p>
    </div>
  );
}
