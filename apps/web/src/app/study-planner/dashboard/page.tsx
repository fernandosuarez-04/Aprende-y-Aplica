'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Calendar, 
  Send, 
  Mic, 
  MicOff, 
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  CalendarDays,
  BookOpen,
  PlusCircle
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useStudyPlannerDashboardLIA, type DashboardMessage } from '../../../features/study-planner/hooks/useStudyPlannerDashboardLIA';

export default function StudyPlannerDashboardPage() {
  const router = useRouter();
  
  // Hook para el chat con LIA
  const {
    messages,
    isLoading,
    isSending,
    error,
    activePlan,
    calendarChanges,
    hasNewCalendarChanges,
    sendMessage,
    checkCalendarChanges,
    loadActivePlan,
    clearError,
    dismissCalendarChanges,
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

  // Abrir panel automáticamente si hay cambios en calendario
  useEffect(() => {
    if (hasNewCalendarChanges && !isLiaPanelOpen) {
      setIsLiaPanelOpen(true);
      setIsLiaCollapsed(false);
    }
  }, [hasNewCalendarChanges, isLiaPanelOpen]);

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

  // Formatear fecha de sesión (usando zona horaria local)
  const formatSessionDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      timeZone: 'America/Bogota'
    });
  };

  const formatSessionTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Bogota'
    });
  };

  // Obtener sesiones próximas (incluye todas las de hoy, incluso si ya pasó la hora)
  const upcomingSessions = activePlan?.sessions
    .filter(s => {
      if (s.status !== 'planned') return false;
      const sessionDate = new Date(s.startTime);
      const now = new Date();
      
      // Incluir sesiones de hoy (aunque ya hayan pasado) y futuras
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      return sessionDate >= todayStart;
    })
    .slice(0, 5) || [];

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
      {/* Panel Central - Contenido del Dashboard */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
        }`}
      >
        <div className="flex-1 overflow-auto p-6">
          {/* Header del Dashboard */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mi Plan de Estudios
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona tu plan de estudios con ayuda de LIA
            </p>
          </div>

          {/* Alerta de cambios en calendario */}
          {hasNewCalendarChanges && calendarChanges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Se detectaron cambios en tu calendario
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Hay {calendarChanges.length} posibles conflictos con tus sesiones de estudio.
                  </p>
                  <button
                    onClick={() => {
                      setIsLiaPanelOpen(true);
                      setIsLiaCollapsed(false);
                    }}
                    className="mt-2 text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline"
                  >
                    Hablar con LIA para resolver →
                  </button>
                </div>
                <button
                  onClick={dismissCalendarChanges}
                  className="text-amber-500 hover:text-amber-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Estado de carga */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando tu plan...</span>
            </div>
          ) : !activePlan ? (
            /* Sin plan activo */
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No tienes un plan de estudios activo
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Crea tu primer plan de estudios personalizado con ayuda de LIA para organizar tu aprendizaje.
              </p>
              <button
                onClick={() => router.push('/study-planner/create')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <PlusCircle className="w-5 h-5" />
                Crear Plan de Estudios
              </button>
            </div>
          ) : (
            /* Contenido con plan activo */
            <div className="space-y-6">
              {/* Resumen del Plan */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {activePlan.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activePlan.description || 'Tu plan de estudios personalizado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkCalendarChanges()}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Sincronizar calendario"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activePlan.totalSessions}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Sesiones totales</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {activePlan.completedSessions}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Completadas</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {activePlan.upcomingSessions}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Próximas</div>
                  </div>
                </div>
              </div>

              {/* Próximas Sesiones */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Próximas Sesiones
                  </h2>
                </div>

                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {session.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatSessionDate(session.startTime)} • {formatSessionTime(session.startTime)} - {formatSessionTime(session.endTime)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                          {session.durationMinutes} min
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No hay sesiones programadas próximamente
                  </p>
                )}

                {/* Nota sobre gestión con LIA */}
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src="/lia-avatar.png"
                        alt="LIA"
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>¿Necesitas hacer cambios?</strong> Habla conmigo para mover, ajustar o eliminar sesiones de tu plan.
                      </p>
                      <button
                        onClick={() => {
                          setIsLiaPanelOpen(true);
                          setIsLiaCollapsed(false);
                        }}
                        className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                      >
                        Abrir chat con LIA →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            {(hasNewCalendarChanges || messages.length > 0) && (
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
