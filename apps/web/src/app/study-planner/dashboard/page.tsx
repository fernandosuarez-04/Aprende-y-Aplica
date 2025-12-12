'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MessageSquare, X, Mic, MicOff, Send } from 'lucide-react';
import Image from 'next/image';

export default function StudyPlannerDashboardPage() {
  // Estado para el panel derecho de LIA
  // Iniciar con el panel cerrado para mostrar la burbuja
  const [isLiaPanelOpen, setIsLiaPanelOpen] = useState(false);
  const [isLiaCollapsed, setIsLiaCollapsed] = useState(true);
  const liaPanelRef = useRef<HTMLDivElement>(null);

  // Estado para el calendario (se implementará después)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  
  // Estado para el input de mensaje
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Función para enviar mensaje
  const handleSendMessage = () => {
    if (message.trim()) {
      // Aquí se enviará el mensaje a LIA
      console.log('Enviando mensaje:', message);
      setMessage('');
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
    }
  };

  // Ancho del panel cuando está expandido (más ancho)
  const expandedWidth = 'w-[520px]';

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Panel Central - Calendario */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
        }`}
      >
        <div className="flex-1 overflow-auto p-6">
          {/* Placeholder para el calendario */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 min-h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Calendario de Estudios
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tus sesiones de estudio y eventos del calendario
                </p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <p className="text-gray-600 dark:text-gray-400 text-center py-12">
                El calendario se mostrará aquí con:
              </p>
              <ul className="space-y-3 max-w-md mx-auto">
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sesiones de estudio programadas
                </li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Eventos de Google Calendar
                </li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Eventos de Microsoft Calendar
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Derecho - LIA Coach (solo cuando está expandido) */}
      <AnimatePresence>
        {isLiaPanelOpen && !isLiaCollapsed && (
          <motion.div
            ref={liaPanelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full z-40 bg-white dark:bg-slate-800 shadow-2xl flex flex-col ${expandedWidth} transition-all duration-300 ease-in-out`}
          >
            {/* Header del Panel de LIA - Flotante */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-2">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 flex-1"
                >
                  {/* Avatar de LIA */}
                  <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-purple-500/20 dark:ring-purple-400/30 flex-shrink-0">
                    <Image
                      src="/lia-avatar.png"
                      alt="LIA"
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-gray-900 dark:text-white font-semibold text-sm truncate">LIA Coach</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">Tu asistente de estudio</p>
                  </div>
                </motion.div>
                <button
                  onClick={() => setIsLiaCollapsed(true)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  title="Colapsar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Contenido del Panel de LIA - Chat */}
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-slate-900/30 pt-20">
              {/* Área de mensajes de LIA */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {/* Los mensajes aparecerán aquí */}
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                  <p>LIA te enviará mensajes proactivos aquí</p>
                </div>
              </div>
              
              {/* Barra de input flotante estilo Telegram - Más pequeña y minimalista */}
              <div className="px-3 pb-3 pt-2 bg-transparent">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-end gap-3"
                >
                  {/* Campo de texto - Separado del botón */}
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-4 py-2.5 shadow-lg border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                    <textarea
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        // Auto-resize textarea
                        if (messageInputRef.current) {
                          messageInputRef.current.style.height = 'auto';
                          messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 60)}px`;
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            handleSendMessage();
                          }
                        }
                      }}
                      placeholder="Escribe un mensaje..."
                      rows={1}
                      className="w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none max-h-[60px] overflow-y-auto leading-5 py-0.5"
                      style={{ 
                        minHeight: '20px',
                        textAlign: message ? 'left' : 'center',
                        lineHeight: '20px'
                      }}
                    />
                  </div>
                  
                  {/* Botón de micrófono/enviar - Fuera del campo, un poco más grande */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (message.trim()) {
                        handleSendMessage();
                      } else {
                        // Toggle recording
                        setIsRecording(!isRecording);
                      }
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      message.trim()
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                        : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-600 dark:text-gray-300'
                    }`}
                    title={message.trim() ? 'Enviar mensaje' : isRecording ? 'Detener grabación' : 'Grabar audio'}
                  >
                    {message.trim() ? (
                      <Send className="w-5 h-5" />
                    ) : isRecording ? (
                      <MicOff className="w-5 h-5" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Burbuja flotante de LIA (cuando está colapsado o cerrado) */}
      <AnimatePresence>
        {(isLiaCollapsed || !isLiaPanelOpen) && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={() => {
              setIsLiaPanelOpen(true);
              setIsLiaCollapsed(false);
            }}
            className="fixed right-4 bottom-4 z-50 w-16 h-16 rounded-full shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group overflow-hidden ring-4 ring-purple-500/20 dark:ring-purple-400/30"
            title="Abrir LIA Coach"
          >
            {/* Avatar de LIA en la burbuja */}
            <div className="relative w-full h-full">
              <Image
                src="/lia-avatar.png"
                alt="LIA"
                fill
                className="object-cover group-hover:scale-110 transition-transform"
                sizes="64px"
              />
            </div>
            {/* Indicador de notificación */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 z-10"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-full h-full bg-red-500 rounded-full"
              />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
