'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  Mic,
  MicOff,
  Send,
  Settings,
  Calendar as CalendarIcon,
  X,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import { StudyPlannerCalendar } from '@/features/study-planner/components/StudyPlannerCalendar';
import { ToastNotification } from '@/core/components/ToastNotification';
import { redirectToDashboard } from '@/features/auth/actions/dashboard-redirect';
import { useStudyPlannerDashboardLIA, type DashboardMessage } from '@/features/study-planner/hooks/useStudyPlannerDashboardLIA';

export default function StudyPlannerDashboardPage() {
  const router = useRouter();

  // Hook para el chat con LIA
  const {
    messages,
    isSending,
    error,
    sendMessage,
    clearError,
  } = useStudyPlannerDashboardLIA();

  // Estado para el panel de LIA (derecha)
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

  // Estados para los iconos de acción
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<'google' | 'microsoft' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'google' | 'microsoft' | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isRecreatingPlan, setIsRecreatingPlan] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const [showOnlyPlanEvents, setShowOnlyPlanEvents] = useState(false);
  
  // Estado para notificaciones toast
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'error' | 'success' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'error',
  });
  
  // Estado para modal de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Verificar estado de conexión al cargar
  useEffect(() => {
    checkCalendarConnection();
  }, []);

  // Cerrar menú de configuración al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(target)) {
        setIsSettingsMenuOpen(false);
      }
    };

    if (isSettingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSettingsMenuOpen]);

  const checkCalendarConnection = async () => {
    try {
      const response = await fetch('/api/study-planner/calendar/status');
      if (response.ok) {
        const data = await response.json();
        setIsGoogleConnected(data.isConnected);
        setConnectedProvider(data.provider || null);
      }
    } catch (error) {
      console.error('Error verificando conexión:', error);
    }
  };

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    setConnectingProvider(provider);
    setIsConnecting(true);
    setCalendarError(null);
    
    try {
      const response = await fetch('/api/study-planner/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.authUrl) {
          // Construir URL con usePopup en el state
          const baseUrl = window.location.origin;
          let authUrl = data.data.authUrl;
          
          // Modificar el state para incluir usePopup
          try {
            const url = new URL(authUrl);
            const stateParam = url.searchParams.get('state');
            
            let stateData: any;
            if (stateParam) {
              // Intentar decodificar el state (puede estar codificado)
              try {
                // Primero intentar parsear directamente (puede no estar codificado)
                stateData = JSON.parse(stateParam);
              } catch {
                // Si falla, intentar decodificar primero
                try {
                  stateData = JSON.parse(decodeURIComponent(stateParam));
                } catch {
                  // Si aún falla, intentar decodificar dos veces
                  try {
                    stateData = JSON.parse(decodeURIComponent(decodeURIComponent(stateParam)));
                  } catch {
                    // Si todo falla, crear un nuevo state
                    console.warn('No se pudo parsear el state, creando uno nuevo');
                    stateData = { provider };
                  }
                }
              }
            } else {
              // Si no hay state, crear uno nuevo
              stateData = { provider };
            }
            
            // Agregar usePopup y returnUrl (sobrescribir si ya existen)
            stateData.usePopup = true;
            stateData.returnUrl = window.location.href;
            
            // Codificar el state actualizado (sin doble codificación)
            url.searchParams.set('state', JSON.stringify(stateData));
            authUrl = url.toString();

          } catch (e) {
            console.error('❌ Error modificando la URL:', e);
            // Si falla, intentar construir la URL manualmente
            const separator = authUrl.includes('?') ? '&' : '?';
            const stateData = {
              provider,
              returnUrl: window.location.href,
              usePopup: true
            };
            authUrl = `${authUrl}${separator}state=${encodeURIComponent(JSON.stringify(stateData))}`;

          }
          
          // Abrir popup
          const popup = window.open(
            authUrl,
            `${provider}-calendar-auth`,
            'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
          );
          
          if (!popup) {
            setToast({
              isOpen: true,
              message: 'Por favor, permite que se abran ventanas emergentes para este sitio y vuelve a intentar.',
              type: 'error',
            });
            setIsConnecting(false);
            setConnectingProvider(null);
            return;
          }
          
          // Bandera para evitar procesar el mismo mensaje múltiples veces
          let messageProcessed = false;
          let checkClosed: NodeJS.Timeout | null = null;
          
          // Escuchar mensajes del popup
          const messageListener = (event: MessageEvent) => {
            // Verificar origen para seguridad
            const isSameOrigin = event.origin === baseUrl || 
                                event.origin === window.location.origin ||
                                event.origin.includes(window.location.hostname);
            
            if (!isSameOrigin) {
              console.warn('Mensaje rechazado por origen diferente:', event.origin);
              return;
            }
            
            if (event.data && event.data.type === 'calendar-connected') {
              if (messageProcessed) {

                return;
              }
              messageProcessed = true;
              
              const connectedProvider = event.data.provider || provider;

              // Limpiar listeners
              window.removeEventListener('message', messageListener);
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }
              
              // Cerrar popup si aún está abierto
              if (popup && !popup.closed) {
                try {
                  popup.close();
                } catch (e) {
                  console.warn('No se pudo cerrar el popup:', e);
                }
              }
              
              // Actualizar estado
              setIsConnecting(false);
              setConnectingProvider(null);
              setIsGoogleConnected(true);
              setConnectedProvider(connectedProvider as 'google' | 'microsoft');
              setIsCalendarModalOpen(false);
              
            } else if (event.data && event.data.type === 'calendar-error') {
              console.error('Error al conectar calendario:', event.data.error);
              
              // Limpiar listeners
              window.removeEventListener('message', messageListener);
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }
              
              // Intentar cerrar popup
              if (popup) {
                try {
                  if (typeof popup.closed === 'boolean' && !popup.closed) {
                    popup.close();
                  }
                } catch (e) {

                }
              }
              
              setIsConnecting(false);
              setConnectingProvider(null);
              setCalendarError(event.data.error || 'Error desconocido al conectar el calendario');
            }
          };
          
          // Agregar listener
          window.addEventListener('message', messageListener);
          
          // Verificar si el popup se cerró manualmente
          checkClosed = setInterval(() => {
            if (popup.closed) {
              if (checkClosed) {
                clearInterval(checkClosed);
                checkClosed = null;
              }
              window.removeEventListener('message', messageListener);
              if (!messageProcessed) {
                setIsConnecting(false);
                setConnectingProvider(null);
              }
            }
          }, 500);
          
        } else {
          setCalendarError('Error al iniciar la conexión');
          setIsConnecting(false);
          setConnectingProvider(null);
        }
      } else {
        setCalendarError('Error al conectar el calendario');
        setIsConnecting(false);
        setConnectingProvider(null);
      }
    } catch (error) {
      console.error('Error conectando calendario:', error);
      setCalendarError('Error al conectar el calendario');
      setIsConnecting(false);
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async () => {
    if (!connectedProvider) return;
    
    try {
      const response = await fetch('/api/study-planner/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: connectedProvider }),
      });
      
      if (response.ok) {
        setIsGoogleConnected(false);
        setConnectedProvider(null);
        setIsCalendarModalOpen(false);
      } else {
        setCalendarError('Error al desconectar el calendario');
      }
    } catch (error) {
      console.error('Error desconectando calendario:', error);
      setCalendarError('Error al desconectar el calendario');
    }
  };

  // Función para eliminar el plan actual
  const handleDeletePlan = () => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar tu plan de estudio? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        await performDeletePlan();
      },
      onCancel: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const performDeletePlan = async () => {
    setIsDeletingPlan(true);
    try {
      const response = await fetch('/api/study-planner/plan', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setToast({
          isOpen: true,
          message: data.message || 'Plan eliminado exitosamente',
          type: 'success',
        });
        // Recargar la página para actualizar el calendario después de un breve delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errorData = await response.json();
        setToast({
          isOpen: true,
          message: errorData.error || 'Error al eliminar el plan',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error eliminando plan:', error);
      setToast({
        isOpen: true,
        message: 'Error al eliminar el plan',
        type: 'error',
      });
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // Función para eliminar plan anterior y redirigir a create
  const handleRecreatePlan = () => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar tu plan actual y crear uno nuevo?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        await performRecreatePlan();
      },
      onCancel: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const performRecreatePlan = async () => {
    setIsRecreatingPlan(true);
    try {
      // Eliminar el plan anterior si existe
      const response = await fetch('/api/study-planner/plan', {
        method: 'DELETE',
      });

      if (response.ok) {
        // Redirigir a la página de creación
        router.push('/study-planner/create');
      } else {
        const errorData = await response.json();
        // Si no hay plan, igual redirigir a create
        if (errorData.message?.includes('No hay plan')) {
          router.push('/study-planner/create');
        } else {
          setToast({
            isOpen: true,
            message: errorData.error || 'Error al eliminar el plan anterior',
            type: 'error',
          });
          setIsRecreatingPlan(false);
        }
      }
    } catch (error) {
      console.error('Error recreando plan:', error);
      setToast({
        isOpen: true,
        message: 'Error al recrear el plan',
        type: 'error',
      });
      // Intentar redirigir de todas formas
      setTimeout(() => {
        router.push('/study-planner/create');
      }, 2000);
    }
  };

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
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-base font-semibold mb-1">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold mb-1 mt-1.5">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mb-1 mt-1.5">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-1.5 leading-relaxed">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic">{children}</em>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-1.5 space-y-0.5">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-1.5 space-y-0.5">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  br: () => <br />,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
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
      {/* Panel Central - Calendario y acciones */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isLiaPanelOpen && !isLiaCollapsed ? 'mr-[520px]' : ''
        }`}
      >
        {/* Barra superior con iconos de acción */}
        <div className="flex items-center justify-start gap-3 px-6 pt-6 pb-2">
          {/* Botón Dashboard */}
          <div className="relative">
            <motion.button
              layout
              onClick={async () => {
                try {
                  await redirectToDashboard();
                } catch (error) {
                  // Verificar si es una redirección de Next.js (no es un error real)
                  if (error && typeof error === 'object' && 'digest' in error) {
                    const digest = (error as any).digest;
                    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
                      // Es una redirección exitosa, dejar que Next.js la maneje
                      return;
                    }
                  }
                  console.error('Error redirigiendo al dashboard:', error);
                }
              }}
              onMouseEnter={() => setHoveredButton('dashboard')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors flex items-center overflow-hidden"
              title="Ir al Dashboard"
              aria-label="Ir al Dashboard"
            >
              <motion.div 
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'dashboard' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: hoveredButton === 'dashboard' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'dashboard' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Ir al Dashboard
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Icono de Calendario de Google */}
          <div className="relative calendar-menu-container">
            <motion.button
              layout
              onClick={() => {
                setIsCalendarModalOpen(true);
                setIsSettingsMenuOpen(false);
              }}
              onMouseEnter={() => setHoveredButton('calendar')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className={`
                rounded-lg transition-colors flex items-center overflow-hidden
                ${isGoogleConnected
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800/50'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                }
              `}
            >
              <motion.div 
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={hoveredButton === 'calendar' ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{
                  duration: 0.5,
                  repeat: hoveredButton === 'calendar' ? Infinity : 0,
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              >
                {isGoogleConnected ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'calendar' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    {isGoogleConnected ? 'Google conectado' : 'Conectar calendario'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

          </div>

          {/* Botón Añadir y Eliminar Plan */}
          <div className="relative">
            <motion.button
              layout
              onClick={handleRecreatePlan}
              disabled={isRecreatingPlan}
              onMouseEnter={() => setHoveredButton('recreate')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 border border-blue-600 dark:border-blue-700 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <motion.div 
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={isRecreatingPlan ? {
                  rotate: 360,
                } : hoveredButton === 'recreate' ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: isRecreatingPlan ? 1 : 0.5,
                  repeat: isRecreatingPlan ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                {isRecreatingPlan ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'recreate' && !isRecreatingPlan && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Nuevo plan
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Botón Eliminar Plan */}
          <div className="relative">
            <motion.button
              layout
              onClick={handleDeletePlan}
              disabled={isDeletingPlan}
              onMouseEnter={() => setHoveredButton('delete')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 border border-red-600 dark:border-red-700 transition-colors flex items-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <motion.div 
                className="p-2.5 flex-shrink-0 flex items-center justify-center"
                animate={isDeletingPlan ? {
                  rotate: 360,
                } : hoveredButton === 'delete' ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: isDeletingPlan ? 1 : 0.5,
                  repeat: isDeletingPlan ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                {isDeletingPlan ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'delete' && !isDeletingPlan && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Eliminar plan
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Icono de Configuraciones */}
          <div ref={settingsMenuRef} className="relative">
            <motion.button
              layout
              onClick={() => {
                setIsSettingsMenuOpen(!isSettingsMenuOpen);
                setIsCalendarModalOpen(false);
              }}
              onMouseEnter={() => setHoveredButton('settings')}
              onMouseLeave={() => setHoveredButton(null)}
              whileTap={{ scale: 0.95 }}
              className="rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-colors flex items-center overflow-hidden"
            >
              <motion.div 
                className="p-2.5 flex-shrink-0"
                animate={hoveredButton === 'settings' ? {
                  rotate: 360,
                } : {}}
                transition={{
                  duration: 1,
                  repeat: hoveredButton === 'settings' ? Infinity : 0,
                  ease: 'linear'
                }}
              >
                <Settings className="w-5 h-5" />
              </motion.div>
              <AnimatePresence>
                {hoveredButton === 'settings' && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="pr-3 whitespace-nowrap text-sm font-medium overflow-hidden inline-block"
                  >
                    Configuración
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Menú desplegable de Configuraciones */}
            <AnimatePresence>
              {isSettingsMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {/* Filtro de eventos */}
                    <div className="px-3 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Solo eventos del plan
                      </span>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOnlyPlanEvents(!showOnlyPlanEvents);
                        }}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer
                          ${showOnlyPlanEvents 
                            ? 'bg-blue-600 dark:bg-blue-500' 
                            : 'bg-gray-200 dark:bg-slate-600'
                          }
                        `}
                        role="switch"
                        aria-checked={showOnlyPlanEvents}
                        aria-label="Mostrar solo eventos del plan"
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.span
                          className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                          animate={{
                            x: showOnlyPlanEvents ? 22 : 4,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      </motion.button>
                    </div>
                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      Preferencias de vista
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      Notificaciones
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      Sincronización
                    </button>
                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                    <button className="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      Ayuda
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {/* Calendario de Estudios */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 min-h-full">
            <StudyPlannerCalendar showOnlyPlanEvents={showOnlyPlanEvents} />   
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

      {/* Modal de Calendario */}
      <AnimatePresence>
        {isCalendarModalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCalendarModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Conectar Calendario
                  </h2>
                  <button
                    onClick={() => setIsCalendarModalOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Contenido */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    {isGoogleConnected ? 'Gestiona tus calendarios conectados:' : 'Selecciona tu proveedor de calendario:'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Google Calendar */}
                    <div className={`relative flex flex-col items-center gap-3 p-5 rounded-xl transition-all ${
                      connectedProvider === 'google'
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-500 shadow-lg shadow-green-500/20'
                        : 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500'
                    }`}>
                      {connectedProvider === 'google' && (
                        <button
                          onClick={handleDisconnect}
                          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                          title="Desconectar Google Calendar"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                        </button>
                      )}
                      
                      <motion.button
                        onClick={() => connectedProvider !== 'google' && handleConnect('google')}
                        disabled={isConnecting || connectedProvider === 'google'}
                        whileHover={connectedProvider !== 'google' && !isConnecting ? { scale: 1.02 } : {}}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-3 w-full disabled:cursor-default"
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
                        <span className={`text-sm font-medium ${
                          connectedProvider === 'google'
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          Google Calendar
                        </span>
                        {connectedProvider === 'google' && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Conectado
                          </span>
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Microsoft Calendar */}
                    <div className={`relative flex flex-col items-center gap-3 p-5 rounded-xl transition-all ${
                      connectedProvider === 'microsoft'
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-500 shadow-lg shadow-green-500/20'
                        : 'bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500'
                    }`}>
                      {connectedProvider === 'microsoft' && (
                        <button
                          onClick={handleDisconnect}
                          className="absolute top-2 right-2 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                          title="Desconectar Microsoft Calendar"
                        >
                          <X className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                        </button>
                      )}
                      
                      <motion.button
                        onClick={() => connectedProvider !== 'microsoft' && handleConnect('microsoft')}
                        disabled={isConnecting || connectedProvider === 'microsoft'}
                        whileHover={connectedProvider !== 'microsoft' && !isConnecting ? { scale: 1.02 } : {}}
                        whileTap={{ scale: 0.98 }}
                        className="flex flex-col items-center gap-3 w-full disabled:cursor-default"
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
                        <span className={`text-sm font-medium ${
                          connectedProvider === 'microsoft'
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          Microsoft
                        </span>
                        {connectedProvider === 'microsoft' && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Conectado
                          </span>
                        )}
                      </motion.button>
                    </div>
                  </div>
                  
                  {!isGoogleConnected && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                      Conecta tu calendario para sincronizar tus eventos
                    </p>
                  )}

                  {/* Error */}
                  {calendarError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{calendarError}</p>
        </motion.div>
                  )}
      </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
        duration={toast.type === 'error' ? 6000 : 4000}
      />
      
      {/* Modal de Confirmación */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                confirmDialog.onCancel();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-700"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirmar acción
                </h3>
              </div>

              {/* Contenido */}
              <div className="px-6 py-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {confirmDialog.message}
                </p>
              </div>

              {/* Botones */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  onClick={confirmDialog.onCancel}
                  disabled={isDeletingPlan || isRecreatingPlan}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  disabled={isDeletingPlan || isRecreatingPlan}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(isDeletingPlan || isRecreatingPlan) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isDeletingPlan ? 'Eliminando...' : 'Procesando...'}
                    </>
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
