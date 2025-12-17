import type { NanoBananaSchema, NanoBananaDomain, OutputFormat } from '../../lib/nanobana/templates';

// Tipos compartidos para LIA

/**
 * Información de módulo para contexto
 */
export interface ModuleInfo {
  moduleId: string;
  moduleTitle: string;
  moduleDescription?: string;
  moduleOrderIndex: number;
  lessons: LessonInfo[];
}

/**
 * Información de lección para contexto
 */
export interface LessonInfo {
  lessonId: string;
  lessonTitle: string;
  lessonDescription?: string;
  lessonOrderIndex: number;
  durationSeconds?: number;
}

/**
 * Contexto para cursos y talleres
 * Soporta tanto cursos como talleres (que usan la misma estructura de BD)
 */
export interface CourseLessonContext {
  // Tipo de contexto para diferenciar entre curso y taller
  contextType?: 'course' | 'workshop';
  
  // Información del curso/taller
  courseId?: string;
  courseSlug?: string;
  courseTitle?: string;
  courseDescription?: string;
  
  // Módulo y lección actual
  moduleTitle?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  
  // Contenido de la lección actual
  transcriptContent?: string;
  summaryContent?: string;
  videoTime?: number;
  durationSeconds?: number;
  
  // Metadatos completos del curso/taller (módulos y lecciones disponibles)
  allModules?: ModuleInfo[];
  
  // Información del usuario
  userRole?: string;
  
  // Detección de dificultades
  difficultyDetected?: {
    patterns: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    overallScore: number;
    shouldIntervene: boolean;
    suggestedHelpType?: string;
  };
  
  // Contexto de actividades
  activitiesContext?: {
    totalActivities: number;
    requiredActivities: number;
    completedActivities: number;
    pendingRequiredCount: number;
    pendingRequiredTitles?: string;
    activityTypes?: Array<{
      title: string;
      type: string;
      isRequired: boolean;
      isCompleted: boolean;
    }>;
    currentActivityFocus?: {
      title: string;
      type: string;
      isRequired: boolean;
      description: string;
    } | null;
  };
  
  // Contexto de comportamiento del usuario
  userBehaviorContext?: string;
  
  // Contexto de progreso de aprendizaje
  learningProgressContext?: {
    currentLessonNumber: number;
    totalLessons: number;
    progressPercentage: number;
    currentTab: string;
    timeInCurrentLesson: string;
  };
}

// Interfaz para NanoBanana generado
export interface GeneratedNanoBananaData {
  schema: NanoBananaSchema;
  jsonString: string;
  domain: NanoBananaDomain;
  outputFormat: OutputFormat;
}

export interface LiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // 🎨 Datos de NanoBanana generado (opcional)
  generatedNanoBanana?: GeneratedNanoBananaData;
}

