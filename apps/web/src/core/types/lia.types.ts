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

/**
 * Información de objetivo SCORM para contexto de LIA
 */
export interface ScormObjectiveInfo {
  id: string;
  description?: string;
  satisfiedByMeasure?: boolean;
  minNormalizedMeasure?: number;
}

/**
 * Información de item SCORM (estructura del curso)
 */
export interface ScormItemInfo {
  identifier: string;
  title: string;
  children?: ScormItemInfo[];
}

/**
 * Información de organización SCORM
 */
export interface ScormOrganizationInfo {
  identifier: string;
  title: string;
  items: ScormItemInfo[];
}

/**
 * Contexto para paquetes SCORM
 * Usado por LIA para entender la estructura y objetivos del contenido SCORM
 */
export interface ScormLessonContext {
  contextType: 'scorm';

  // Información del paquete
  packageId: string;
  packageTitle: string;
  packageDescription?: string;
  scormVersion: 'SCORM_1.2' | 'SCORM_2004';

  // Objetivos de aprendizaje del manifest
  objectives: ScormObjectiveInfo[];

  // Estructura del curso (formateada para LIA)
  courseStructure: string;

  // Organizaciones del manifest (estructura completa)
  organizations?: ScormOrganizationInfo[];

  // Progreso actual
  currentProgress?: number;
  lessonStatus?: string;

  // Información del usuario
  userRole?: string;
}

export interface LiaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // Datos de NanoBanana generado (opcional)
  generatedNanoBanana?: GeneratedNanoBananaData;
}

