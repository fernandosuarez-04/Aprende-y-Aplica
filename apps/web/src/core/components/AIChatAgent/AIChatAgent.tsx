'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Loader2,
  Bot,
  User
} from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatAgentProps {
  assistantName?: string;
  assistantAvatar?: string;
  initialMessage?: string;
  promptPlaceholder?: string;
  context?: string; // Contexto específico para el agente (workshops, communities, news)
}

// Función para detectar automáticamente el contexto basado en la URL
function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}

// Función para obtener información contextual detallada de la página actual
function getPageContextInfo(pathname: string): string {
  const contextMap: Record<string, string> = {
    '/communities': 'página de comunidades - donde los usuarios pueden unirse y participar en grupos',
    '/courses': 'página de cursos - catálogo de cursos disponibles para aprendizaje',
    '/workshops': 'página de talleres - eventos y sesiones de formación',
    '/news': 'página de noticias - últimas actualizaciones y anuncios',
    '/dashboard': 'panel principal del usuario - vista general de su actividad',
    '/prompt-directory': 'directorio de prompts - colección de plantillas de prompts de IA',
    '/business-panel': 'panel de negocios - herramientas para empresas',
    '/profile': 'página de perfil de usuario',
  };

  // Buscar coincidencia exacta primero
  if (contextMap[pathname]) {
    return contextMap[pathname];
  }

  // Buscar coincidencia parcial
  for (const [path, description] of Object.entries(contextMap)) {
    if (pathname.includes(path)) {
      return description;
    }
  }

  return 'página principal de la plataforma';
}

export function AIChatAgent({
  assistantName = 'Lia',
  assistantAvatar = '/lia-avatar.png',
  initialMessage = '¡Hola! 👋 Soy Lia, tu asistente de IA. Estoy aquí para ayudarte con cualquier pregunta que tengas.',
  promptPlaceholder = 'Escribe tu pregunta...',
  context = 'general'
}: AIChatAgentProps) {
  const pathname = usePathname();
  
  // Detectar automáticamente el contexto basado en la URL
  const detectedContext = detectContextFromURL(pathname);
  const activeContext = context === 'general' ? detectedContext : context;
  const pageContextInfo = getPageContextInfo(pathname);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date()
    }
  ]);

  // Estado para posición arrastrable
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Debug: Log cuando los mensajes cambian
  useEffect(() => {
    console.log('📝 Mensajes actualizados:', messages.length, messages);
  }, [messages]);
  
  // Debug y log: Contexto detectado automáticamente
  useEffect(() => {
    console.log('🌐 Contexto detectado automáticamente:', {
      pathname,
      detectedContext,
      activeContext,
      pageContextInfo
    });
  }, [pathname, detectedContext, activeContext, pageContextInfo]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Cargar posición guardada al montar
  useEffect(() => {
    const savedPosition = localStorage.getItem('lia-chat-position');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPosition({ x, y });
      } catch (e) {
        console.error('Error loading saved position:', e);
      }
    }
  }, []);

  // Guardar posición cuando cambia
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('lia-chat-position', JSON.stringify(position));
    }
  }, [position]);

  // Ref para detectar si se arrastró o solo se hizo clic
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMoved = useRef(false);

  // Handlers para arrastrar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    // Solo prevenir default si no es el botón flotante
    if (isOpen) {
      e.preventDefault();
    }
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    
    // Guardar posición inicial del mouse para detectar si se arrastró
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    
    // Calcular offset basado en la posición del click dentro del elemento
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    // Si está en posición inicial (usando right/bottom), guardar la posición real
    if (position.x === 0 && position.y === 0) {
      // Calcular posición real desde el viewport y guardarla en ref
      initialPositionRef.current = {
        x: rect.left,
        y: rect.top
      };
    } else {
      initialPositionRef.current = null;
    }
    
    setDragOffset({
      x: offsetX,
      y: offsetY
    });
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    // Si está en posición inicial (usando right/bottom), guardar la posición real
    if (position.x === 0 && position.y === 0) {
      initialPositionRef.current = {
        x: rect.left,
        y: rect.top
      };
    } else {
      initialPositionRef.current = null;
    }
    
    setDragOffset({
      x: offsetX,
      y: offsetY
    });
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      
      // Detectar si realmente se está arrastrando (movimiento > 5px)
      if (dragStartPos.current) {
        const dx = Math.abs(e.clientX - dragStartPos.current.x);
        const dy = Math.abs(e.clientY - dragStartPos.current.y);
        if (dx < 5 && dy < 5) {
          // Todavía es un clic, no un arrastre
          return;
        }
        // Es un arrastre, marcar como movido
        hasMoved.current = true;
        dragStartPos.current = null;
      }
      
      // Calcular nueva posición basada en coordenadas del mouse menos el offset
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;
      
      // Si acabamos de empezar a arrastrar desde posición inicial (right/bottom),
      // convertir a coordenadas left/top y actualizar la posición una vez
      if (initialPositionRef.current) {
        // Calcular la posición real desde el viewport
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
        // Limpiar la ref para que no se vuelva a ejecutar
        initialPositionRef.current = null;
      }
      
      // Limitar a los bordes de la ventana
      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;
      
      // Asegurar que no se salga de los límites
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      let newX = touch.clientX - dragOffset.x;
      let newY = touch.clientY - dragOffset.y;
      
      // Si acabamos de empezar a arrastrar desde posición inicial, convertir a left/top
      if (initialPositionRef.current) {
        newX = touch.clientX - dragOffset.x;
        newY = touch.clientY - dragOffset.y;
        initialPositionRef.current = null;
      }
      
      const containerWidth = containerRef.current.offsetWidth || 384;
      const containerHeight = containerRef.current.offsetHeight || (isMinimized ? 80 : 600);
      const maxX = window.innerWidth - containerWidth;
      const maxY = window.innerHeight - containerHeight;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
      // Limpiar las refs al terminar
      initialPositionRef.current = null;
      // Usar un timeout para permitir que el onClick se ejecute si no se movió
      setTimeout(() => {
        dragStartPos.current = null;
        hasMoved.current = false;
      }, 100);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Auto-scroll al final cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Enfocar input cuando se abre el chat
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      console.log('🔄 Enviando mensaje a la API...', {
        message: userMessage.content,
        context: activeContext,
        pageInfo: pageContextInfo,
        pathname: pathname,
        historyLength: messages.length
      });
      
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: activeContext,
          pageContext: {
            pathname: pathname,
            description: pageContextInfo,
            detectedArea: detectedContext
          },
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userName: user?.display_name || user?.username || user?.first_name
        }),
      });
      
      console.log('📡 Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error de API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Datos recibidos:', data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje en este momento.',
        timestamp: new Date()
      };

      console.log('💬 Mensaje del asistente:', assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('❌ Error en el chat:', error);
      const errorContent = error instanceof Error ? error.message : 'Lo siento, ocurrió un error. Por favor intenta de nuevo.';
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Aquí se implementaría la lógica de reconocimiento de voz
    console.log('Recording toggled:', !isRecording);
  };

  const handleToggle = (e?: React.MouseEvent) => {
    // Si se está arrastrando o se movió el mouse, no ejecutar el toggle
    if (isDragging || hasMoved.current) {
      return;
    }
    if (e) {
      e.stopPropagation();
    }
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setHasUnreadMessages(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Botón flotante
  if (!isOpen) {
    return (
      <motion.div
        ref={containerRef}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: position.x || undefined,
          y: position.y || undefined
        }}
        className={`fixed z-[9998] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${position.x === 0 && position.y === 0 ? 'bottom-6 right-6' : ''}`}
        style={{
          ...(position.x === 0 && position.y === 0 && !isDragging
            ? { right: '24px', bottom: '24px', left: 'auto', top: 'auto' }
            : { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' })
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <motion.button
          onClick={(e) => {
            // Solo ejecutar toggle si no se arrastró
            if (!hasMoved.current && !isDragging) {
              handleToggle(e);
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-2xl hover:shadow-blue-500/50 transition-all pointer-events-auto"
        >
          {/* Efecto de pulso */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <div className="relative w-full h-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>

          {hasUnreadMessages && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
            />
          )}
        </motion.button>
      </motion.div>
    );
  }

  // Widget del chat
  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ 
          scale: isMinimized ? 0.8 : 1, 
          opacity: isMinimized ? 0 : 1,
          x: position.x || undefined,
          y: position.y || undefined,
          height: isMinimized ? 80 : 600
        }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ duration: isDragging ? 0 : 0.3, ease: 'easeInOut' }}
        className={`fixed w-96 max-w-[calc(100vw-3rem)] z-[9998] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ 
          height: isMinimized ? '80px' : '600px',
          maxHeight: 'calc(100vh - 3rem)',
          // Si nunca se ha arrastrado (posición inicial), usar right/bottom
          // Si ya tiene posición personalizada o está arrastrando, usar left/top
          ...(position.x === 0 && position.y === 0 && !isDragging
            ? { right: '24px', bottom: '24px', left: 'auto', top: 'auto' }
            : { left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' })
        }}
      >
        <div className="rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-carbon-700 flex flex-col bg-white dark:bg-[#0f0f0f] h-full">
          {/* Header con gradiente - Área de arrastre */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Efecto shimmer en el gradiente */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                {assistantAvatar ? (
                  <div className="relative">
                    <img 
                      src={assistantAvatar} 
                      alt={assistantName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                    />
                    {/* Indicador de estado en línea */}
                    <motion.div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <motion.div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                )}
                
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{assistantName}</h3>
                    <motion.div
                      className="flex items-center gap-1 text-white/90"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs">En línea</span>
                    </motion.div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Mensajes */}
          {!isMinimized && (
            <motion.div 
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0a0a0a] min-h-0 overscroll-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ 
                maxHeight: 'calc(600px - 200px)', // Altura total menos header e input
                scrollBehavior: 'smooth'
              }}
            >
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar del mensaje */}
                  {message.role === 'user' ? (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                      {user?.profile_picture_url ? (
                        <img 
                          src={user.profile_picture_url} 
                          alt={user.display_name || user.username || 'Usuario'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                      <img 
                        src={assistantAvatar} 
                        alt={assistantName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Contenido del mensaje */}
                  <div className={`flex-1 rounded-2xl px-4 py-3 shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white dark:bg-carbon-800 text-gray-900 dark:text-white border border-gray-200 dark:border-carbon-600'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-semibold">{message.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Indicador de escritura */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                    <img 
                      src={assistantAvatar} 
                      alt={assistantName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="bg-white dark:bg-carbon-800 border border-gray-200 dark:border-carbon-600 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </motion.div>
          )}

          {/* Input */}
          {!isMinimized && (
            <motion.div 
              className="p-4 border-t border-gray-200 dark:border-carbon-700 bg-white dark:bg-[#0f0f0f] flex-shrink-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={promptPlaceholder}
                  disabled={isTyping}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-carbon-800 border border-gray-300 dark:border-carbon-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium shadow-inner"
                />
                
                {/* Botón de micrófono */}
                <motion.button
                  onClick={toggleRecording}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    isRecording
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-carbon-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-carbon-700'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </motion.button>
                
                {/* Botón de enviar */}
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              
              {/* Instrucciones */}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 font-medium">
                <span>Presiona Enter para enviar</span>
                <span>•</span>
                <span>Micrófono para dictar</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

