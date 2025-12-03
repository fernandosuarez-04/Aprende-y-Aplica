'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { CourseLessonContext, LiaMessage } from '../types/lia.types';
import { IntentDetectionService } from '../services/intent-detection.service';

// Tipos de modo para el chat
export type LiaChatMode = 'course' | 'prompts' | 'context';

// Interfaz para prompts generados
export interface GeneratedPrompt {
  title: string;
  description: string;
  content: string;
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  use_cases: string[];
  tips: string[];
}

export interface UseLiaChatReturn {
  messages: LiaMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, courseContext?: CourseLessonContext, isSystemMessage?: boolean) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
  // ✨ Nuevas funcionalidades para modos
  currentMode: LiaChatMode;
  setMode: (mode: LiaChatMode) => void;
  generatedPrompt: GeneratedPrompt | null;
  clearPrompt: () => void;
}

export function useLiaChat(initialMessage?: string | null): UseLiaChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiaMessage[]>(
    initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
      ? [
          {
            id: 'initial',
            role: 'assistant',
            content: initialMessage,
            timestamp: new Date()
          }
        ]
      : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ✅ ANALYTICS: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);

  // ✨ NUEVOS ESTADOS: Modos y prompts generados
  const [currentMode, setCurrentMode] = useState<LiaChatMode>('course');
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    courseContext?: CourseLessonContext,
    isSystemMessage: boolean = false
  ) => {
    if (!message.trim() || isLoading) return;

    // Variable para determinar el modo a usar en esta llamada
    let modeForThisMessage = currentMode;
    let shouldNotifyModeChange = false;
    let modeChangeMessage = '';

    // ✨ DETECCIÓN BIDIRECCIONAL DE INTENCIONES (solo si no es mensaje del sistema)
    if (!isSystemMessage) {
      try {
        console.log('[LIA] 🔍 Detectando intención para:', message.trim());
        console.log('[LIA] 📍 Modo actual:', currentMode);
        const intentResult = await IntentDetectionService.detectIntent(message.trim());
        console.log('[LIA] 📊 Resultado de detección:', {
          intent: intentResult.intent,
          confidence: `${(intentResult.confidence * 100).toFixed(1)}%`,
          threshold: '70%'
        });
        
        // CASO 1: Si NO estamos en modo prompts y detectamos intención de crear prompts
        if (currentMode !== 'prompts' && intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {
          console.log('[LIA] ✅ Activando Modo Prompts automáticamente');
          modeForThisMessage = 'prompts';
          shouldNotifyModeChange = true;
          modeChangeMessage = "✨ He detectado que quieres crear un prompt. He activado el Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?";
          setCurrentMode('prompts');
        }
        // CASO 2: Si ESTAMOS en modo prompts pero la pregunta NO es sobre crear prompts
        else if (currentMode === 'prompts' && intentResult.intent !== 'create_prompt') {
          console.log('[LIA] 🔄 Pregunta general detectada desde Prompts. Cambiando a Modo Contexto');
          modeForThisMessage = 'context';
          shouldNotifyModeChange = true;
          modeChangeMessage = "🧠 He cambiado al Modo Contexto para responder tu pregunta general.";
          setCurrentMode('context');
        }
        // CASO 3: Si ESTAMOS en modo curso y detectamos intención de navegar o pregunta sobre la plataforma
        else if (currentMode === 'course' && intentResult.intent === 'navigate') {
          console.log('[LIA] 🔄 Pregunta de navegación detectada desde Curso. Cambiando a Modo Contexto');
          modeForThisMessage = 'context';
          shouldNotifyModeChange = true;
          modeChangeMessage = "🧠 He cambiado al Modo Contexto para ayudarte con la navegación.";
          setCurrentMode('context');
        }
        // CASO 4: Si ESTAMOS en modo curso y detectamos pregunta general sobre la plataforma (no del curso)
        else if (currentMode === 'course' && intentResult.intent === 'general') {
          // Verificar si la pregunta parece ser sobre la plataforma y no sobre el contenido del curso
          const platformKeywords = [
            'comunidad', 'comunidades', 'noticias', 'noticia', 'dashboard', 'perfil',
            'configuración', 'ajustes', 'cuenta', 'talleres', 'taller', 'workshops',
            'directorio', 'prompts', 'apps', 'aplicaciones', 'plataforma', 'sitio',
            'web', 'página', 'sección', 'menú', 'navegación', 'link', 'enlace',
            'acceder', 'ir a', 'llévame', 'muéstrame', 'dónde está', 'cómo llego'
          ];
          const messageLower = message.toLowerCase();
          const isPlatformQuestion = platformKeywords.some(keyword => messageLower.includes(keyword));
          
          if (isPlatformQuestion) {
            console.log('[LIA] 🔄 Pregunta sobre la plataforma detectada desde Curso. Cambiando a Modo Contexto');
            modeForThisMessage = 'context';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🧠 He cambiado al Modo Contexto para responder tu pregunta sobre la plataforma.";
            setCurrentMode('context');
          }
        }
      } catch (intentError) {
        console.error('[LIA] ❌ Error detectando intención:', intentError);
        // Continuar normalmente si falla la detección
      }
    }

    // Si NO es un mensaje del sistema, agregarlo como mensaje de usuario visible
    if (!isSystemMessage) {
      const userMessage: LiaMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Si debemos notificar cambio de modo, agregar mensaje del sistema DESPUÉS del mensaje de usuario
      if (shouldNotifyModeChange && modeChangeMessage) {
        setTimeout(() => {
          const systemMessage: LiaMessage = {
            id: `system-${Date.now()}`,
            role: 'assistant',
            content: modeChangeMessage,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, systemMessage]);
        }, 100);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✨ Determinar el contexto según el modo (usar el modo detectado en esta llamada)
      let effectiveContext = 'general';
      let shouldSendCourseContext = false;
      
      if (modeForThisMessage === 'course' && courseContext) {
        effectiveContext = 'course';
        shouldSendCourseContext = true;
      } else if (modeForThisMessage === 'prompts') {
        effectiveContext = 'prompts';
        shouldSendCourseContext = false; // NO enviar contexto del curso en modo prompts
      } else if (modeForThisMessage === 'context') {
        effectiveContext = 'general'; // Contexto persistente general de la plataforma
        shouldSendCourseContext = false; // NO enviar contexto del curso en modo contexto
      }

      console.log('[LIA] 📤 Enviando al API:', {
        mode: modeForThisMessage,
        context: effectiveContext,
        isPromptMode: modeForThisMessage === 'prompts',
        sendingCourseContext: shouldSendCourseContext
      });

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: effectiveContext,
          isPromptMode: modeForThisMessage === 'prompts', // ✨ Usar el modo detectado para esta llamada
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          // ✅ OPTIMIZACIÓN: Enviar información completa del usuario para evitar consulta a BD
          userInfo: user ? {
            display_name: user.display_name,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            type_rol: user.type_rol
          } : undefined,
          // Mantener userName para compatibilidad con código existente
          userName: user?.display_name || 
                    (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null) ||
                    user?.first_name || 
                    user?.username || 
                    undefined,
          // ✨ IMPORTANTE: Solo enviar courseContext si estamos en modo course
          courseContext: shouldSendCourseContext ? courseContext : undefined,
          isSystemMessage: isSystemMessage,
          // ✅ ANALYTICS: Enviar conversationId existente si lo hay
          conversationId: conversationIdRef.current || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // ✅ ANALYTICS: Guardar conversationId que viene del backend
      if (data.conversationId && !conversationIdRef.current) {
        conversationIdRef.current = data.conversationId;
        // console.log('[LIA Analytics] Nueva conversación iniciada:', data.conversationId);
      }
      
      // ✨ Si hay un prompt generado en la respuesta, guardarlo
      if (data.generatedPrompt && modeForThisMessage === 'prompts') {
        setGeneratedPrompt(data.generatedPrompt);
      }
      
      const assistantMessage: LiaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu mensaje en este momento.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
      
      const errorResponse: LiaMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al procesar tu mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, user, currentMode, setMessages]);

  // ✨ Función para cambiar de modo manualmente
  const setMode = useCallback((mode: LiaChatMode) => {
    setCurrentMode(mode);
    
    // Agregar mensaje del sistema notificando el cambio
    let modeMessage = '';
    switch (mode) {
      case 'course':
        modeMessage = "Modo cambiado a: Curso 📚\n\nAhora puedo ayudarte específicamente con el contenido de este curso.";
        break;
      case 'prompts':
        modeMessage = "Modo cambiado a: Creación de Prompts 🎯\n\n¿Qué tipo de prompt quieres crear?";
        break;
      case 'context':
        modeMessage = "Modo cambiado a: Contexto Persistente 🧠\n\nAhora mantendr\u00e9 el contexto de nuestra conversación entre lecciones.";
        break;
    }
    
    const systemMessage: LiaMessage = {
      id: `system-mode-${Date.now()}`,
      role: 'assistant',
      content: modeMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  }, []);

  // ✨ Función para limpiar el prompt generado
  const clearPrompt = useCallback(() => {
    setGeneratedPrompt(null);
  }, []);

  const loadConversation = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/lia/conversations/${conversationId}/messages`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error cargando conversación');
      }

      const data = await response.json();
      
      // Formatear mensajes para el estado
      const formattedMessages: LiaMessage[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(formattedMessages);
      
      // Establecer conversationId para continuar la conversación
      conversationIdRef.current = conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    // ✅ ANALYTICS: Cerrar conversación actual antes de limpiar
    if (conversationIdRef.current && user) {
      try {
        await fetch('/api/lia/end-conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversationIdRef.current,
            completed: true
          }),
        });
        // console.log('[LIA Analytics] Conversación cerrada:', conversationIdRef.current);
      } catch (error) {
        // console.error('[LIA Analytics] Error cerrando conversación:', error);
      }
      
      conversationIdRef.current = null;
    }
    
    setMessages(
      initialMessage !== null && initialMessage !== undefined && initialMessage !== ''
        ? [
            {
              id: 'initial',
              role: 'assistant',
              content: initialMessage,
              timestamp: new Date()
            }
          ]
        : []
    );
    setError(null);
  }, [initialMessage, user]);

  // ✅ ANALYTICS: Cerrar conversación cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Cleanup: cerrar conversación al desmontar (si el usuario cierra la página/pestaña)
      if (conversationIdRef.current && user) {
        // Usar sendBeacon para enviar datos antes de que se cierre la página
        const data = JSON.stringify({
          conversationId: conversationIdRef.current,
          completed: false // Marcado como no completado ya que se cerró inesperadamente
        });
        
        // sendBeacon es más confiable que fetch cuando se cierra la página
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/lia/end-conversation', data);
        }
      }
    };
  }, [user]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
    loadConversation,
    currentConversationId: conversationIdRef.current,
    // ✨ Nuevas funcionalidades para modos
    currentMode,
    setMode,
    generatedPrompt,
    clearPrompt
  };
}

