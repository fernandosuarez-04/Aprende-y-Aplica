/**
 * AI Plan Service
 * Handles AI-powered study plan generation
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  GenerateAIPlanRequest,
  GenerateAIPlanResponse,
  GenerateAIPreviewRequest,
  GenerateAIPreviewResponse,
  AIPlanPreview,
  AIGenerationMetadata,
  AIOptimizationInsight,
  PreviewSession,
} from './ai-wizard.types'
import { AIDistributionAlgorithm } from './ai-distribution.algorithm'
import { createCourseComplexity, CourseComplexity } from './study-planner-types'

interface LessonWithMetadata {
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
  estimated_time_minutes: number
  complexity: CourseComplexity
  module_index: number
  lesson_index: number
}

export class AIPlanService {
  /**
   * Generate preview of AI-powered plan
   */
  static async generatePreview(
    request: GenerateAIPreviewRequest,
    supabase: SupabaseClient,
    userId: string
  ): Promise<GenerateAIPreviewResponse> {
    try {
      // 1. Fetch lessons with metadata
      const lessonsWithMetadata = await this.fetchLessonsWithMetadata(
        request.selected_courses,
        supabase
      )

      if (lessonsWithMetadata.length === 0) {
        return {
          success: false,
          preview: {} as AIPlanPreview,
          errors: ['No se encontraron lecciones para los cursos seleccionados'],
        }
      }

      // 2. Prepare distribution config
      const distributionConfig = {
        learning_pace: request.goals.learning_pace,
        priority_focus: request.goals.priority_focus,
        target_completion_date: request.goals.target_completion_date,
        daily_minutes: request.availability.daily_minutes,
        study_days: request.availability.study_days,
        time_slots: request.availability.time_slots,
        session_type: request.preferences.session_type_preference,
        review_strategy: request.preferences.review_strategy,
        content_ordering: request.preferences.content_ordering,
        enable_pomodoro: request.preferences.enable_pomodoro,
      }

      // 3. Generate sessions using AI algorithm
      const startDate = new Date()
      const sessions = AIDistributionAlgorithm.distributeSessionsWithAI(
        lessonsWithMetadata,
        distributionConfig,
        startDate
      )

      // 4. Group sessions
      const sessionsByWeek = this.groupSessionsByWeek(sessions, startDate)
      const sessionsByCourse = this.groupSessionsByCourse(sessions)

      // 5. Calculate metadata and scores
      const aiMetadata = this.generateAIMetadata(
        request,
        sessions,
        lessonsWithMetadata
      )

      // 6. Generate insights
      const insights = this.generateInsights(
        request,
        sessions,
        aiMetadata
      )

      // 7. Calculate totals
      const totalSessions = sessions.length
      const totalStudyHours = sessions.reduce(
        (sum, s) => sum + s.duration_minutes,
        0
      ) / 60
      const estimatedCompletionDate = sessions.length > 0
        ? sessions[sessions.length - 1].date
        : new Date()

      const preview: AIPlanPreview = {
        plan_name: `Plan IA - ${request.goals.primary_goal}`,
        total_sessions: totalSessions,
        total_study_hours: totalStudyHours,
        estimated_completion_date: estimatedCompletionDate,
        sessions_by_week: sessionsByWeek,
        sessions_by_course: sessionsByCourse,
        ai_metadata: aiMetadata,
        insights,
      }

      return {
        success: true,
        preview,
      }
    } catch (error) {
      console.error('Error generating AI preview:', error)
      return {
        success: false,
        preview: {} as AIPlanPreview,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }
    }
  }

  /**
   * Create AI-powered plan
   */
  static async createAIPlan(
    request: GenerateAIPlanRequest,
    supabase: SupabaseClient,
    userId: string
  ): Promise<GenerateAIPlanResponse> {
    try {
      // 1. Generate preview first
      const previewRequest: GenerateAIPreviewRequest = {
        goals: request.goals,
        availability: request.availability,
        preferences: request.preferences,
        selected_courses: request.selected_courses,
      }

      const previewResponse = await this.generatePreview(
        previewRequest,
        supabase,
        userId
      )

      if (!previewResponse.success || !previewResponse.preview) {
        return {
          success: false,
          plan_id: '',
          sessions_created: 0,
          ai_metadata: {} as AIGenerationMetadata,
          message: 'Error al generar plan',
          errors: previewResponse.errors,
        }
      }

      const preview = previewResponse.preview

      // 2. Create plan in database
      const { data: plan, error: planError } = await supabase
        .from('study_plans')
        .insert({
          user_id: userId,
          name: preview.plan_name,
          is_active: true,
          generation_mode: 'ai_generated',
          preferred_session_type: request.preferences.session_type_preference,
          ai_generation_metadata: preview.ai_metadata,
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (planError || !plan) {
        throw new Error('Error al crear plan: ' + planError?.message)
      }

      const planId = plan.id

      // 3. Create sessions
      const allSessions = Array.from(preview.sessions_by_week.values()).flat()
      const sessionsToInsert = allSessions.map((session) => ({
        plan_id: planId,
        lesson_id: session.lesson_id,
        scheduled_date: session.date.toISOString(),
        duration_minutes: session.duration_minutes,
        session_type: request.preferences.session_type_preference,
        status: 'pending',
        is_ai_generated: true,
      }))

      const { error: sessionsError } = await supabase
        .from('study_sessions')
        .insert(sessionsToInsert)

      if (sessionsError) {
        throw new Error('Error al crear sesiones: ' + sessionsError.message)
      }

      return {
        success: true,
        plan_id: planId,
        sessions_created: sessionsToInsert.length,
        ai_metadata: preview.ai_metadata,
        message: `Plan IA creado exitosamente con ${sessionsToInsert.length} sesiones`,
      }
    } catch (error) {
      console.error('Error creating AI plan:', error)
      return {
        success: false,
        plan_id: '',
        sessions_created: 0,
        ai_metadata: {} as AIGenerationMetadata,
        message: 'Error al crear el plan',
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
      }
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private static async fetchLessonsWithMetadata(
    selectedCourses: GenerateAIPlanRequest['selected_courses'],
    supabase: SupabaseClient
  ): Promise<LessonWithMetadata[]> {
    const lessons: LessonWithMetadata[] = []

    for (const courseSelection of selectedCourses) {
      // Get course info
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, level, category')
        .eq('id', courseSelection.course_id)
        .single()

      if (courseError || !course) continue

      // Get modules
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id, module_order_index')
        .eq('course_id', courseSelection.course_id)
        .order('module_order_index', { ascending: true })

      if (modulesError || !modules || modules.length === 0) continue

      // Get lessons
      const moduleIds = modules.map((m: any) => m.module_id)
      const { data: courseLessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, lesson_title, module_id, lesson_order_index')
        .in('module_id', moduleIds)
        .order('lesson_order_index', { ascending: true })

      if (lessonsError || !courseLessons) continue

      // Get time estimates
      const lessonIds = courseLessons.map((l: any) => l.lesson_id)
      const { data: timeEstimates } = await supabase
        .from('lesson_time_estimates')
        .select('lesson_id, total_time_minutes')
        .in('lesson_id', lessonIds)

      // Build lessons with metadata
      const complexity = createCourseComplexity(
        course.level || 'intermediate',
        course.category || 'practical'
      )

      for (const lesson of courseLessons) {
        const module = modules.find((m: any) => m.module_id === lesson.module_id)
        const timeEst = timeEstimates?.find((t: any) => t.lesson_id === lesson.lesson_id)

        lessons.push({
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          course_id: courseSelection.course_id,
          course_title: course.title,
          estimated_time_minutes: timeEst?.total_time_minutes || 45,
          complexity,
          module_index: module?.module_order_index || 0,
          lesson_index: lesson.lesson_order_index || 0,
        })
      }
    }

    return lessons
  }

  private static groupSessionsByWeek(
    sessions: PreviewSession[],
    startDate: Date
  ): Map<number, PreviewSession[]> {
    const sessionsByWeek = new Map<number, PreviewSession[]>()

    for (const session of sessions) {
      const diffTime = session.date.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const weekNumber = Math.floor(diffDays / 7) + 1

      if (!sessionsByWeek.has(weekNumber)) {
        sessionsByWeek.set(weekNumber, [])
      }
      sessionsByWeek.get(weekNumber)!.push(session)
    }

    return sessionsByWeek
  }

  private static groupSessionsByCourse(
    sessions: PreviewSession[]
  ): Map<string, PreviewSession[]> {
    const sessionsByCourse = new Map<string, PreviewSession[]>()

    for (const session of sessions) {
      if (!sessionsByCourse.has(session.course_id)) {
        sessionsByCourse.set(session.course_id, [])
      }
      sessionsByCourse.get(session.course_id)!.push(session)
    }

    return sessionsByCourse
  }

  private static generateAIMetadata(
    request: GenerateAIPreviewRequest,
    sessions: PreviewSession[],
    lessons: LessonWithMetadata[]
  ): AIGenerationMetadata {
    // Calculate optimization scores
    const retentionScore = this.calculateRetentionScore(request, sessions)
    const completionScore = this.calculateCompletionScore(request, sessions, lessons)
    const balanceScore = (retentionScore + completionScore) / 2

    // Identify techniques applied
    const techniques: string[] = []
    if (request.preferences.review_strategy === 'spaced_repetition') {
      techniques.push('spaced_repetition')
    }
    if (request.preferences.content_ordering === 'interleaved') {
      techniques.push('interleaving')
    }
    if (request.preferences.enable_pomodoro) {
      techniques.push('pomodoro')
    }
    techniques.push('load_balancing', 'complexity_adaptation')

    return {
      algorithm_version: '1.0.0',
      generation_timestamp: new Date().toISOString(),
      goals: request.goals,
      availability: request.availability,
      preferences: request.preferences,
      scores: {
        retention_score: Math.round(retentionScore),
        completion_score: Math.round(completionScore),
        balance_score: Math.round(balanceScore),
      },
      techniques_applied: techniques,
      reasoning: this.generateReasoning(request, sessions),
    }
  }

  private static calculateRetentionScore(
    request: GenerateAIPreviewRequest,
    sessions: PreviewSession[]
  ): number {
    let score = 50 // Base score

    // Bonus for spaced repetition
    if (request.preferences.review_strategy === 'spaced_repetition') {
      score += 30
    }

    // Bonus for interleaving
    if (request.preferences.content_ordering === 'interleaved' ||
        request.preferences.content_ordering === 'ai_optimized') {
      score += 20
    }

    return Math.min(100, score)
  }

  private static calculateCompletionScore(
    request: GenerateAIPreviewRequest,
    sessions: PreviewSession[],
    lessons: LessonWithMetadata[]
  ): number {
    let score = 50 // Base score

    // Bonus for intensive pace
    if (request.goals.learning_pace === 'intensive') {
      score += 30
    } else if (request.goals.learning_pace === 'moderate') {
      score += 15
    }

    // Bonus if has target completion date
    if (request.goals.target_completion_date) {
      score += 20
    }

    return Math.min(100, score)
  }

  private static generateReasoning(
    request: GenerateAIPreviewRequest,
    sessions: PreviewSession[]
  ): string {
    const parts: string[] = []

    parts.push(`Plan generado para objetivo: ${request.goals.primary_goal}`)
    parts.push(`Ritmo ${request.goals.learning_pace} con ${sessions.length} sesiones`)

    if (request.preferences.review_strategy === 'spaced_repetition') {
      parts.push('Incluye repetición espaciada para máxima retención')
    }

    if (request.preferences.content_ordering === 'interleaved') {
      parts.push('Contenido intercalado entre cursos para mejor aprendizaje')
    }

    return parts.join('. ')
  }

  private static generateInsights(
    request: GenerateAIPreviewRequest,
    sessions: PreviewSession[],
    metadata: AIGenerationMetadata
  ): AIOptimizationInsight[] {
    const insights: AIOptimizationInsight[] = []

    // Retention insights
    if (metadata.scores.retention_score >= 80) {
      insights.push({
        type: 'tip',
        category: 'retention',
        message: 'Tu plan está optimizado para máxima retención a largo plazo',
        icon: '🧠',
      })
    }

    // Completion insights
    if (metadata.scores.completion_score >= 80) {
      insights.push({
        type: 'tip',
        category: 'completion',
        message: 'Completarás tus cursos de manera eficiente',
        icon: '🎯',
      })
    }

    // Balance insights
    if (metadata.scores.balance_score >= 70) {
      insights.push({
        type: 'info',
        category: 'balance',
        message: 'Excelente balance entre velocidad y retención',
        icon: '⚖️',
      })
    }

    // Scheduling insights
    const avgSessionsPerWeek = sessions.length / Math.ceil(sessions.length / request.availability.study_days.length)
    if (avgSessionsPerWeek < 3) {
      insights.push({
        type: 'tip',
        category: 'scheduling',
        message: 'Considera estudiar más días por semana para progresar más rápido',
        icon: '📅',
      })
    }

    return insights
  }
}
