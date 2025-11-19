'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenerationMode } from '@/lib/supabase/study-planner-types'
import { CourseForSelection } from '@/features/study-planner/types/manual-wizard.types'
import { ManualPlanWizard, AIWizard, ModeSelectionModal } from '@/features/study-planner/components'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/features/auth/hooks/useAuth'

export default function CreateStudyPlanPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModeSelector, setShowModeSelector] = useState(true)
  const [selectedMode, setSelectedMode] = useState<GenerationMode | null>(null)
  const [availableCourses, setAvailableCourses] = useState<CourseForSelection[]>([])

  // =====================================================
  // Fetch Available Courses
  // =====================================================

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return
    }

    const fetchCourses = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Check if user is authenticated
        if (!user) {
          throw new Error('Debes iniciar sesión para crear un plan de estudio')
        }

        const supabase = createClient()

        // Fetch courses with progress using course_purchases and enrollments
        const { data: purchases, error: purchasesError } = await supabase
          .from('course_purchases')
          .select(
            `
            course_id,
            access_status,
            courses!inner (
              id,
              title,
              level,
              category,
              thumbnail_url,
              course_modules (
                course_lessons (
                  lesson_id
                )
              )
            ),
            user_course_enrollments (
              enrollment_status,
              overall_progress_percentage
            )
          `
          )
          .eq('user_id', user.id)
          .eq('access_status', 'active')

        if (purchasesError) {
          console.error('Error fetching course purchases:', purchasesError)
          throw new Error(
            purchasesError.message || 
            purchasesError.details || 
            'Error al cargar tus cursos. Por favor, intenta de nuevo.'
          )
        }

        if (!purchases || purchases.length === 0) {
          setError('No tienes cursos inscritos. Inscríbete en un curso primero.')
          setIsLoading(false)
          return
        }

        // Transform to CourseForSelection format
        const courses: CourseForSelection[] = await Promise.all(
          purchases.map(async (purchase: any) => {
            const course = purchase.courses
            const enrollment = purchase.user_course_enrollments?.[0] || {}
            
            // Flatten lessons from all modules
            const allLessons = course.course_modules?.flatMap(
              (module: any) => module.course_lessons || []
            ) || []

            // Get lesson time estimates
            let lessonTimes: any[] = []
            if (allLessons.length > 0) {
              const { data: timesData, error: timesError } = await supabase
                .from('lesson_time_estimates')
                .select('lesson_id, total_time_minutes')
                .in(
                  'lesson_id',
                  allLessons.map((l: any) => l.lesson_id)
                )

              if (timesError) {
                console.error('Error fetching lesson times:', timesError)
              } else {
                lessonTimes = timesData || []
              }
            }

            const totalLessons = allLessons.length
            const progressPercentage = enrollment.overall_progress_percentage || 0
            const completedLessons = Math.round((progressPercentage / 100) * totalLessons)
            const totalTimeMinutes =
              lessonTimes.reduce((sum: number, lt: any) => sum + (lt.total_time_minutes || 0), 0) ||
              totalLessons * 45 // Fallback: 45 min per lesson

            return {
              id: course.id,
              title: course.title,
              level: course.level || 'intermediate',
              category: course.category || 'ia',
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              estimated_total_time_minutes: totalTimeMinutes,
              thumbnail_url: course.thumbnail_url,
            }
          })
        )

        setAvailableCourses(courses)
      } catch (err) {
        console.error('Error fetching courses:', err)
        
        // Extract error message from various error types
        let errorMessage = 'Error al cargar cursos'
        
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (err && typeof err === 'object') {
          // Handle Supabase errors
          const supabaseError = err as any
          if (supabaseError.message) {
            errorMessage = supabaseError.message
          } else if (supabaseError.details) {
            errorMessage = supabaseError.details
          } else if (supabaseError.hint) {
            errorMessage = supabaseError.hint
          } else if (typeof supabaseError === 'string') {
            errorMessage = supabaseError
          }
        }
        
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [user, authLoading])

  // =====================================================
  // Mode Selection
  // =====================================================

  const handleModeSelect = (mode: GenerationMode) => {
    setSelectedMode(mode)
    setShowModeSelector(false)
  }

  // =====================================================
  // Plan Creation Complete
  // =====================================================

  const handlePlanComplete = (planId: string) => {
    // Redirect to plan view
    router.push(`/study-planner/plans/${planId}`)
  }

  // =====================================================
  // Cancel
  // =====================================================

  const handleCancel = () => {
    router.push('/study-planner')
  }

  // =====================================================
  // Render
  // =====================================================

  // Show loading while checking authentication
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando tus cursos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/courses')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Ver Cursos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Crear Plan de Estudio
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedMode === 'manual'
                  ? 'Configura tu plan manualmente'
                  : selectedMode === 'ai_generated'
                    ? 'La IA creará un plan optimizado para ti'
                    : 'Configura tu plan de estudio personalizado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedMode === 'manual' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <ManualPlanWizard
              available_courses={availableCourses}
              onComplete={handlePlanComplete}
              onCancel={handleCancel}
            />
          </div>
        ) : selectedMode === 'ai_generated' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
            <AIWizard
              available_courses={availableCourses}
              onComplete={handlePlanComplete}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Selecciona un modo para comenzar...
            </p>
          </div>
        )}
      </div>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={showModeSelector}
        onSelect={handleModeSelect}
        onClose={handleCancel}
      />
    </div>
  )
}
