'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { CourseLessonContext, LiaMessage } from '../types/lia.types';

export interface UseLiaChatReturn {
  messages: LiaMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, courseContext?: CourseLessonContext, isSystemMessage?: boolean) => Promise<void>;
  clearHistory: () => void;
}

export function useLiaChat(initialMessage?: string): UseLiaChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LiaMessage[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: initialMessage || '¡Hola! Soy LIA, tu tutora personalizada. Estoy aquí para acompañarte en tu aprendizaje con conceptos fundamentales explicados de forma clara. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ✅ ANALYTICS: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    courseContext?: CourseLessonContext,
    isSystemMessage: boolean = false
  ) => {
    if (!message.trim() || isLoading) return;

    // Si NO es un mensaje del sistema, agregarlo como mensaje de usuario visible
    if (!isSystemMessage) {
      const userMessage: LiaMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: courseContext ? 'course' : 'general',
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userName: user?.username || user?.first_name || undefined,
          courseContext: courseContext || undefined,
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
        console.log('[LIA Analytics] Nueva conversación iniciada:', data.conversationId);
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
  }, [isLoading, messages, user]);

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
        console.log('[LIA Analytics] Conversación cerrada:', conversationIdRef.current);
      } catch (error) {
        console.error('[LIA Analytics] Error cerrando conversación:', error);
      }
      
      conversationIdRef.current = null;
    }
    
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: initialMessage || '¡Hola! Soy LIA, tu tutora personalizada. Estoy aquí para acompañarte en tu aprendizaje con conceptos fundamentales explicados de forma clara. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }
    ]);
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
    clearHistory
  };
}

