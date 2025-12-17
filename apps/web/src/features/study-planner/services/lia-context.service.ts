/**
 * LiaContextService
 * 
 * Servicio para construir y formatear el contexto completo del usuario
 * para LIA en el planificador de estudios.
 */

import { UserContextService } from './user-context.service';
import { CourseAnalysisService } from './course-analysis.service';
import { CalendarIntegrationService } from './calendar-integration.service';
import { getWorkshopMetadata } from '../../../lib/utils/workshop-metadata';
import { createClient } from '../../../lib/supabase/server';
import type {
  UserContext,
  CalendarEvent,
  CalendarAvailability,
  LessonDuration,
  CourseComplexity,
} from '../types/user-context.types';

/**
 * Contexto completo para LIA del planificador
 */
export interface StudyPlannerLIAContext {
  // Información del usuario
  userType: 'b2b' | 'b2c';
  userProfile: {
    nombre?: string;
    rol?: string;
    area?: string;
    nivel?: string;
    sector?: string;
    tamanoEmpresa?: string;
    minEmpleados?: number;
    maxEmpleados?: number;
  };
  
  // Organización (solo B2B)
  organization?: {
    name: string;
    size?: string;
    industry?: string;
  };
  
  // Equipos de trabajo (solo B2B)
  workTeams?: Array<{
    name: string;
    role: string;
  }>;
  
  // Cursos
  courses: Array<{
    id: string;
    title: string;
    category: string;
    level: string;
    durationMinutes: number;
    completionPercentage: number;
    dueDate?: string; // Solo B2B
    assignedBy?: string; // Solo B2B
    modules?: Array<{
      moduleId: string;
      moduleTitle: string;
      moduleOrderIndex: number;
      lessons: Array<{
        lessonId: string;
        lessonTitle: string;
        lessonOrderIndex: number;
        durationMinutes: number;
        isCompleted: boolean;
      }>;
    }>;
  }>;
  
  // Análisis de cursos
  courseAnalysis?: {
    totalMinutes: number;
    totalLessons: number;
    averageComplexity: number;
    minimumLessonTime: number;
  };
  
  // Calendario
  calendarConnected: boolean;
  calendarProvider?: 'google' | 'microsoft';
  calendarEvents?: CalendarEvent[];
  calendarAvailability?: {
    totalFreeMinutes: number;
    totalBusyMinutes: number;
    averageFreeMinutesPerDay: number;
    freeSlotCount: number;
  };
  
  // Preferencias existentes
  existingPreferences?: {
    timezone?: string;
    preferredTimeOfDay?: string;
    preferredDays?: number[];
    weeklyTargetMinutes?: number;
  };
  
  // Plazos críticos (solo B2B)
  upcomingDeadlines?: Array<{
    courseTitle: string;
    dueDate: string;
    daysRemaining: number;
    completionPercentage: number;
  }>;
  
  // Fase actual del flujo
  currentPhase?: number;
  phaseData?: Record<string, any>;
}

export class LiaContextService {
  /**
   * Construye el contexto completo para LIA del planificador
   */
  static async buildStudyPlannerContext(userId: string): Promise<StudyPlannerLIAContext> {
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(userId);
    
    console.log(`[LiaContextService] buildStudyPlannerContext - userType recibido: ${userContext.userType} para userId: ${userId}`);
    
    // Construir contexto base
    const context: StudyPlannerLIAContext = {
      userType: userContext.userType,
      userProfile: this.formatUserProfile(userContext),
      courses: await this.formatCourses(userId, userContext),
      calendarConnected: !!userContext.calendarIntegration?.isConnected,
      calendarProvider: userContext.calendarIntegration?.provider,
    };
    
    console.log(`[LiaContextService] buildStudyPlannerContext - Contexto construido con userType: ${context.userType}`);
    
    // Agregar información de organización para B2B
    if (userContext.userType === 'b2b' && userContext.organization) {
      context.organization = {
        name: userContext.organization.name,
        size: userContext.organization.size,
        industry: userContext.organization.industry,
      };
      
      if (userContext.workTeams && userContext.workTeams.length > 0) {
        context.workTeams = userContext.workTeams.map(team => ({
          name: team.name,
          role: team.role,
        }));
      }
      
      // Obtener plazos próximos
      const deadlines = await UserContextService.getUpcomingDeadlines(userId, 30);
      if (deadlines.length > 0) {
        context.upcomingDeadlines = deadlines.map(d => ({
          courseTitle: d.course.title,
          dueDate: d.dueDate!,
          daysRemaining: Math.ceil(
            (new Date(d.dueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
          completionPercentage: d.completionPercentage,
        }));
      }
    }
    
    // Análisis de cursos
    if (context.courses.length > 0) {
      context.courseAnalysis = await this.analyzeCourses(userId, context.courses);
    }
    
    // Información del calendario
    if (context.calendarConnected) {
      const startDate = new Date();
      const endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      
      const events = await CalendarIntegrationService.getCalendarEvents(
        userId,
        startDate,
        endDate
      );
      
      if (events.length > 0) {
        context.calendarEvents = events;
        
        const availability = CalendarIntegrationService.analyzeAvailability(
          events,
          startDate,
          endDate
        );
        
        let totalFree = 0;
        let totalBusy = 0;
        let totalSlots = 0;
        
        for (const day of availability) {
          totalFree += day.totalFreeMinutes;
          totalBusy += day.totalBusyMinutes;
          totalSlots += day.freeSlots.length;
        }
        
        context.calendarAvailability = {
          totalFreeMinutes: totalFree,
          totalBusyMinutes: totalBusy,
          averageFreeMinutesPerDay: availability.length > 0 
            ? Math.round(totalFree / availability.length) 
            : 0,
          freeSlotCount: totalSlots,
        };
      }
    }
    
    // Preferencias existentes
    if (userContext.studyPreferences) {
      context.existingPreferences = {
        timezone: userContext.studyPreferences.timezone,
        preferredTimeOfDay: userContext.studyPreferences.preferredTimeOfDay,
        preferredDays: userContext.studyPreferences.preferredDays,
        weeklyTargetMinutes: userContext.studyPreferences.weeklyTargetMinutes,
      };
    }
    
    return context;
  }

  /**
   * Formatea el perfil del usuario para LIA
   */
  private static formatUserProfile(userContext: UserContext): StudyPlannerLIAContext['userProfile'] {
    return {
      nombre: userContext.user.displayName || 
              (userContext.user.firstName && userContext.user.lastName 
                ? `${userContext.user.firstName} ${userContext.user.lastName}` 
                : undefined),
      rol: userContext.professionalProfile?.rol?.nombre,
      area: userContext.professionalProfile?.area?.nombre,
      nivel: userContext.professionalProfile?.nivel?.nombre,
      sector: userContext.professionalProfile?.sector?.nombre,
      tamanoEmpresa: userContext.professionalProfile?.tamanoEmpresa?.nombre,
      minEmpleados: userContext.professionalProfile?.tamanoEmpresa?.minEmpleados,
      maxEmpleados: userContext.professionalProfile?.tamanoEmpresa?.maxEmpleados,
    };
  }

  /**
   * Formatea los cursos para LIA
   */
  private static async formatCourses(
    userId: string,
    userContext: UserContext
  ): Promise<StudyPlannerLIAContext['courses']> {
    const formattedCourses: StudyPlannerLIAContext['courses'] = [];
    const supabase = await createClient();

    for (const courseAssignment of userContext.courses) {
      const progress = await CourseAnalysisService.getUserCourseProgress(
        userId,
        courseAssignment.courseId
      );

      // Usar getWorkshopMetadata para obtener módulos y lecciones (misma lógica que /learn)
      const workshopMetadata = await getWorkshopMetadata(courseAssignment.courseId);

      // Obtener lecciones completadas del usuario
      const { data: completedLessonsData } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('is_completed', true);

      const completedLessonIds = new Set((completedLessonsData || []).map(l => l.lesson_id));

      // Formatear módulos y lecciones usando los datos del workshopMetadata
      const formattedModules = workshopMetadata?.modules.map(module => ({
        moduleId: module.moduleId,
        moduleTitle: module.moduleTitle,
        moduleOrderIndex: module.moduleOrderIndex,
        lessons: module.lessons.map(lesson => ({
          lessonId: lesson.lessonId,
          lessonTitle: lesson.lessonTitle,
          lessonOrderIndex: lesson.lessonOrderIndex,
          durationMinutes: lesson.durationSeconds ? Math.ceil(lesson.durationSeconds / 60) : 0,
          isCompleted: completedLessonIds.has(lesson.lessonId),
        })),
      })) || [];

      formattedCourses.push({
        id: courseAssignment.courseId,
        title: courseAssignment.course.title,
        category: courseAssignment.course.category,
        level: courseAssignment.course.level,
        durationMinutes: courseAssignment.course.durationTotalMinutes,
        completionPercentage: progress.progressPercentage,
        dueDate: courseAssignment.dueDate,
        assignedBy: courseAssignment.assignedBy,
        modules: formattedModules,
      });
    }

    return formattedCourses;
  }

  /**
   * Analiza los cursos para LIA
   */
  private static async analyzeCourses(
    userId: string,
    courses: StudyPlannerLIAContext['courses']
  ): Promise<StudyPlannerLIAContext['courseAnalysis']> {
    let totalMinutes = 0;
    let totalLessons = 0;
    let totalComplexity = 0;
    let minLessonTime = Infinity;
    let coursesWithComplexity = 0;
    
    for (const course of courses) {
      // Tiempo restante
      const remaining = await CourseAnalysisService.calculateRemainingTime(userId, course.id);
      totalMinutes += remaining.totalRemainingMinutes;
      totalLessons += remaining.remainingLessons;
      
      // Complejidad
      const complexity = await CourseAnalysisService.getCourseComplexity(course.id);
      if (complexity) {
        totalComplexity += complexity.complexityScore;
        coursesWithComplexity++;
      }
      
      // Tiempo mínimo de lección
      const minTime = await CourseAnalysisService.getMinimumLessonTime(course.id);
      if (minTime < minLessonTime) {
        minLessonTime = minTime;
      }
    }
    
    return {
      totalMinutes,
      totalLessons,
      averageComplexity: coursesWithComplexity > 0 
        ? Math.round((totalComplexity / coursesWithComplexity) * 10) / 10
        : 5,
      minimumLessonTime: minLessonTime === Infinity ? 15 : Math.ceil(minLessonTime),
    };
  }

  /**
   * Formatea el contexto como string para incluir en el prompt de LIA
   */
  static formatContextForPrompt(context: StudyPlannerLIAContext): string {
    let prompt = '';
    
    // Tipo de usuario
    prompt += `\n## TIPO DE USUARIO\n`;
    if (context.userType === 'b2b') {
      const hasCourses = context.courses && context.courses.length > 0;
      prompt += hasCourses
        ? 'Usuario B2B (pertenece a una organización con cursos asignados y plazos)\n'
        : 'Usuario B2B (pertenece a una organización, pero aún no tiene cursos asignados)\n';
    } else {
      prompt += 'Usuario B2C (usuario independiente con flexibilidad total)\n';
    }
    
    // Perfil profesional
    prompt += `\n## PERFIL PROFESIONAL\n`;
    if (context.userProfile.nombre) {
      prompt += `- Nombre: ${context.userProfile.nombre}\n`;
    }
    prompt += `- Rol: ${context.userProfile.rol || 'No especificado'}\n`;
    prompt += `- Área: ${context.userProfile.area || 'No especificada'}\n`;
    prompt += `- Nivel: ${context.userProfile.nivel || 'No especificado'}\n`;
    prompt += `- Sector: ${context.userProfile.sector || 'No especificado'}\n`;
    if (context.userProfile.tamanoEmpresa) {
      prompt += `- Tamaño de empresa: ${context.userProfile.tamanoEmpresa}`;
      if (context.userProfile.minEmpleados && context.userProfile.maxEmpleados) {
        prompt += ` (${context.userProfile.minEmpleados}-${context.userProfile.maxEmpleados} empleados)`;
      }
      prompt += '\n';
    }
    
    // Organización (B2B)
    if (context.organization) {
      prompt += `\n## ORGANIZACIÓN\n`;
      prompt += `- Nombre: ${context.organization.name}\n`;
      if (context.organization.industry) {
        prompt += `- Industria: ${context.organization.industry}\n`;
      }
      if (context.organization.size) {
        prompt += `- Tamaño: ${context.organization.size}\n`;
      }
    }
    
    // Equipos de trabajo (B2B)
    if (context.workTeams && context.workTeams.length > 0) {
      prompt += `\n## EQUIPOS DE TRABAJO\n`;
      for (const team of context.workTeams) {
        prompt += `- ${team.name} (rol: ${team.role})\n`;
      }
    }
    
    // Cursos
    prompt += `\n## CURSOS (${context.courses.length})\n`;
    for (const course of context.courses) {
      prompt += `- ${course.title}\n`;
      prompt += `  - Categoría: ${course.category}, Nivel: ${course.level}\n`;
      prompt += `  - Duración total: ${Math.round(course.durationMinutes / 60 * 10) / 10} horas\n`;
      prompt += `  - Progreso: ${course.completionPercentage}%\n`;
      if (course.dueDate) {
        const daysRemaining = Math.ceil(
          (new Date(course.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        prompt += `  - Fecha límite: ${new Date(course.dueDate).toLocaleDateString()} (${daysRemaining} días)\n`;
      }
      if (course.assignedBy) {
        prompt += `  - Asignado por: ${course.assignedBy}\n`;
      }

      // Agregar módulos y lecciones si están disponibles
      if (course.modules && course.modules.length > 0) {
        let totalLessons = 0;
        let completedLessons = 0;
        let pendingLessons = 0;

        // Primero contar todas las lecciones para el resumen
        for (const module of course.modules) {
          for (const lesson of module.lessons) {
            totalLessons++;
            if (lesson.isCompleted) {
              completedLessons++;
            } else {
              pendingLessons++;
            }
          }
        }

        // IMPORTANTE: Solo mostrar lecciones PENDIENTES a LIA
        // Las lecciones completadas no deben incluirse en el plan de estudios
        if (pendingLessons > 0) {
          prompt += `  \n  LECCIONES PENDIENTES (las que DEBES incluir en el plan):\n`;
          for (const module of course.modules) {
            // Solo mostrar módulos que tengan lecciones pendientes
            const pendingInModule = module.lessons.filter(l => !l.isCompleted);
            if (pendingInModule.length > 0) {
              prompt += `    Módulo ${module.moduleOrderIndex}: ${module.moduleTitle}\n`;
              for (const lesson of pendingInModule) {
                prompt += `       ${lesson.lessonOrderIndex}. ${lesson.lessonTitle} (${lesson.durationMinutes} min) [PENDIENTE]\n`;
              }
            }
          }
        }

        prompt += `  \n  RESUMEN: ${completedLessons} de ${totalLessons} lecciones ya completadas, ${pendingLessons} pendientes por planificar\n`;
        prompt += `  \n  ⚠️ IMPORTANTE: El plan de estudios debe incluir SOLO las ${pendingLessons} lecciones pendientes, comenzando desde la primera lección no completada.\n`;
      }
    }
    
    // Análisis de cursos
    if (context.courseAnalysis) {
      prompt += `\n## ANÁLISIS DE CURSOS\n`;
      prompt += `- Tiempo total restante: ${Math.round(context.courseAnalysis.totalMinutes / 60 * 10) / 10} horas\n`;
      prompt += `- Lecciones pendientes: ${context.courseAnalysis.totalLessons}\n`;
      prompt += `- Complejidad promedio: ${context.courseAnalysis.averageComplexity}/10\n`;
      prompt += `- Tiempo mínimo por sesión: ${context.courseAnalysis.minimumLessonTime} minutos (para completar al menos una lección)\n`;
    }
    
    // Calendario
    prompt += `\n## CALENDARIO\n`;
    if (context.calendarConnected) {
      prompt += `- Calendario conectado: ${context.calendarProvider === 'google' ? 'Google Calendar' : 'Microsoft Calendar'}\n`;
      if (context.calendarAvailability) {
        prompt += `- Tiempo libre total (próximas 2 semanas): ${Math.round(context.calendarAvailability.totalFreeMinutes / 60 * 10) / 10} horas\n`;
        prompt += `- Tiempo ocupado total: ${Math.round(context.calendarAvailability.totalBusyMinutes / 60 * 10) / 10} horas\n`;
        prompt += `- Promedio libre por día: ${context.calendarAvailability.averageFreeMinutesPerDay} minutos\n`;
        prompt += `- Slots disponibles: ${context.calendarAvailability.freeSlotCount}\n`;
      }
    } else {
      prompt += `- Calendario no conectado. Es IMPORTANTE pedir al usuario que conecte su calendario para analizar su disponibilidad real.\n`;
    }
    
    // Plazos próximos (B2B)
    if (context.upcomingDeadlines && context.upcomingDeadlines.length > 0) {
      prompt += `\n## PLAZOS PRÓXIMOS (¡IMPORTANTE!)\n`;
      for (const deadline of context.upcomingDeadlines) {
        prompt += `- ${deadline.courseTitle}: ${deadline.daysRemaining} días (${deadline.completionPercentage}% completado)\n`;
        if (deadline.daysRemaining < 7) {
          prompt += `  ⚠️ URGENTE: Menos de una semana para completar\n`;
        }
      }
    }
    
    // Preferencias existentes
    if (context.existingPreferences) {
      prompt += `\n## PREFERENCIAS GUARDADAS\n`;
      if (context.existingPreferences.timezone) {
        prompt += `- Zona horaria: ${context.existingPreferences.timezone}\n`;
      }
      if (context.existingPreferences.preferredTimeOfDay) {
        prompt += `- Momento del día preferido: ${context.existingPreferences.preferredTimeOfDay}\n`;
      }
      if (context.existingPreferences.preferredDays) {
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const days = context.existingPreferences.preferredDays.map(d => dayNames[d]).join(', ');
        prompt += `- Días preferidos: ${days}\n`;
      }
      if (context.existingPreferences.weeklyTargetMinutes) {
        prompt += `- Meta semanal: ${Math.round(context.existingPreferences.weeklyTargetMinutes / 60 * 10) / 10} horas\n`;
      }
    }
    
    return prompt;
  }

  /**
   * Genera las instrucciones específicas para LIA según el tipo de usuario y fase
   */
  static generatePhaseInstructions(
    context: StudyPlannerLIAContext, 
    phase: number
  ): string {
    let instructions = '';
    
    const isB2B = context.userType === 'b2b';
    
    switch (phase) {
      case 1: // Análisis de contexto
        instructions = `
FASE 1: ANÁLISIS DE CONTEXTO

Tu objetivo es presentarte y analizar el perfil del usuario para estimar su disponibilidad.

${isB2B ? `
INSTRUCCIONES PARA USUARIO B2B:
- Este usuario pertenece a una organización
- Sus cursos ya están asignados con plazos fijos
- Debes considerar los plazos al estimar tiempos
- No puede seleccionar otros cursos, solo organizar su tiempo
` : `
INSTRUCCIONES PARA USUARIO B2C:
- Este usuario es independiente
- Tiene flexibilidad total para elegir cursos
- Puede establecer o no metas de tiempo fijas
- Puedes sugerirle rutas de aprendizaje y cursos adicionales
`}

ACCIONES:
1. Saluda al usuario por su nombre si lo conoces
2. Explica brevemente que analizarás su perfil
3. Presenta tu análisis de disponibilidad estimada basándote en:
   - Rol profesional (C-Level tiene menos tiempo que gerencia media)
   - Tamaño de empresa (empresas grandes = menos tiempo)
   - Nivel jerárquico
   - Área profesional
4. Pregunta si el análisis le parece correcto
`;
        break;
        
      case 2: // Selección de cursos
        if (isB2B) {
          const hasCourses = context.courses && context.courses.length > 0;
          
          if (hasCourses) {
            instructions = `
FASE 2: CURSOS ASIGNADOS (B2B)

Los cursos ya están asignados por la organización. NO preguntes qué cursos quiere estudiar.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Presenta los cursos asignados y sus plazos
2. Menciona cuántas lecciones tiene pendientes en cada curso
3. Destaca cualquier curso con plazo próximo (menos de 2 semanas)
4. Sugiere priorizar los cursos con plazos más cercanos
5. Pregunta si está de acuerdo con el orden propuesto
`;
          } else {
            instructions = `
FASE 2: SIN CURSOS ASIGNADOS (B2B)

Este usuario B2B aún no tiene cursos asignados por su organización.

ACCIONES:
1. Informa al usuario que actualmente no tiene cursos asignados
2. Explica que su organización o administrador puede asignarle cursos
3. Ofrece ayudarle a preparar un plan de estudios general o de tiempo
4. Puedes sugerir que se comunique con su administrador para obtener cursos asignados
5. Si el usuario insiste en crear un plan, puedes ayudarle a organizar su tiempo de estudio general
`;
          }
        } else {
          instructions = `
FASE 2: SELECCIÓN DE CURSOS (B2C)

El usuario puede elegir qué cursos incluir en su plan.

⚠️ REGLA CRÍTICA SOBRE LECCIONES:
- El usuario ya ha completado algunas lecciones de sus cursos
- El plan debe incluir SOLO las lecciones pendientes (no completadas)
- Comienza desde la primera lección no completada de cada curso
- NO incluyas lecciones marcadas como completadas

ACCIONES:
1. Muestra los cursos que ya tiene adquiridos
2. Menciona el progreso actual (lecciones completadas vs pendientes)
3. Pregunta cuáles quiere incluir en el plan
4. OPCIONALMENTE puedes sugerir rutas de aprendizaje personalizadas
5. Puedes mencionar que existen cursos adicionales que podrían complementar su aprendizaje
6. Confirma la selección final de cursos
`;
        }
        break;
        
      case 3: // Integración de calendario
        instructions = `
FASE 3: CONEXIÓN DE CALENDARIO

Es OBLIGATORIO que el usuario conecte su calendario antes de continuar.

${context.calendarConnected ? `
El usuario ya tiene su calendario conectado (${context.calendarProvider}).
Presenta el análisis de disponibilidad basado en sus eventos.

⚠️ IMPORTANTE: MANEJO DE EVENTOS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), menciona que evitarás esos días
- Pero aclara que el plan CONTINUARÁ distribuyendo lecciones en los días posteriores
- Los días con eventos importantes se saltan, pero el resto del calendario sigue disponible
- Ejemplo: "Veo que tienes un examen el jueves. Evitaré ese día y el viernes para que descanses, pero continuaré con tu plan el sábado."
` : `
El usuario NO tiene calendario conectado.
DEBES pedirle que conecte su Google Calendar o Microsoft Calendar.
Explica que esto permitirá:
- Analizar sus horarios reales
- Evitar conflictos con reuniones
- Sugerir los mejores momentos para estudiar
- Detectar eventos importantes que requieren descanso
`}

ACCIONES:
1. Verificar si tiene calendario conectado
2. Si no está conectado, solicitar la conexión
3. Una vez conectado, analizar la disponibilidad
4. Presentar horarios sugeridos basados en el análisis
5. Si hay eventos importantes, menciona que se evitarán esos días pero se continuará después
`;
        break;
        
      case 4: // Configuración de tiempos
        instructions = `
FASE 4: CONFIGURACIÓN DE TIEMPOS

Debes configurar los tiempos de las sesiones de estudio.

REGLAS CRÍTICAS:
- El tiempo MÍNIMO de sesión debe ser >= ${context.courseAnalysis?.minimumLessonTime || 15} minutos
  (Este es el tiempo de la lección más corta, el usuario debe completar al menos una lección por sesión)
- Los tiempos deben respetar la disponibilidad del calendario

${isB2B ? `
REGLAS ADICIONALES PARA B2B:
- Los tiempos deben permitir completar los cursos antes de los plazos
- Si el usuario sugiere tiempos que no permiten cumplir los plazos, DEBES advertirle y sugerir alternativas
` : `
OPCIONES PARA B2C:
- Pregunta si quiere establecer metas de tiempo fijas o de finalización
- Si no quiere metas fijas, sugiere tiempos flexibles
- Tiene libertad total para modificar los tiempos que sugieras
`}

ACCIONES:
1. Sugiere tiempos mínimos y máximos de sesión basados en el análisis
2. Pregunta si está de acuerdo o quiere ajustarlos
3. Valida que los tiempos cumplan con las reglas
`;
        break;
        
      case 5: // Tiempos de descanso
        instructions = `
FASE 5: TIEMPOS DE DESCANSO

Calcula automáticamente los tiempos de descanso óptimos.

MEJORES PRÁCTICAS DE ESTUDIO:
- Técnica Pomodoro: 25 min estudio + 5 min descanso
- Sesiones de 45-60 min: 10-15 min descanso
- Sesiones de 90+ min: 15-20 min descanso

ACCIONES:
1. Basándote en la duración de sesión configurada, sugiere tiempo de descanso
2. Explica brevemente por qué ese tiempo es óptimo
3. El usuario puede ajustarlo si lo desea
`;
        break;
        
      case 6: // Días y horarios
        instructions = `
FASE 6: DÍAS Y HORARIOS

Configura los días y horarios de estudio.

⚠️ IMPORTANTE: MANEJO DE EVENTOS Y FECHAS IMPORTANTES
- Si detectas eventos importantes (exámenes, presentaciones, evaluaciones), EVITA asignar lecciones en ese día específico y el día siguiente para descanso
- PERO DEBES CONTINUAR distribuyendo lecciones en todos los demás días disponibles
- NO te detengas después de un evento importante, simplemente sáltalo y sigue con los días posteriores
- Los slots disponibles ya excluyen automáticamente los días con eventos importantes, así que usa TODOS los slots que se te proporcionan

EJEMPLO CORRECTO:
- Día 1: Lección A (normal)
- Día 2: Lección B (normal)
- Día 3: EXAMEN → SALTAR (no asignar lecciones)
- Día 4: → SALTAR (descanso después del examen)
- Día 5: Lección C (CONTINUAR distribuyendo) ✅
- Día 6: Lección D (CONTINUAR distribuyendo) ✅
- ... (seguir hasta completar todas las lecciones)

EJEMPLO INCORRECTO:
- Día 1: Lección A
- Día 2: Lección B
- Día 3: EXAMEN → SALTAR
- Día 4: → SALTAR (descanso)
- Día 5 en adelante: (sin lecciones) ❌ INCORRECTO - NO te detengas aquí

ACCIONES:
1. Pregunta qué días de la semana prefiere estudiar
2. Pregunta en qué horarios:
   - Opción genérica: mañana, tarde, noche
   - Opción específica: hora:minuto exactos
3. Valida que los horarios:
   - No se solapen con eventos del calendario
   - Permitan sesiones de la duración configurada
   - Incluyan los tiempos de descanso
4. Si hay conflictos, sugiere alternativas
5. ASEGÚRATE de distribuir TODAS las lecciones pendientes en los días disponibles
`;
        break;
        
      case 7: // Resumen y confirmación
        instructions = `
FASE 7: RESUMEN Y CONFIRMACIÓN

Presenta un resumen completo del plan.

⚠️ RECORDATORIO CRÍTICO:
- El plan debe incluir SOLO lecciones pendientes (no completadas)
- Verifica que no estés incluyendo lecciones que el usuario ya completó
- Comienza desde la primera lección no completada de cada curso

⚠️ DISTRIBUCIÓN DE LECCIONES:
- ASEGÚRATE de haber distribuido TODAS las lecciones pendientes en los días disponibles
- Si detectaste eventos importantes (exámenes, presentaciones), solo evita esos días específicos y el día siguiente
- CONTINÚA distribuyendo lecciones en todos los demás días disponibles después del evento
- NO dejes lecciones sin asignar solo porque hay un evento importante en medio del período
- Verifica que el número de lecciones en el plan coincida con el número total de lecciones pendientes

EL RESUMEN DEBE INCLUIR:
- Cursos incluidos y cuántas lecciones pendientes tiene cada uno
- Tiempo mínimo y máximo de sesiones
- Tiempos de descanso
- Días y horarios configurados
- CONFIRMACIÓN de que TODAS las lecciones pendientes fueron distribuidas
${isB2B ? '- Plazos y si se pueden cumplir con la configuración' : '- Meta de finalización (si se configuró)'}

ACCIONES:
1. Presenta el resumen de forma clara
2. Indica si hay advertencias o problemas
3. Ofrece la opción de modificar cualquier aspecto
4. Si el usuario acepta, indica que el plan está listo para guardarse
5. VERIFICA que todas las lecciones pendientes estén distribuidas en el calendario
`;
        break;
    }
    
    return instructions;
  }
}

