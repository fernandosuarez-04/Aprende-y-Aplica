'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Send, 
  Mic, 
  MicOff, 
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { useStudyPlannerDashboardLIA, type DashboardMessage } from '../../../features/study-planner/hooks/useStudyPlannerDashboardLIA';

export default function StudyPlannerDashboardPage() {
  // Hook para el chat con LIA
  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearError,
  } = useStudyPlannerDashboardLIA();

  // Estado para el panel de LIA
  const [isLiaPanelOpen, setIsLiaPanelOpen] = useState(false);
  const [isLiaCollapsed, setIsLiaCollapsed] = useState(true);
  const liaPanelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estado para el input de mensaje
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Función para enviar mensaje
  const handleSendMessage = async () => {
    if (message.trim() && !isSending) {
      const messageToSend = message;
      setMessage('');
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      await sendMessage(messageToSend);
    }
  };

  // Renderizar mensaje del chat
  const renderMessage = (msg: DashboardMessage) => {
    const isUser = msg.role === 'user';
    
    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden mr-2">
            <Image
              src="/lia-avatar.png"
              alt="LIA"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          {msg.actionStatus === 'success' && (
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <CheckCircle className="w-3 h-3" />
              <span>Acción completada</span>
            </div>
          )}
          {msg.actionStatus === 'error' && (
            <div className="flex items-center gap-1 mt-2 text-xs text-red-500">
              <XCircle className="w-3 h-3" />
              <span>Error en la acción</span>
            </div>
          )}
          <span className="text-xs opacity-60 mt-1 block">
            {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </motion.div>
    );
  };

  // Ancho del panel cuando está expandido
  const expandedWidth = 'w-[520px]';

  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Panel Central - Lienzo en blanco para nuevo contenido */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
        }`}
      >
        <div className="flex-1 overflow-auto p-6">
          {/* Área vacía - Lienzo en blanco */}
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {/* Espacio reservado para nuevo contenido */}
            </p>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Chat con LIA */}
      <AnimatePresence>
        {isLiaPanelOpen && !isLiaCollapsed && (
          <motion.div
            ref={liaPanelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full z-40 bg-white dark:bg-slate-800 shadow-2xl flex flex-col ${expandedWidth}`}
          >
            {/* Header del Panel de LIA */}
            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-3 pb-2">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-3 flex-1">
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
                    <h3 className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                      LIA - Gestión de Plan
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      Tu asistente para gestionar sesiones
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsLiaCollapsed(true)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  title="Colapsar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>

            {/* Área de mensajes */}
            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-slate-900/30 pt-20">
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
                    <p>Escribe un mensaje para empezar a gestionar tu plan</p>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
                
                {/* Indicador de carga */}
                {isSending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
                      <Image
                        src="/lia-avatar.png"
                        alt="LIA"
                        width={32}
                        height={32}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>LIA está pensando...</span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Error */}
              {error && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button onClick={clearError} className="text-red-500 hover:text-red-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Barra de input */}
              <div className="px-3 pb-3 pt-2 bg-transparent">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="flex items-end gap-3"
                >
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-4 py-2.5 shadow-lg border border-gray-200 dark:border-slate-700/50 backdrop-blur-sm">
                    <textarea
                      ref={messageInputRef}
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (messageInputRef.current) {
                          messageInputRef.current.style.height = 'auto';
                          messageInputRef.current.style.height = `${Math.min(messageInputRef.current.scrollHeight, 100)}px`;
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Escribe un mensaje para gestionar tu plan..."
                      rows={1}
                      disabled={isSending}
                      className="w-full resize-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none max-h-[100px] overflow-y-auto leading-5 py-0.5 disabled:opacity-50"
                      style={{ minHeight: '20px', lineHeight: '20px' }}
                    />
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (message.trim()) {
                        handleSendMessage();
                      } else {
                        setIsRecording(!isRecording);
                      }
                    }}
                    disabled={isSending}
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 ${
                      message.trim()
                        ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                        : 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-600 dark:text-gray-300'
                    }`}
                    title={message.trim() ? 'Enviar mensaje' : isRecording ? 'Detener grabación' : 'Grabar audio'}
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : message.trim() ? (
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

      {/* Burbuja flotante de LIA */}
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
            title="Abrir chat con LIA"
          >
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
            {messages.length > 0 && (
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
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
