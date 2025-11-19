'use client'

import { useState } from 'react'
import { CourseForSelection, SelectedCourse } from '../types/manual-wizard.types'
import { ComplexityBadge } from './ComplexityBadge'
import { formatTimeEstimate, createCourseComplexity, CourseLevel, CourseCategory } from '@/lib/supabase/study-planner-types'

interface CourseSelectorProps {
  available_courses: CourseForSelection[]
  selected_courses: SelectedCourse[]
  onChange: (selected: SelectedCourse[]) => void
  className?: string
}

export function CourseSelector({
  available_courses,
  selected_courses,
  onChange,
  className = '',
}: CourseSelectorProps) {
  const [search, setSearch] = useState('')

  const handleToggleCourse = (course: CourseForSelection) => {
    const isSelected = selected_courses.some((c) => c.course_id === course.id)

    if (isSelected) {
      // Remove course
      onChange(selected_courses.filter((c) => c.course_id !== course.id))
    } else {
      // Add course
      const complexity = createCourseComplexity(
        course.level as CourseLevel,
        course.category as CourseCategory
      )

      const newCourse: SelectedCourse = {
        course_id: course.id,
        course_title: course.title,
        lessons_to_include: [], // Will be populated with all pending lessons
        total_time_minutes: course.estimated_total_time_minutes,
        complexity_multiplier: complexity.complexity_multiplier,
      }

      onChange([...selected_courses, newCourse])
    }
  }

  const filteredCourses = available_courses.filter((course) =>
    course.title.toLowerCase().includes(search.toLowerCase())
  )

  const selectedCount = selected_courses.length
  const totalEstimatedTime = selected_courses.reduce(
    (sum, course) => sum + course.total_time_minutes,
    0
  )

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Selecciona tus Cursos
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige los cursos que quieres incluir en tu plan de estudio personalizado
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Selected Summary */}
      {selectedCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {selectedCount} curso{selectedCount !== 1 ? 's' : ''} seleccionado
                {selectedCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Tiempo total estimado: {formatTimeEstimate(totalEstimatedTime)}
              </p>
            </div>
            <button
              onClick={() => onChange([])}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      )}

      {/* Course List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {search ? 'No se encontraron cursos' : 'No hay cursos disponibles'}
            </p>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const isSelected = selected_courses.some((c) => c.course_id === course.id)
            const complexity = createCourseComplexity(
              course.level as CourseLevel,
              course.category as CourseCategory
            )
            const progressPercentage = Math.round(
              (course.completed_lessons / course.total_lessons) * 100
            )

            return (
              <button
                key={course.id}
                onClick={() => handleToggleCourse(course)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div className="mt-1">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {course.title}
                    </h4>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center gap-1">
                        📚 {course.total_lessons} lecciones
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {formatTimeEstimate(course.estimated_total_time_minutes)}
                      </span>
                      {course.completed_lessons > 0 && (
                        <span className="flex items-center gap-1">
                          ✅ {progressPercentage}% completado
                        </span>
                      )}
                    </div>

                    {/* Complexity Badge */}
                    <ComplexityBadge complexity={complexity} size="sm" />
                  </div>
                </div>

                {/* Progress Bar */}
                {course.completed_lessons > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progreso del curso</span>
                      <span>
                        {course.completed_lessons}/{course.total_lessons}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* Info Message */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">
              Sugerencia
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Selecciona 1-3 cursos para un plan balanceado. El sistema distribuirá las lecciones
              de manera óptima según tu disponibilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
