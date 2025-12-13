/**
 * CourseAnalysisService
 * 
 * Servicio para analizar cursos, calcular duraciones de lecciones,
 * analizar complejidad y sugerir rutas de aprendizaje usando LIA.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  UserType,
  CourseInfo,
  CourseModule,
  LessonInfo,
  LessonDuration,
  CourseComplexity,
  LearningRouteSuggestion,
  CourseAssignment,
} from '../types/user-context.types';

// Tiempo estimado por defecto para actividades sin tiempo definido (minutos)
const DEFAULT_ACTIVITY_TIME_MINUTES = 5;
// Tiempo estimado por defecto para materiales sin tiempo definido (minutos)
const DEFAULT_MATERIAL_TIME_MINUTES = 5;
// Tiempo fijo de interacciones por lección (minutos)
const INTERACTIONS_TIME_MINUTES = 3;

export class CourseAnalysisService {
  /**
   * Obtiene los cursos del usuario según su tipo (B2B o B2C)
   * Esta función es un wrapper que usa UserContextService
   */
  static async getUserCourses(userId: string, userType: UserType): Promise<CourseAssignment[]> {
    // Importación dinámica para evitar dependencias circulares
    const { UserContextService } = await import('./user-context.service');
    return UserContextService.getUserCourses(userId, userType);
  }

  /**
   * Obtiene la información detallada de un curso
   */
  static async getCourseInfo(courseId: string): Promise<CourseInfo | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        slug,
        category,
        level,
        instructor_id,
        thumbnail_url,
        duration_total_minutes,
        is_active,
        price,
        average_rating,
        student_count,
        instructor:instructor_id (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('id', courseId)
      .single();
    
    if (error) {
      console.error('Error obteniendo información del curso:', error);
      return null;
    }
    
    const instructor = data.instructor as unknown as {
      display_name?: string;
      first_name?: string;
      last_name?: string;
    } | null;
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      slug: data.slug,
      category: data.category,
      level: data.level as 'beginner' | 'intermediate' | 'advanced',
      instructorId: data.instructor_id,
      instructorName: instructor?.display_name || 
        (instructor?.first_name && instructor?.last_name 
          ? `${instructor.first_name} ${instructor.last_name}` 
          : undefined),
      thumbnailUrl: data.thumbnail_url,
      durationTotalMinutes: data.duration_total_minutes,
      isActive: data.is_active,
      price: data.price,
      averageRating: data.average_rating,
      studentCount: data.student_count,
    };
  }

  /**
   * Obtiene los módulos de un curso con sus lecciones
   */
  static async getCourseModules(courseId: string): Promise<CourseModule[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('course_modules')
      .select(`
        module_id,
        module_title,
        module_description,
        module_order_index,
        module_duration_minutes,
        is_required,
        is_published,
        course_lessons (
          lesson_id,
          lesson_title,
          lesson_description,
          lesson_order_index,
          duration_seconds,
          is_published
        )
      `)
      .eq('course_id', courseId)
      .eq('is_published', true)
      .order('module_order_index', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo módulos del curso:', error);
      return [];
    }
    
    return data.map(module => ({
      moduleId: module.module_id,
      moduleTitle: module.module_title,
      moduleDescription: module.module_description,
      moduleOrderIndex: module.module_order_index,
      moduleDurationMinutes: module.module_duration_minutes || 0,
      isRequired: module.is_required || false,
      isPublished: module.is_published,
      lessons: (module.course_lessons || [])
        .filter((lesson: any) => lesson.is_published)
        .sort((a: any, b: any) => a.lesson_order_index - b.lesson_order_index)
        .map((lesson: any) => ({
          lessonId: lesson.lesson_id,
          lessonTitle: lesson.lesson_title,
          lessonDescription: lesson.lesson_description,
          lessonOrderIndex: lesson.lesson_order_index,
          durationSeconds: lesson.duration_seconds,
          moduleId: module.module_id,
          isPublished: lesson.is_published,
        })),
    }));
  }

  /**
   * Obtiene todas las lecciones de un curso (sin agrupar por módulos)
   */
  static async getCourseLessons(courseId: string): Promise<LessonInfo[]> {
    const modules = await this.getCourseModules(courseId);
    return modules.flatMap(module => module.lessons);
  }

  /**
   * Calcula la duración total de una lección incluyendo video, actividades, materiales e interacciones
   */
  static async calculateLessonDuration(lessonId: string): Promise<LessonDuration | null> {
    const supabase = await createClient();
    
    // Primero intentar obtener de la tabla de estimaciones precalculadas
    const { data: estimate, error: estimateError } = await supabase
      .from('lesson_time_estimates')
      .select('*')
      .eq('lesson_id', lessonId)
      .single();
    
    if (!estimateError && estimate) {
      // Usar estimación precalculada
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('lesson_title')
        .eq('lesson_id', lessonId)
        .single();
      
      return {
        lessonId,
        lessonTitle: lesson?.lesson_title || 'Lección',
        videoMinutes: estimate.video_minutes || 0,
        activitiesMinutes: estimate.activities_time_minutes || 0,
        materialsMinutes: (estimate.reading_time_minutes || 0) + 
                         (estimate.quiz_time_minutes || 0) + 
                         (estimate.exercise_time_minutes || 0) +
                         (estimate.link_time_minutes || 0),
        interactionsMinutes: estimate.interactions_time_minutes || INTERACTIONS_TIME_MINUTES,
        totalMinutes: estimate.total_time_minutes || 0,
        isEstimated: false,
      };
    }
    
    // Calcular manualmente si no hay estimación precalculada
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, lesson_title, duration_seconds')
      .eq('lesson_id', lessonId)
      .single();
    
    if (lessonError || !lesson) {
      console.error('Error obteniendo lección:', lessonError);
      return null;
    }
    
    // Obtener actividades de la lección
    const { data: activities } = await supabase
      .from('lesson_activities')
      .select('activity_id, estimated_time_minutes')
      .eq('lesson_id', lessonId);
    
    // Obtener materiales de la lección
    const { data: materials } = await supabase
      .from('lesson_materials')
      .select('material_id, estimated_time_minutes, material_type')
      .eq('lesson_id', lessonId);
    
    // Calcular tiempos
    const videoMinutes = Math.ceil((lesson.duration_seconds || 0) / 60);
    
    // Actividades: usar tiempo estimado o valor por defecto
    let activitiesMinutes = 0;
    let hasEstimatedActivities = false;
    for (const activity of activities || []) {
      if (activity.estimated_time_minutes) {
        activitiesMinutes += activity.estimated_time_minutes;
      } else {
        activitiesMinutes += DEFAULT_ACTIVITY_TIME_MINUTES;
        hasEstimatedActivities = true;
      }
    }
    
    // Materiales: usar tiempo estimado o valor por defecto según tipo
    let materialsMinutes = 0;
    let hasEstimatedMaterials = false;
    for (const material of materials || []) {
      if (material.estimated_time_minutes) {
        materialsMinutes += material.estimated_time_minutes;
      } else {
        // Estimar según tipo de material
        switch (material.material_type) {
          case 'quiz':
            materialsMinutes += 10; // Quiz típicamente 10 min
            break;
          case 'exercise':
            materialsMinutes += 15; // Ejercicio típicamente 15 min
            break;
          case 'reading':
            materialsMinutes += 10; // Lectura típicamente 10 min
            break;
          default:
            materialsMinutes += DEFAULT_MATERIAL_TIME_MINUTES;
        }
        hasEstimatedMaterials = true;
      }
    }
    
    const totalMinutes = videoMinutes + activitiesMinutes + materialsMinutes + INTERACTIONS_TIME_MINUTES;
    
    return {
      lessonId,
      lessonTitle: lesson.lesson_title,
      videoMinutes,
      activitiesMinutes,
      materialsMinutes,
      interactionsMinutes: INTERACTIONS_TIME_MINUTES,
      totalMinutes,
      isEstimated: hasEstimatedActivities || hasEstimatedMaterials,
    };
  }

  /**
   * Calcula las duraciones de todas las lecciones para una lista de cursos
   */
  static async getAllLessonsForCourses(courseIds: string[]): Promise<Map<string, LessonDuration[]>> {
    const result = new Map<string, LessonDuration[]>();
    
    for (const courseId of courseIds) {
      const lessons = await this.getCourseLessons(courseId);
      const durations: LessonDuration[] = [];
      
      for (const lesson of lessons) {
        const duration = await this.calculateLessonDuration(lesson.lessonId);
        if (duration) {
          durations.push(duration);
        }
      }
      
      result.set(courseId, durations);
    }
    
    return result;
  }

  /**
   * Calcula el tiempo total estimado para completar un curso
   */
  static async calculateCourseTotalTime(courseId: string): Promise<number> {
    const lessons = await this.getCourseLessons(courseId);
    let totalMinutes = 0;
    
    for (const lesson of lessons) {
      const duration = await this.calculateLessonDuration(lesson.lessonId);
      if (duration) {
        totalMinutes += duration.totalMinutes;
      }
    }
    
    return totalMinutes;
  }

  /**
   * Obtiene el tiempo mínimo de una lección (duración de la lección más corta)
   * Esto es importante para validar tiempos mínimos de sesiones
   */
  static async getMinimumLessonTime(courseId: string): Promise<number> {
    const lessons = await this.getCourseLessons(courseId);
    let minTime = Infinity;
    
    for (const lesson of lessons) {
      const duration = await this.calculateLessonDuration(lesson.lessonId);
      if (duration && duration.totalMinutes < minTime) {
        minTime = duration.totalMinutes;
      }
    }
    
    return minTime === Infinity ? 0 : minTime;
  }

  /**
   * Analiza la complejidad de un curso
   */
  static async getCourseComplexity(courseId: string): Promise<CourseComplexity | null> {
    const supabase = await createClient();
    
    // Obtener información básica del curso
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, level, category, duration_total_minutes')
      .eq('id', courseId)
      .single();
    
    if (error || !course) {
      console.error('Error obteniendo curso:', error);
      return null;
    }
    
    // Obtener módulos y lecciones
    const modules = await this.getCourseModules(courseId);
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    
    // Calcular duración total real
    let totalDurationMinutes = 0;
    let lessonCount = 0;
    for (const module of modules) {
      for (const lesson of module.lessons) {
        const duration = await this.calculateLessonDuration(lesson.lessonId);
        if (duration) {
          totalDurationMinutes += duration.totalMinutes;
          lessonCount++;
        }
      }
    }
    
    const averageLessonDuration = lessonCount > 0 ? totalDurationMinutes / lessonCount : 0;
    
    // Calcular puntuación de complejidad (1-10)
    // Basado en nivel, duración y cantidad de contenido
    let complexityScore = 5; // Base
    
    // Ajustar por nivel
    switch (course.level) {
      case 'beginner':
        complexityScore -= 2;
        break;
      case 'intermediate':
        complexityScore += 0;
        break;
      case 'advanced':
        complexityScore += 2;
        break;
    }
    
    // Ajustar por duración promedio de lecciones
    if (averageLessonDuration > 30) complexityScore += 1;
    if (averageLessonDuration > 45) complexityScore += 1;
    if (averageLessonDuration < 15) complexityScore -= 1;
    
    // Ajustar por cantidad de lecciones
    if (totalLessons > 50) complexityScore += 1;
    if (totalLessons > 100) complexityScore += 1;
    if (totalLessons < 10) complexityScore -= 1;
    
    // Limitar a rango 1-10
    complexityScore = Math.max(1, Math.min(10, complexityScore));
    
    // Calcular tiempos recomendados basados en complejidad
    let recommendedSessionMinutes: number;
    let recommendedBreakMinutes: number;
    
    if (complexityScore <= 3) {
      recommendedSessionMinutes = 45;
      recommendedBreakMinutes = 10;
    } else if (complexityScore <= 6) {
      recommendedSessionMinutes = 35;
      recommendedBreakMinutes = 10;
    } else {
      recommendedSessionMinutes = 25;
      recommendedBreakMinutes = 15;
    }
    
    return {
      courseId,
      level: course.level as 'beginner' | 'intermediate' | 'advanced',
      category: course.category,
      totalLessons,
      totalModules: modules.length,
      totalDurationMinutes,
      averageLessonDuration,
      complexityScore,
      recommendedSessionMinutes,
      recommendedBreakMinutes,
    };
  }

  /**
   * Obtiene el progreso del usuario en un curso
   */
  static async getUserCourseProgress(userId: string, courseId: string): Promise<{
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessedAt?: string;
  }> {
    const supabase = await createClient();
    
    // Obtener enrollment
    const { data: enrollment, error } = await supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        progress_percentage,
        completed_lessons_count,
        last_accessed_at,
        courses:course_id (
          id
        )
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();
    
    if (error || !enrollment) {
      return {
        progressPercentage: 0,
        completedLessons: 0,
        totalLessons: 0,
      };
    }
    
    // Obtener total de lecciones
    const lessons = await this.getCourseLessons(courseId);
    
    return {
      progressPercentage: enrollment.progress_percentage || 0,
      completedLessons: enrollment.completed_lessons_count || 0,
      totalLessons: lessons.length,
      lastAccessedAt: enrollment.last_accessed_at,
    };
  }

  /**
   * Obtiene las lecciones pendientes de un usuario en un curso
   */
  static async getPendingLessons(userId: string, courseId: string): Promise<LessonInfo[]> {
    const supabase = await createClient();
    
    // Obtener todas las lecciones del curso
    const allLessons = await this.getCourseLessons(courseId);
    
    // Obtener lecciones completadas
    const { data: completedLessons, error } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('is_completed', true);
    
    if (error) {
      console.error('Error obteniendo progreso de lecciones:', error);
      return allLessons;
    }
    
    const completedIds = new Set((completedLessons || []).map(l => l.lesson_id));
    
    return allLessons.filter(lesson => !completedIds.has(lesson.lessonId));
  }

  /**
   * Sugiere rutas de aprendizaje personalizadas usando LIA
   * (Esta función prepara los datos para que LIA genere las sugerencias)
   */
  static async prepareLearningRouteSuggestionData(
    userId: string,
    courses: CourseInfo[],
    userProfile: {
      rol?: string;
      area?: string;
      nivel?: string;
    }
  ): Promise<{
    courses: CourseInfo[];
    complexities: CourseComplexity[];
    userProfile: typeof userProfile;
  }> {
    // Obtener complejidad de cada curso
    const complexities: CourseComplexity[] = [];
    for (const course of courses) {
      const complexity = await this.getCourseComplexity(course.id);
      if (complexity) {
        complexities.push(complexity);
      }
    }
    
    return {
      courses,
      complexities,
      userProfile,
    };
  }

  /**
   * Obtiene cursos disponibles que el usuario no ha adquirido (para sugerencias B2C)
   */
  static async getAvailableCoursesForSuggestion(
    userId: string,
    category?: string,
    level?: string,
    limit: number = 10
  ): Promise<CourseInfo[]> {
    const supabase = await createClient();
    
    // Obtener IDs de cursos que el usuario ya tiene
    const { data: userCourses } = await supabase
      .from('course_purchases')
      .select('course_id')
      .eq('user_id', userId)
      .eq('access_status', 'active');
    
    const userCourseIds = (userCourses || []).map(c => c.course_id);
    
    // Buscar cursos disponibles
    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        slug,
        category,
        level,
        instructor_id,
        thumbnail_url,
        duration_total_minutes,
        is_active,
        price,
        average_rating,
        student_count
      `)
      .eq('is_active', true)
      .order('average_rating', { ascending: false })
      .limit(limit);
    
    if (userCourseIds.length > 0) {
      query = query.not('id', 'in', `(${userCourseIds.join(',')})`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error obteniendo cursos disponibles:', error);
      return [];
    }
    
    return data.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      category: course.category,
      level: course.level as 'beginner' | 'intermediate' | 'advanced',
      instructorId: course.instructor_id,
      thumbnailUrl: course.thumbnail_url,
      durationTotalMinutes: course.duration_total_minutes,
      isActive: course.is_active,
      price: course.price,
      averageRating: course.average_rating,
      studentCount: course.student_count,
    }));
  }

  /**
   * Calcula el tiempo restante para completar un curso
   */
  static async calculateRemainingTime(userId: string, courseId: string): Promise<{
    totalRemainingMinutes: number;
    remainingLessons: number;
    estimatedSessionsNeeded: number;
  }> {
    const pendingLessons = await this.getPendingLessons(userId, courseId);
    
    let totalRemainingMinutes = 0;
    for (const lesson of pendingLessons) {
      const duration = await this.calculateLessonDuration(lesson.lessonId);
      if (duration) {
        totalRemainingMinutes += duration.totalMinutes;
      }
    }
    
    // Estimar sesiones necesarias (asumiendo sesiones de 30 min promedio)
    const estimatedSessionsNeeded = Math.ceil(totalRemainingMinutes / 30);
    
    return {
      totalRemainingMinutes,
      remainingLessons: pendingLessons.length,
      estimatedSessionsNeeded,
    };
  }

  /**
   * Obtiene estadísticas de tiempo de estudio del usuario
   */
  static async getUserStudyStats(userId: string): Promise<{
    totalStudyMinutes: number;
    totalSessionsCompleted: number;
    averageSessionMinutes: number;
    currentStreak: number;
    longestStreak: number;
  }> {
    const supabase = await createClient();
    
    const { data: streaks, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !streaks) {
      return {
        totalStudyMinutes: 0,
        totalSessionsCompleted: 0,
        averageSessionMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
    
    const averageSessionMinutes = streaks.total_sessions_completed > 0
      ? streaks.total_study_minutes / streaks.total_sessions_completed
      : 0;
    
    return {
      totalStudyMinutes: streaks.total_study_minutes || 0,
      totalSessionsCompleted: streaks.total_sessions_completed || 0,
      averageSessionMinutes,
      currentStreak: streaks.current_streak || 0,
      longestStreak: streaks.longest_streak || 0,
    };
  }
}

