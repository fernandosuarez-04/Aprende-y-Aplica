'use client';

/**
 * LIAContext.tsx
 * 
 * Contexto centralizado para LIA (Learning Intelligence Assistant).
 * Sigue el patrón Bridge de IRIS para obtener datos directamente de la BD.
 * 
 * Este contexto:
 * 1. Carga las lecciones pendientes directamente de la BD
 * 2. Centraliza el estado del planificador
 * 3. Proporciona datos limpios y estructurados para el prompt
 * 4. Evita duplicación de lógica en el componente
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback, 
  useEffect,
  useRef,
  ReactNode 
} from 'react';

// ============================================================================
// TIPOS
// ============================================================================

/** Lección pendiente con datos exactos de la BD */
export interface PendingLesson {
  lessonId: string;
  lessonTitle: string; // Nombre exacto de la BD - NUNCA modificar
  lessonOrderIndex: number;
  durationMinutes: number;
  moduleId: string;
  moduleTitle: string;
  moduleOrderIndex: number;
  courseId: string;
  courseTitle: string;
}

/** Curso con información resumida */
export interface CourseInfo {
  courseId: string;
  courseTitle: string;
  dueDate: string | null;
  totalLessons: number;
  completedLessons: number;
  pendingCount: number;
  pendingLessons: PendingLesson[];
}

/** Perfil del usuario */
export interface UserProfile {
  userId: string;
  userName: string | null;
  userType: 'b2b' | 'b2c' | null;
  rol: string | null;
  area: string | null;
  nivel: string | null;
  organizationName: string | null;
}

/** Estado del calendario */
export interface CalendarState {
  isConnected: boolean;
  provider: 'google' | 'microsoft' | null;
  wasSkipped: boolean; // Si el usuario eligió no conectar
}

/** Preferencias de estudio */
export interface StudyPreferences {
  approach: 'rapido' | 'normal' | 'largo' | null;
  targetDate: string | null;
  preferredDays: string[]; // ['lunes', 'miércoles', 'viernes']
  preferredTimes: string[]; // ['mañana', 'noche']
}

/** Estado completo del contexto de LIA */
export interface LIAContextState {
  // Datos del usuario
  userProfile: UserProfile | null;
  
  // Cursos y lecciones (FUENTE DE VERDAD)
  courses: CourseInfo[];
  allPendingLessons: PendingLesson[];
  totalPendingLessons: number;
  
  // Estado del calendario
  calendar: CalendarState;
  
  // Preferencias
  preferences: StudyPreferences;
  
  // Estado de carga
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  
  // Timestamp de última actualización
  lastUpdated: Date | null;
}

/** Acciones del contexto */
export interface LIAContextActions {
  // Cargar datos
  loadUserData: () => Promise<void>;
  loadPendingLessons: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Actualizar estado
  setCalendarConnected: (provider: 'google' | 'microsoft') => void;
  skipCalendar: () => void;
  setPreferences: (prefs: Partial<StudyPreferences>) => void;
  
  // Generar contexto para prompt
  getContextForPrompt: () => string;
  getLessonsListForPrompt: () => string;
}

export interface LIAContextValue {
  state: LIAContextState;
  actions: LIAContextActions;
}

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const initialState: LIAContextState = {
  userProfile: null,
  courses: [],
  allPendingLessons: [],
  totalPendingLessons: 0,
  calendar: {
    isConnected: false,
    provider: null,
    wasSkipped: false,
  },
  preferences: {
    approach: null,
    targetDate: null,
    preferredDays: [],
    preferredTimes: [],
  },
  isLoading: false,
  isReady: false,
  error: null,
  lastUpdated: null,
};

// ============================================================================
// CONTEXTO
// ============================================================================

const LIAContext = createContext<LIAContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface LIAProviderProps {
  children: ReactNode;
}

export function LIAProvider({ children }: LIAProviderProps) {
  const [state, setState] = useState<LIAContextState>(initialState);
  const loadedRef = useRef(false);

  // -------------------------------------------------------------------------
  // ACCIONES: Cargar datos del usuario
  // -------------------------------------------------------------------------
  const loadUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. Obtener datos del usuario
      const userResponse = await fetch('/api/study-planner/user-context');
      if (!userResponse.ok) throw new Error('Error obteniendo contexto de usuario');
      
      const userData = await userResponse.json();
      
      if (userData.success && userData.data) {
        const data = userData.data;
        
        setState(prev => ({
          ...prev,
          userProfile: {
            userId: data.user?.id || '',
            userName: data.user?.firstName || data.user?.displayName || data.user?.username || null,
            userType: data.userType || null,
            rol: data.professionalProfile?.rol?.nombre || null,
            area: data.professionalProfile?.area?.nombre || null,
            nivel: data.professionalProfile?.nivel?.nombre || null,
            organizationName: data.organization?.name || null,
          },
        }));
      }

      // 2. Verificar estado del calendario
      const calendarResponse = await fetch('/api/study-planner/calendar/status');
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.isConnected && calendarData.provider) {
          setState(prev => ({
            ...prev,
            calendar: {
              ...prev.calendar,
              isConnected: true,
              provider: calendarData.provider,
            },
          }));
        }
      }

    } catch (error) {
      console.error('❌ [LIAContext] Error cargando datos del usuario:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false 
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // ACCIONES: Cargar lecciones pendientes (Bridge Pattern)
  // -------------------------------------------------------------------------
  const loadPendingLessons = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('📚 [LIAContext] Consultando BD para lecciones pendientes...');

      // Usar el endpoint que consulta directamente la BD
      const response = await fetch('/api/study-planner/pending-lessons');
      
      if (!response.ok) {
        throw new Error(`Error en pending-lessons: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo lecciones');
      }

      // Mapear cursos
      const courses: CourseInfo[] = (data.courses || []).map((c: any) => ({
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        dueDate: c.dueDate || null,
        totalLessons: c.totalLessons || 0,
        completedLessons: c.completedLessons || 0,
        pendingCount: c.pendingCount || 0,
        pendingLessons: (c.pendingLessons || []).map((l: any) => ({
          lessonId: l.lessonId,
          lessonTitle: l.lessonTitle, // NOMBRE EXACTO DE LA BD
          lessonOrderIndex: l.lessonOrderIndex,
          durationMinutes: l.durationMinutes || 15,
          moduleId: l.moduleId,
          moduleTitle: l.moduleTitle,
          moduleOrderIndex: l.moduleOrderIndex,
          courseId: c.courseId,
          courseTitle: c.courseTitle,
        })),
      }));

      // Lista plana de todas las lecciones pendientes
      const allPendingLessons: PendingLesson[] = data.allPendingLessons || [];

      setState(prev => ({
        ...prev,
        courses,
        allPendingLessons,
        totalPendingLessons: data.totalPendingLessons || allPendingLessons.length,
        isLoading: false,
        isReady: true,
        lastUpdated: new Date(),
      }));

      console.log(`✅ [LIAContext] ${allPendingLessons.length} lecciones pendientes cargadas`);
      
      // Log de verificación
      if (allPendingLessons.length > 0) {
        console.log('   📋 Primeras 3 lecciones (nombres exactos):');
        allPendingLessons.slice(0, 3).forEach((l, i) => {
          console.log(`      ${i + 1}. "${l.lessonTitle}" (${l.durationMinutes} min)`);
        });
      }

    } catch (error) {
      console.error('❌ [LIAContext] Error cargando lecciones:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Error desconocido',
        isLoading: false 
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // ACCIONES: Refrescar todo
  // -------------------------------------------------------------------------
  const refreshAll = useCallback(async () => {
    await loadUserData();
    await loadPendingLessons();
  }, [loadUserData, loadPendingLessons]);

  // -------------------------------------------------------------------------
  // ACCIONES: Estado del calendario
  // -------------------------------------------------------------------------
  const setCalendarConnected = useCallback((provider: 'google' | 'microsoft') => {
    setState(prev => ({
      ...prev,
      calendar: {
        isConnected: true,
        provider,
        wasSkipped: false,
      },
    }));
  }, []);

  const skipCalendar = useCallback(() => {
    setState(prev => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        wasSkipped: true,
      },
    }));
  }, []);

  // -------------------------------------------------------------------------
  // ACCIONES: Preferencias
  // -------------------------------------------------------------------------
  const setPreferences = useCallback((prefs: Partial<StudyPreferences>) => {
    setState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...prefs,
      },
    }));
  }, []);

  // -------------------------------------------------------------------------
  // ACCIONES: Generar contexto para el prompt de LIA
  // -------------------------------------------------------------------------
  const getContextForPrompt = useCallback((): string => {
    const { userProfile, courses, allPendingLessons, totalPendingLessons, calendar, preferences } = state;

    let context = '';

    // Información del usuario
    if (userProfile) {
      context += `## USUARIO\n`;
      context += `- Nombre: ${userProfile.userName || 'No especificado'}\n`;
      context += `- Tipo: ${userProfile.userType === 'b2b' ? 'B2B (organización)' : 'B2C (independiente)'}\n`;
      if (userProfile.rol) context += `- Rol: ${userProfile.rol}\n`;
      if (userProfile.organizationName) context += `- Organización: ${userProfile.organizationName}\n`;
      context += '\n';
    }

    // Cursos y lecciones
    context += `## CURSOS ASIGNADOS (${courses.length})\n`;
    for (const course of courses) {
      context += `\n### ${course.courseTitle}\n`;
      if (course.dueDate) {
        const daysRemaining = Math.ceil(
          (new Date(course.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        context += `  📅 Fecha límite: ${new Date(course.dueDate).toLocaleDateString('es-ES')} (${daysRemaining} días)\n`;
      }
      context += `  ✅ Completadas: ${course.completedLessons}/${course.totalLessons}\n`;
      context += `  📚 Pendientes: ${course.pendingCount}\n`;
    }

    // Lista de lecciones pendientes (FUENTE DE VERDAD)
    context += `\n## LECCIONES PENDIENTES (${totalPendingLessons} total)\n`;
    context += `⚠️ IMPORTANTE: Usa SOLO estas lecciones con sus nombres y duraciones EXACTAS.\n`;
    context += `⛔ PROHIBIDO inventar lecciones que no estén en esta lista.\n\n`;
    
    for (const lesson of allPendingLessons) {
      context += `- ${lesson.lessonTitle} (${lesson.durationMinutes} min) - ${lesson.moduleTitle}\n`;
    }

    // Estado del calendario
    context += `\n## CALENDARIO\n`;
    if (calendar.isConnected) {
      context += `- Conectado: ${calendar.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}\n`;
    } else if (calendar.wasSkipped) {
      context += `- El usuario prefirió NO conectar su calendario\n`;
      context += `- ⚠️ NO volver a preguntar por el calendario\n`;
    } else {
      context += `- No conectado\n`;
    }

    // Preferencias
    if (preferences.approach || preferences.targetDate || preferences.preferredDays.length > 0) {
      context += `\n## PREFERENCIAS DE ESTUDIO\n`;
      if (preferences.approach) {
        const approachLabels = {
          'rapido': 'Terminar lo antes posible',
          'normal': 'Ritmo equilibrado',
          'largo': 'Tomar mi tiempo',
        };
        context += `- Enfoque: ${approachLabels[preferences.approach]}\n`;
      }
      if (preferences.targetDate) {
        context += `- Fecha objetivo: ${preferences.targetDate}\n`;
      }
      if (preferences.preferredDays.length > 0) {
        context += `- Días preferidos: ${preferences.preferredDays.join(', ')}\n`;
      }
      if (preferences.preferredTimes.length > 0) {
        context += `- Horarios preferidos: ${preferences.preferredTimes.join(', ')}\n`;
      }
    }

    return context;
  }, [state]);

  // -------------------------------------------------------------------------
  // ACCIONES: Generar lista de lecciones simple para el prompt
  // -------------------------------------------------------------------------
  const getLessonsListForPrompt = useCallback((): string => {
    if (state.allPendingLessons.length === 0) {
      return 'No hay lecciones pendientes definidas aún.';
    }

    return state.allPendingLessons
      .map(l => `- ${l.lessonTitle} (${l.durationMinutes} min) - ${l.moduleTitle}`)
      .join('\n');
  }, [state.allPendingLessons]);

  // -------------------------------------------------------------------------
  // EFECTO: Cargar datos al montar
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      refreshAll();
    }
  }, [refreshAll]);

  // -------------------------------------------------------------------------
  // VALOR DEL CONTEXTO
  // -------------------------------------------------------------------------
  const value: LIAContextValue = {
    state,
    actions: {
      loadUserData,
      loadPendingLessons,
      refreshAll,
      setCalendarConnected,
      skipCalendar,
      setPreferences,
      getContextForPrompt,
      getLessonsListForPrompt,
    },
  };

  return (
    <LIAContext.Provider value={value}>
      {children}
    </LIAContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useLIA() {
  const context = useContext(LIAContext);
  
  if (!context) {
    throw new Error('useLIA debe usarse dentro de LIAProvider');
  }
  
  return context;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const LIA_PANEL_WIDTH = 420;

export default LIAContext;
