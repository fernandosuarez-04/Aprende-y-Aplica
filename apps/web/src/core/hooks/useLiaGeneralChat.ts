'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { LiaMessage } from '../types/lia.types';
import { useLanguage } from '../providers/I18nProvider';
import { sessionRecorder } from '@/lib/rrweb/session-recorder';

export interface UseLiaGeneralChatReturn {
  messages: LiaMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, isSystemMessage?: boolean, pageContext?: any) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
}

export function useLiaGeneralChat(initialMessage?: string | null): UseLiaGeneralChatReturn {
  const { user } = useAuth();
  const { language } = useLanguage();
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
  
  // Analytics: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    isSystemMessage: boolean = false,
    pageContext?: any
  ) => {
    if (!message.trim() || isLoading) return;

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
      // Detectar si el mensaje sugiere un reporte de bug con más palabras clave
      const bugKeywords = /error|bug|falla|problema|no funciona|no carga|rompi|broken|crash|colgó|lento|cuelga|no responde|pantalla en blanco|500|404|timeout|se cayó/i;
      const isBugReport = bugKeywords.test(message.toLowerCase());
      
      // Preparar session data solo si es probable reporte de bug
      let sessionSnapshot: string | undefined;
      let enrichedMetadata: any = undefined;
      let recordingStatus: 'active' | 'inactive' | 'restarted' | 'unavailable' | 'error' = 'unavailable';
      
      if (isBugReport && sessionRecorder) {
        try {
          // Log detallado para debugging
          console.log('[LIA Chat] 🔍 Verificando estado del recorder:', {
            exists: !!sessionRecorder,
            hasIsRrwebAvailable: typeof sessionRecorder.isRrwebAvailable === 'function',
            hasIsActive: typeof sessionRecorder.isActive === 'function',
            hasIsPaused: typeof sessionRecorder.isPaused === 'function',
            hasCaptureSnapshot: typeof sessionRecorder.captureSnapshot === 'function',
          });
          
          // Verificar que los métodos existen antes de llamarlos
          const hasRequiredMethods = 
            typeof sessionRecorder.isRrwebAvailable === 'function' &&
            typeof sessionRecorder.isActive === 'function' &&
            typeof sessionRecorder.captureSnapshot === 'function';
          
          if (!hasRequiredMethods) {
            console.warn('[LIA Chat] ⚠️ sessionRecorder no tiene los métodos requeridos');
            recordingStatus = 'error';
          }
          // Verificar si rrweb está disponible
          else if (!sessionRecorder.isRrwebAvailable()) {
            console.warn('[LIA Chat] ⚠️ rrweb no está disponible en este navegador');
            recordingStatus = 'unavailable';
          } 
          // Verificar si la grabación está activa
          else if (!sessionRecorder.isActive()) {
            console.warn('[LIA Chat] ⚠️ La grabación no está activa, intentando reiniciar...');
            
            // Intentar reiniciar la grabación
            try {
              await sessionRecorder.startRecording(180000); // 3 minutos
              console.log('[LIA Chat] ✅ Grabación reiniciada exitosamente');
              recordingStatus = 'restarted';
              
              // Esperar un momento para capturar al menos el estado inicial
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (restartError) {
              console.error('[LIA Chat] ❌ No se pudo reiniciar la grabación:', restartError);
              recordingStatus = 'error';
            }
          } else if (typeof sessionRecorder.isPaused === 'function' && sessionRecorder.isPaused()) {
            // Si está pausada por inactividad, reanudarla
            console.log('[LIA Chat] ▶️ Reanudando grabación pausada...');
            if (typeof sessionRecorder.resume === 'function') {
              sessionRecorder.resume();
            }
            recordingStatus = 'active';
          } else {
            recordingStatus = 'active';
          }
          
          // Intentar capturar snapshot si la grabación está disponible
          const snapshot = sessionRecorder.captureSnapshot();
          
          if (snapshot && snapshot.events.length > 0) {
            // Usar compresión para reducir tamaño 60-80%
            sessionSnapshot = await sessionRecorder.exportSessionCompressed(snapshot);
            // Incluir metadata enriquecida del entorno
            enrichedMetadata = sessionRecorder.getEnrichedMetadata(snapshot);
            console.log(`[LIA Chat] 📹 Capturado snapshot para reporte de bug (${snapshot.events.length} eventos)`);
          } else {
            console.warn('[LIA Chat] ⚠️ No hay eventos en el snapshot');
            // Generar metadata mínima sin grabación
            enrichedMetadata = {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              currentUrl: window.location.href,
              sessionDuration: 0,
              errors: [],
              errorSummary: { totalErrors: 0, byType: {}, recentErrors: [] },
              contextMarkers: [],
              sessionSummary: { totalMarkers: 0, pageVisits: [], modalsOpened: [], actionsCount: 0, errorsCount: 0, timeline: [] },
              recordingInfo: {
                eventCount: 0,
                size: '0 B',
                compressed: false,
                status: recordingStatus
              }
            };
          }
        } catch (err) {
          console.warn('[LIA Chat] ⚠️ Error capturando snapshot:', err);
          recordingStatus = 'error';
          
          // Generar metadata mínima en caso de error
          enrichedMetadata = {
            viewport: typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : { width: 0, height: 0 },
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
            sessionDuration: 0,
            errors: [],
            errorSummary: { totalErrors: 0, byType: {}, recentErrors: [] },
            recordingInfo: {
              eventCount: 0,
              size: '0 B',
              compressed: false,
              status: recordingStatus,
              error: err instanceof Error ? err.message : 'Unknown error'
            }
          };
        }
      }
      
      // Usar la nueva API de LIA (similar a ARIA en IRIS)
      const response = await fetch('/api/lia/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: message }
          ],
          context: {
            userName: user?.first_name || user?.nombre,
            userRole: user?.type_rol || user?.cargo_rol, // Priorizar type_rol (cargo real)
            userId: user?.id,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
            ...(pageContext || {}),
          },
          // Datos de grabación de sesión (comprimido)
          sessionSnapshot,
          // Metadata enriquecida del entorno
          enrichedMetadata,
          // Indicar si está probablemente reportando un bug
          isBugReport,
          // Estado de la grabación para el servidor
          recordingStatus: isBugReport ? recordingStatus : undefined,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en la comunicación con LIA');
      }

      // Procesar streaming de respuesta
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      // Crear mensaje vacío para ir llenando
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  // Actualizar mensaje en tiempo real
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === assistantId 
                        ? { ...m, content: assistantContent }
                        : m
                    )
                  );
                }
              } catch {
                // Ignorar errores de parsing
              }
            }
          }
        }
      }
      
      // Actualizar ID de conversación si es nuevo
      conversationIdRef.current = assistantId;

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
  }, [isLoading, messages, user, language]);

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
      
      const formattedMessages: LiaMessage[] = (data.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }));

      setMessages(formattedMessages);
      conversationIdRef.current = conversationId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Error desconocido');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
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
      } catch (error) {
        console.error('[LIA Analytics] Error cerrando conversación:', error);
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

  useEffect(() => {
    return () => {
      if (conversationIdRef.current && user) {
        const data = JSON.stringify({
          conversationId: conversationIdRef.current,
          completed: false
        });
        
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
  };
}
