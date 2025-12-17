'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import type { CourseLessonContext, LiaMessage, GeneratedNanoBananaData } from '../types/lia.types';
import { IntentDetectionService } from '../services/intent-detection.service';
import { useLanguage } from '../providers/I18nProvider';

// Tipos de modo para el chat
export type LiaChatMode = 'course' | 'prompts' | 'context' | 'nanobana';

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

// Re-exportar tipo de NanoBanana desde lia.types
export type { GeneratedNanoBananaData as GeneratedNanoBanana } from '../types/lia.types';

export interface UseLiaChatReturn {
  messages: LiaMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (message: string, courseContext?: CourseLessonContext, workshopContext?: CourseLessonContext, isSystemMessage?: boolean) => Promise<void>;
  clearHistory: () => void;
  loadConversation: (conversationId: string) => Promise<void>;
  currentConversationId: string | null;
  // ✨ Nuevas funcionalidades para modos
  currentMode: LiaChatMode;
  setMode: (mode: LiaChatMode) => void;
  generatedPrompt: GeneratedPrompt | null;
  clearPrompt: () => void;
  // 🎨 Funcionalidades para NanoBanana
  generatedNanoBanana: GeneratedNanoBanana | null;
  clearNanoBanana: () => void;
  isNanoBananaMode: boolean;
}

export function useLiaChat(initialMessage?: string | null): UseLiaChatReturn {
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
  
  // ✅ ANALYTICS: Mantener conversationId en referencia para persistencia
  const conversationIdRef = useRef<string | null>(null);
  
  // ✅ ACTIVIDADES: Tracking de tiempo de inicio de actividad
  const activityStartTimeRef = useRef<number | null>(null);

  // ✨ NUEVOS ESTADOS: Modos y prompts generados
  const [currentMode, setCurrentMode] = useState<LiaChatMode>('course');
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  
  // 🎨 ESTADOS: NanoBanana
  const [generatedNanoBanana, setGeneratedNanoBanana] = useState<GeneratedNanoBanana | null>(null);

  // ✅ ACTIVIDADES: Función para registrar actividad completada
  const registerCompletedActivity = useCallback(async (
    activityType: string,
    generatedOutput?: any
  ) => {
    if (!user) return;
    
    try {
      const timeSpentSeconds = activityStartTimeRef.current 
        ? Math.floor((Date.now() - activityStartTimeRef.current) / 1000)
        : 0;
      
      await fetch('/api/lia/complete-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationIdRef.current,
          activityType,
          generatedOutput,
          timeSpentSeconds
        }),
      });

      activityStartTimeRef.current = null;
    } catch (error) {
      console.error('[LIA Analytics] Error registrando actividad:', error);
    }
  }, [user]);

  const sendMessage = useCallback(async (
    message: string,
    courseContext?: CourseLessonContext,
    workshopContext?: CourseLessonContext, // ✅ Nuevo: contexto para talleres
    isSystemMessage: boolean = false
  ) => {
    if (!message.trim() || isLoading) return;

    // Variable para determinar el modo a usar en esta llamada
    let modeForThisMessage = currentMode;
    let shouldNotifyModeChange = false;
    let modeChangeMessage = '';
    // 🎯 Solo esperar sin responder cuando se ACTIVA un modo especial (NanoBanana/Prompts)
    // Si se cambia A curso/contexto CON una pregunta, debe responder
    let shouldWaitForNextMessage = false;

    // ✅ Si es un mensaje del sistema con contexto, forzar el modo correcto
    // Esto permite que los mensajes automáticos de ayuda proactiva usen el contexto apropiado
    if (isSystemMessage) {
      if (workshopContext && workshopContext.contextType === 'workshop') {
        modeForThisMessage = 'course'; // Talleres usan el mismo modo que cursos
      } else if (courseContext) {
        modeForThisMessage = 'course';
      }
    }

    // ✨ DETECCIÓN BIDIRECCIONAL DE INTENCIONES (solo si no es mensaje del sistema)
    if (!isSystemMessage) {
      try {

        const intentResult = await IntentDetectionService.detectIntent(message.trim());
        console.log('[LIA] 📊 Resultado de detección:', {
          intent: intentResult.intent,
          confidence: `${(intentResult.confidence * 100).toFixed(1)}%`,
          threshold: '70%'
        });
        
        // CASO 0: Detectar intención de NanoBanana (generación visual/imágenes)
        const nanoBananaPatterns = [
          // Menciones directas de NanoBanana
          /\b(nanobana|nanobanana|nano\s*banana)\b/i,
          
          // JSON para diseño/visual
          /\b(json|esquema|schema)\b.*\b(visual|diseño|imagen|ui|ux)\b/i,
          /\b(generar?|crear?|dame)\b.*\b(json)\b.*\b(para|de)\b.*\b(imagen|diseño|visual)\b/i,
          /\b(wireframe|mockup|render)\b.*\b(json)\b/i,
          /\b(convertir?|traducir?)\b.*\b(json)\b/i,
          
          // 🎨 NUEVOS: Creación de imágenes/diseños visuales
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(imagen|imágenes|visual|visualización)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(wireframe|mockup|prototipo|boceto)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(ui|ux|interfaz|pantalla|app|aplicación)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(diagrama|flowchart|flujo|arquitectura)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(logo|banner|poster|cartel)\b/i,
          /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(landing|página|web|dashboard)\b/i,
          
          // Necesito/quiero diseño visual
          /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup)\b/i,
          /\b(diseña(r|me)?|dibuja(r|me)?)\b.*\b(una?\s*)?(app|aplicación|pantalla|interfaz|página)\b/i,
          
          // Fotografía y marketing visual
          /\b(foto(grafía)?|imagen)\b.*\b(producto|marketing|comercial|publicitaria?)\b/i,
          /\b(render(izar)?|visualiza[r]?)\b.*\b(producto|escena|3d)\b/i
        ];
        const isNanoBananaIntent = nanoBananaPatterns.some(p => p.test(message));
        
        if (isNanoBananaIntent && currentMode !== 'nanobana') {

          modeForThisMessage = 'nanobana';
          shouldNotifyModeChange = true;
          shouldWaitForNextMessage = true; // Esperar descripción de lo que quiere crear
          modeChangeMessage = "🎨 He detectado que quieres generar un JSON para NanoBanana Pro. ¡Activo el modo de generación visual!\n\n¿Qué tipo de imagen o diseño quieres crear?";
          setCurrentMode('nanobana');
        }
        // CASO 1: Si NO estamos en modo prompts y detectamos intención de crear prompts
        else if (currentMode !== 'prompts' && currentMode !== 'nanobana' && intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {

          modeForThisMessage = 'prompts';
          shouldNotifyModeChange = true;
          shouldWaitForNextMessage = true; // Esperar descripción de qué prompt quiere
          modeChangeMessage = "✨ He detectado que quieres crear un prompt. He activado el Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?";
          setCurrentMode('prompts');
        }
        // CASO 1.5: Si ESTAMOS en modo nanobana, detectar intenciones para cambiar a CUALQUIER otro modo
        else if (currentMode === 'nanobana') {
          const messageLower = message.toLowerCase().trim();
          
          // 🎯 Detectar si quiere cambiar a MODO PROMPTS
          if (intentResult.intent === 'create_prompt' && intentResult.confidence >= 0.7) {

            modeForThisMessage = 'prompts';
            shouldNotifyModeChange = true;
            modeChangeMessage = "✨ He cambiado al Modo Prompts 🎯\n\n¿Qué tipo de prompt necesitas crear?";
            setCurrentMode('prompts');
          }
          // 🎯 Detectar si quiere cambiar a MODO CURSO (preguntas sobre el contenido del curso/lección)
          else {
            // Palabras clave que indican pregunta sobre el curso
            const courseKeywords = [
              'curso', 'lección', 'leccion', 'módulo', 'modulo', 'módulos', 'modulos',
              'tema', 'contenido', 'video', 'transcripción', 'transcripcion', 'resumen',
              'actividad', 'actividades', 'ejercicio', 'ejercicios', 'tarea', 'tareas',
              'cuántos', 'cuantos', 'cuántas', 'cuantas', 'qué tiene', 'que tiene',
              'de qué trata', 'de que trata', 'explícame', 'explicame', 'explica',
              'aprendo', 'aprender', 'enseña', 'enseñar', 'material', 'materiales',
              'duración', 'duracion', 'tiempo', 'largo', 'corto',
              'siguiente', 'anterior', 'próxima', 'proxima', 'próximo', 'proximo'
            ];
            
            // Patrones de preguntas sobre el curso
            const courseQuestionPatterns = [
              /\bcuántos?\s+(módulos?|lecciones?|temas?|videos?|actividades?)\b/i,
              /\bcuantos?\s+(modulos?|lecciones?|temas?|videos?|actividades?)\b/i,
              /\bde\s+qué\s+(trata|va|habla)\b/i,
              /\bde\s+que\s+(trata|va|habla)\b/i,
              /\bqué\s+(es|son|significa|aprendo|enseña)\b/i,
              /\bque\s+(es|son|significa|aprendo|ensena)\b/i,
              /\b(este|esta|el|la)\s+(curso|lección|módulo|tema|video)\b/i,
              /\b(explicame|explícame|resume|resumen)\b/i
            ];
            
            const isCourseQuestion = courseKeywords.some(keyword => messageLower.includes(keyword)) ||
                                     courseQuestionPatterns.some(p => p.test(messageLower));
            
            if (isCourseQuestion && intentResult.intent !== 'nanobana') {
              modeForThisMessage = 'course';
              shouldNotifyModeChange = true;
              modeChangeMessage = "📚 He cambiado al Modo Curso para ayudarte con el contenido.";
              setCurrentMode('course');
            }
            // 🎯 Detectar navegación o preguntas sobre la plataforma → MODO CONTEXTO
            else if (intentResult.intent === 'navigate' || intentResult.intent === 'general') {
              const platformKeywords = [
                'comunidad', 'comunidades', 'noticias', 'noticia', 'dashboard', 'perfil',
                'configuración', 'ajustes', 'cuenta', 'talleres', 'taller', 'workshops',
                'directorio', 'prompts', 'apps', 'aplicaciones', 'plataforma', 'sitio',
                'web', 'página', 'sección', 'menú', 'navegación', 'link', 'enlace'
              ];
              const explicitExitPatterns = [
                /\b(salir|salte|terminar|cancelar)\b.*\b(nanobana|json|modo)\b/i,
                /\b(no\s+quiero|ya\s+no)\b.*\b(json|nanobana)\b/i,
                /\b(ll[eé]vame|llevame|llévame)\b/i,
                /\b(ir\s+a|navegar\s+a|abrir)\b/i,
                /\bdame\s+(el\s+)?(link|enlace)\b/i,
                /\bquiero\s+(ir|ver|acceder)\s+a\b/i
              ];
              
              const isPlatformQuestion = platformKeywords.some(keyword => messageLower.includes(keyword));
              const isExplicitExit = explicitExitPatterns.some(p => p.test(messageLower));
              
              if (isExplicitExit || isPlatformQuestion || intentResult.intent === 'navigate') {

                modeForThisMessage = 'context';
                shouldNotifyModeChange = true;
                modeChangeMessage = intentResult.intent === 'navigate' 
                  ? "🧠 He cambiado al Modo Contexto para ayudarte con la navegación."
                  : "🧠 He cambiado al Modo Contexto para responder tu pregunta.";
                setCurrentMode('context');
              } else {

              }
            } else {

            }
          }
        }
        // CASO 2: Si ESTAMOS en modo prompts, detectar intenciones para cambiar a otros modos
        else if (currentMode === 'prompts' && intentResult.intent !== 'create_prompt') {
          const messageLower = message.toLowerCase().trim();
          
          // 🎯 Detectar si quiere cambiar a MODO NANOBANA (generación visual/imágenes)
          const nanoBananaKeywords = [
            /\bnanobana(na)?\b/i,
            /\b(wireframe|mockup|ui|interfaz|diagrama)\b.*\b(json|generar|crear|diseñar)\b/i,
            /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(imagen|visual|wireframe|mockup|ui|interfaz|diagrama|app|pantalla)\b/i,
            /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup)\b/i,
            /\b(diseña(r|me)?|dibuja(r|me)?)\b.*\b(una?\s*)?(app|aplicación|pantalla|interfaz)\b/i,
            /\b(foto|imagen)\b.*\b(producto|marketing)\b/i
          ];
          const wantsNanoBanana = nanoBananaKeywords.some(p => p.test(messageLower));
          
          // Solo salir del modo prompts si es una petición EXPLÍCITA de navegación o salida
          const explicitExitPatterns = [
            /\b(ll[eé]vame|llevame|llévame)\b/i,
            /\b(ir\s+a|navegar\s+a|abrir)\b/i,
            /\b(mu[eé]strame|muestrame|muéstrame)\b.*\b(página|pagina|sección|seccion)\b/i,
            /\bdame\s+(el\s+)?(link|enlace)\b/i,
            /\bquiero\s+(ir|ver|acceder)\s+a\b/i,
            /\b(salir|salte|terminar|cancelar)\b.*\b(prompt|modo)\b/i,
            /\b(no\s+quiero|ya\s+no)\b.*\bprompt\b/i
          ];
          
          const isExplicitExit = explicitExitPatterns.some(p => p.test(messageLower));

          if (wantsNanoBanana) {

            modeForThisMessage = 'nanobana';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🎨 He cambiado al Modo NanoBanana para generación visual con JSON.\n\nDescríbeme lo que necesitas crear.";
            setCurrentMode('nanobana');
          } else if (intentResult.intent === 'navigate') {
            modeForThisMessage = 'context';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🧠 He cambiado al Modo Contexto para ayudarte con la navegación.";
            setCurrentMode('context');
          } else if (isExplicitExit) {

            modeForThisMessage = 'context';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🧠 He cambiado al Modo Contexto para ayudarte.";
            setCurrentMode('context');
          } else {
            // MANTENER el modo prompts - cualquier otra cosa se considera parte de la conversación
          }
        }
        // CASO 3: Si ESTAMOS en modo curso, detectar intenciones para cambiar a otros modos
        else if (currentMode === 'course') {
          const messageLower = message.toLowerCase().trim();
          
          // 🎯 Detectar si quiere NanoBanana desde el modo curso (generación visual/imágenes)
          const nanoBananaKeywords = [
            /\bnanobana(na)?\b/i,
            /\b(wireframe|mockup|ui|interfaz|diagrama)\b.*\b(json|generar|crear|diseñar)\b/i,
            /\b(crear?|genera[r]?|diseña[r]?|haz(me)?)\b.*\b(imagen|visual|wireframe|mockup|ui|interfaz|diagrama|app|pantalla)\b/i,
            /\b(necesito|quiero|dame)\b.*\b(diseño|imagen|visual|interfaz|wireframe|mockup)\b/i,
            /\b(diseña(r|me)?|dibuja(r|me)?)\b.*\b(una?\s*)?(app|aplicación|pantalla|interfaz)\b/i,
            /\b(foto|imagen)\b.*\b(producto|marketing)\b/i
          ];
          const wantsNanoBanana = nanoBananaKeywords.some(p => p.test(messageLower));
          
          if (wantsNanoBanana) {

            modeForThisMessage = 'nanobana';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🎨 He cambiado al Modo NanoBanana para generación visual con JSON.\n\nDescríbeme lo que necesitas crear.";
            setCurrentMode('nanobana');
          }
          // 🎯 Detectar navegación
          else if (intentResult.intent === 'navigate') {

            modeForThisMessage = 'context';
            shouldNotifyModeChange = true;
            modeChangeMessage = "🧠 He cambiado al Modo Contexto para ayudarte con la navegación.";
            setCurrentMode('context');
          }
          // 🎯 Detectar preguntas generales sobre la plataforma
          else if (intentResult.intent === 'general') {
            const platformKeywords = [
              'comunidad', 'comunidades', 'noticias', 'noticia', 'dashboard', 'perfil',
              'configuración', 'ajustes', 'cuenta', 'talleres', 'taller', 'workshops',
              'directorio', 'prompts', 'apps', 'aplicaciones', 'plataforma', 'sitio',
              'web', 'página', 'sección', 'menú', 'navegación', 'link', 'enlace',
              'acceder', 'ir a', 'llévame', 'muéstrame', 'dónde está', 'cómo llego'
            ];
            const isPlatformQuestion = platformKeywords.some(keyword => messageLower.includes(keyword));
            
            if (isPlatformQuestion) {

              modeForThisMessage = 'context';
              shouldNotifyModeChange = true;
              modeChangeMessage = "🧠 He cambiado al Modo Contexto para responder tu pregunta sobre la plataforma.";
              setCurrentMode('context');
            }
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
        const systemMessage: LiaMessage = {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: modeChangeMessage,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, systemMessage]);
        
        // 🎯 IMPORTANTE: Solo esperar sin responder si se ACTIVÓ un modo especial (NanoBanana/Prompts)
        // Si se cambió a curso/contexto CON una pregunta, debe continuar y responder
        if (shouldWaitForNextMessage) {

          // ✅ ACTIVIDADES: Iniciar tracking de tiempo
          activityStartTimeRef.current = Date.now();
          setIsLoading(false);
          return;
        } else {

        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // ✨ Determinar el contexto según el modo (usar el modo detectado en esta llamada)
      let effectiveContext = 'general';
      let shouldSendCourseContext = false;
      let shouldSendWorkshopContext = false;
      
      if (modeForThisMessage === 'course' && courseContext) {
        effectiveContext = 'course';
        shouldSendCourseContext = true;
      } else if (workshopContext && workshopContext.contextType === 'workshop') {
        // ✅ Si hay workshopContext, usar contexto de workshops
        effectiveContext = 'workshops';
        shouldSendWorkshopContext = true;
      } else if (modeForThisMessage === 'prompts') {
        effectiveContext = 'prompts';
        shouldSendCourseContext = false; // NO enviar contexto del curso en modo prompts
      } else if (modeForThisMessage === 'nanobana') {
        effectiveContext = 'nanobana';
        shouldSendCourseContext = false; // NO enviar contexto del curso en modo nanobana
      } else if (modeForThisMessage === 'context') {
        effectiveContext = 'general'; // Contexto persistente general de la plataforma
        shouldSendCourseContext = false; // NO enviar contexto del curso en modo contexto
      }

      // 🎨 Si estamos en modo NanoBanana, usar API diferente
      if (modeForThisMessage === 'nanobana') {

        const nanoBananaResponse = await fetch('/api/ai-directory/generate-nanobana', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            conversationHistory: messages.map(m => ({
              sender: m.role === 'assistant' ? 'ai' : 'user',
              text: m.content
            }))
          }),
        });

        if (!nanoBananaResponse.ok) {
          const errorData = await nanoBananaResponse.json().catch(() => ({ error: 'Error desconocido' }));
          throw new Error(errorData.error || `Error ${nanoBananaResponse.status}`);
        }

        const nanoBananaData = await nanoBananaResponse.json();

        // Guardar el schema generado
        if (nanoBananaData.generatedSchema) {
          setGeneratedNanoBanana({
            schema: nanoBananaData.generatedSchema,
            jsonString: nanoBananaData.jsonString,
            domain: nanoBananaData.domain,
            outputFormat: nanoBananaData.outputFormat
          });
          
          // ✅ ACTIVIDADES: Registrar NanoBanana completado
          registerCompletedActivity('nanobana_generation', {
            domain: nanoBananaData.domain,
            outputFormat: nanoBananaData.outputFormat,
            hasSchema: true
          });
        }

        const assistantMessage: LiaMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: nanoBananaData.response || 'He generado el JSON para NanoBanana Pro.',
          timestamp: new Date(),
          // Guardar referencia al NanoBanana generado en el mensaje
          generatedNanoBanana: nanoBananaData.generatedSchema ? {
            schema: nanoBananaData.generatedSchema,
            jsonString: nanoBananaData.jsonString,
            domain: nanoBananaData.domain,
            outputFormat: nanoBananaData.outputFormat
          } : undefined
        };

        setMessages(prev => [...prev, assistantMessage]);
        return; // Terminar aquí para modo NanoBanana
      }

      // Llamada normal al API de chat
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          context: effectiveContext,
          language: language, // ✅ Enviar idioma actual al API
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
          // ✅ IMPORTANTE: Solo enviar workshopContext si estamos en contexto de workshops
          workshopContext: shouldSendWorkshopContext ? workshopContext : undefined,
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
        
        // ✅ ACTIVIDADES: Registrar prompt completado
        registerCompletedActivity('prompt_generation', {
          title: data.generatedPrompt.title,
          difficulty: data.generatedPrompt.difficulty_level,
          tags: data.generatedPrompt.tags
        });
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
    
    // No agregar mensaje automático del sistema al cambiar de modo
    // La información del modo se muestra en el fondo del chat cuando no hay mensajes
  }, []);

  // ✨ Función para limpiar el prompt generado
  const clearPrompt = useCallback(() => {
    setGeneratedPrompt(null);
  }, []);

  // 🎨 Función para limpiar el NanoBanana generado
  const clearNanoBanana = useCallback(() => {
    setGeneratedNanoBanana(null);
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

  // ✅ ACTIVIDADES: Registrar sesión de curso cuando hay mensajes suficientes
  const messagesCountRef = useRef(0);
  useEffect(() => {
    // Contar solo mensajes del usuario
    const userMessagesCount = messages.filter(m => m.role === 'user').length;
    
    // Si el usuario ha enviado al menos 3 mensajes en modo curso, registrar como sesión de aprendizaje
    if (currentMode === 'course' && userMessagesCount >= 3 && userMessagesCount > messagesCountRef.current) {
      // Solo registrar cada 3 mensajes adicionales
      if (userMessagesCount % 3 === 0) {
        registerCompletedActivity('course_learning_session', {
          messagesCount: userMessagesCount,
          mode: currentMode
        });
      }
    }
    
    messagesCountRef.current = userMessagesCount;
  }, [messages, currentMode, registerCompletedActivity]);

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
    clearPrompt,
    // 🎨 Funcionalidades para NanoBanana
    generatedNanoBanana,
    clearNanoBanana,
    isNanoBananaMode: currentMode === 'nanobana'
  };
}

