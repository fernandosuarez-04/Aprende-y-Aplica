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
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
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
        // console.log('[LIA Analytics] Nueva conversación iniciada:', data.conversationId);
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
    currentConversationId: conversationIdRef.current
  };
}

