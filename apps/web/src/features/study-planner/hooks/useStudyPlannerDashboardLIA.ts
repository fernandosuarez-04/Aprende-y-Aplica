/**
 * useStudyPlannerDashboardLIA Hook
 * 
 * Hook para manejar el chat con LIA en el dashboard del planificador de estudios.
 * Permite gestionar el plan de estudios a través de conversaciones con LIA:
 * - Mover sesiones de estudio
 * - Eliminar bloques de estudio
 * - Ampliar o reducir sesiones
 * - Crear nuevas sesiones
 * - Detectar cambios en el calendario
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

// Tipos para mensajes del chat
export interface DashboardMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actionType?: StudyPlannerAction;
  actionData?: any;
  actionStatus?: 'pending' | 'success' | 'error';
}

// Tipos de acciones que LIA puede ejecutar
export type StudyPlannerAction =
  | 'move_session'
  | 'delete_session'
  | 'resize_session'
  | 'create_session'
  | 'update_session'
  | 'reschedule_week'
  | 'analyze_calendar'
  | 'suggest_adjustments'
  | 'get_plan_summary';

// Datos de una sesión de estudio
export interface StudySession {
  id: string;
  planId: string;
  title: string;
  description?: string;
  courseId?: string;
  lessonId?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'planned' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
  isAiGenerated: boolean;
}

// Plan de estudio activo
export interface ActiveStudyPlan {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  timezone: string;
  sessions: StudySession[];
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
}

// Cambios detectados en el calendario
export interface CalendarChange {
  type: 'new_event' | 'modified_event' | 'deleted_event' | 'conflict';
  eventTitle: string;
  eventTime: string;
  affectedSessions?: string[];
  suggestedAction?: string;
}

// Estado del hook
export interface StudyPlannerDashboardState {
  messages: DashboardMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  activePlan: ActiveStudyPlan | null;
  calendarChanges: CalendarChange[];
  lastCalendarCheck: Date | null;
  hasNewCalendarChanges: boolean;
}

// Acciones disponibles
export interface StudyPlannerDashboardActions {
  sendMessage: (message: string) => Promise<void>;
  executeAction: (action: StudyPlannerAction, data: any) => Promise<void>;
  checkCalendarChanges: () => Promise<void>;
  loadActivePlan: () => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  dismissCalendarChanges: () => void;
}

const initialState: StudyPlannerDashboardState = {
  messages: [],
  isLoading: true,
  isSending: false,
  error: null,
  activePlan: null,
  calendarChanges: [],
  lastCalendarCheck: null,
  hasNewCalendarChanges: false,
};

// Constante para el check de calendario (24 horas en ms)
const CALENDAR_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

/**
 * Hook para manejar la interacción con LIA en el dashboard del planificador
 */
export function useStudyPlannerDashboardLIA(): StudyPlannerDashboardState & StudyPlannerDashboardActions {
  const { user } = useAuth();
  const [state, setState] = useState<StudyPlannerDashboardState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCheckedCalendarRef = useRef(false);

  // Cargar plan activo al iniciar
  useEffect(() => {
    if (user) {
      loadActivePlan();
    }
  }, [user]);

  // Verificar cambios en calendario al entrar (una vez al día)
  useEffect(() => {
    if (user && !hasCheckedCalendarRef.current) {
      checkCalendarChangesIfNeeded();
      hasCheckedCalendarRef.current = true;
    }
  }, [user]);

  // Cargar plan de estudio activo
  const loadActivePlan = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/study-planner/dashboard/plan');
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // No hay plan activo - mostrar mensaje invitando a crear uno
          setState(prev => ({
            ...prev,
            activePlan: null,
            isLoading: false,
            messages: [{
              id: `no-plan-${Date.now()}`,
              role: 'assistant',
              content: `¡Hola! 👋 Soy LIA, tu asistente de estudios.

Aún no tienes un plan de estudios activo. ¿Te gustaría crear uno?

Puedo ayudarte a organizar tu tiempo de estudio de manera eficiente según tu disponibilidad y objetivos.

[Ir a crear un plan](/study-planner/create)`,
              timestamp: new Date(),
            }],
          }));
          return;
        }
        // Otro error del servidor
        console.error('Error del servidor:', data.error || response.statusText);
        throw new Error(data.error || 'Error al cargar el plan de estudios');
      }

      if (data.success && data.data) {
        const plan = data.data;
        setState(prev => ({
          ...prev,
          activePlan: plan,
          isLoading: false,
          // Agregar mensaje de bienvenida directamente aquí
          messages: prev.messages.length === 0 ? [{
            id: `welcome-${Date.now()}`,
            role: 'assistant' as const,
            content: `¡Hola! 👋 Soy LIA, tu asistente para gestionar tu plan de estudios "${plan.name}".

Puedo ayudarte a:
• 📅 **Mover sesiones** a horarios más convenientes
• ⏱️ **Ajustar la duración** de tus bloques de estudio
• ❌ **Eliminar sesiones** que ya no necesites
• ➕ **Crear nuevas sesiones** de estudio
• 🔄 **Reorganizar tu semana** según tu disponibilidad

Solo dime qué necesitas cambiar y yo me encargo. Por ejemplo:
- "Mueve mi sesión del martes a las 10am"
- "Elimina la sesión de mañana"
- "Quiero estudiar 30 minutos más el viernes"

¿En qué te puedo ayudar hoy?`,
            timestamp: new Date(),
          }] : prev.messages,
        }));
      } else {
        // Respuesta sin datos válidos
        setState(prev => ({
          ...prev,
          activePlan: null,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Error cargando plan activo:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al cargar tu plan de estudios',
        isLoading: false,
      }));
    }
  }, [user]);

  // Verificar cambios en calendario si es necesario
  const checkCalendarChangesIfNeeded = useCallback(async () => {
    if (!user) return;

    try {
      // Obtener última fecha de verificación del localStorage
      const lastCheckStr = localStorage.getItem(`calendar_check_${user.id}`);
      const lastCheck = lastCheckStr ? new Date(lastCheckStr) : null;
      const now = new Date();

      // Si ya se verificó hoy, no verificar de nuevo
      if (lastCheck && (now.getTime() - lastCheck.getTime()) < CALENDAR_CHECK_INTERVAL) {
        setState(prev => ({ ...prev, lastCalendarCheck: lastCheck }));
        return;
      }

      // Verificar cambios
      await checkCalendarChanges();
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [user]);

  // Verificar cambios en el calendario
  const checkCalendarChanges = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/study-planner/dashboard/sync-calendar/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Error al verificar calendario');
      }

      const data = await response.json();
      const now = new Date();

      // Guardar fecha de verificación
      localStorage.setItem(`calendar_check_${user.id}`, now.toISOString());

      if (data.success && data.data?.changes?.length > 0) {
        setState(prev => ({
          ...prev,
          calendarChanges: data.data.changes,
          lastCalendarCheck: now,
          hasNewCalendarChanges: true,
        }));

        // Agregar mensaje proactivo de LIA sobre los cambios
        const changeMessage: DashboardMessage = {
          id: `calendar-${Date.now()}`,
          role: 'assistant',
          content: formatCalendarChangesMessage(data.data.changes),
          timestamp: now,
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, changeMessage],
        }));
      } else {
        setState(prev => ({
          ...prev,
          lastCalendarCheck: now,
          hasNewCalendarChanges: false,
        }));
      }
    } catch (error) {
      console.error('Error verificando calendario:', error);
    }
  }, [user]);

  // Formatear mensaje de cambios en calendario
  const formatCalendarChangesMessage = (changes: CalendarChange[]): string => {
    const conflicts = changes.filter(c => c.type === 'conflict');
    const newEvents = changes.filter(c => c.type === 'new_event');

    let message = '🔔 **He detectado cambios en tu calendario:**\n\n';

    if (conflicts.length > 0) {
      message += '⚠️ **Conflictos encontrados:**\n';
      conflicts.forEach(c => {
        message += `• ${c.eventTitle} (${c.eventTime}) - ${c.suggestedAction}\n`;
      });
      message += '\n';
    }

    if (newEvents.length > 0) {
      message += '📅 **Nuevos eventos:**\n';
      newEvents.forEach(c => {
        message += `• ${c.eventTitle} (${c.eventTime})\n`;
      });
      message += '\n';
    }

    message += '¿Quieres que ajuste tu plan de estudios para acomodar estos cambios?';

    return message;
  };

  // Enviar mensaje a LIA
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || state.isSending) return;

    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Agregar mensaje del usuario
    const userMessage: DashboardMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isSending: true,
      error: null,
    }));

    try {
      // Preparar historial de conversación
      const conversationHistory = state.messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/study-planner/dashboard/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory,
          activePlanId: state.activePlan?.id,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Error al comunicarse con LIA');
      }

      const data = await response.json();

      // Agregar respuesta de LIA
      const assistantMessage: DashboardMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        actionType: data.action?.type,
        actionData: data.action?.data,
        actionStatus: data.action?.status,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isSending: false,
      }));

      // Si hay una acción ejecutada, actualizar el plan
      if (data.action?.status === 'success') {
        await loadActivePlan();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;

      console.error('Error enviando mensaje:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al comunicarse con LIA. Por favor, intenta de nuevo.',
        isSending: false,
      }));
    }
  }, [state.messages, state.activePlan, state.isSending, loadActivePlan]);

  // Ejecutar una acción específica
  const executeAction = useCallback(async (action: StudyPlannerAction, data: any) => {
    if (!user || !state.activePlan) return;

    setState(prev => ({ ...prev, isSending: true }));

    try {
      const response = await fetch('/api/study-planner/dashboard/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          data,
          planId: state.activePlan.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar acción');
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar plan después de la acción
        await loadActivePlan();

        // Agregar mensaje de confirmación
        const confirmMessage: DashboardMessage = {
          id: `action-${Date.now()}`,
          role: 'assistant',
          content: result.message || '✅ Acción completada correctamente.',
          timestamp: new Date(),
          actionType: action,
          actionStatus: 'success',
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, confirmMessage],
          isSending: false,
        }));
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error ejecutando acción:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error al ejecutar la acción',
        isSending: false,
      }));
    }
  }, [user, state.activePlan, loadActivePlan]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [] }));
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Descartar cambios de calendario
  const dismissCalendarChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasNewCalendarChanges: false,
      calendarChanges: [],
    }));
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado
    ...state,

    // Acciones
    sendMessage,
    executeAction,
    checkCalendarChanges,
    loadActivePlan,
    clearMessages,
    clearError,
    dismissCalendarChanges,
  };
}

export default useStudyPlannerDashboardLIA;
