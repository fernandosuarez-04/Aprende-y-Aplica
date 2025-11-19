'use client'

import { useState } from 'react'
import { AICourseSelection } from '../types/ai-wizard.types'
import { CourseForSelection } from '../types/manual-wizard.types'
import { ComplexityBadge } from './ComplexityBadge'

interface AICourseSelectorProps {
  available_courses: CourseForSelection[]
  selected_courses: AICourseSelection[]
  onChange: (courses: AICourseSelection[]) => void
  className?: string
}

export function AICourseSelector({
  available_courses,
  selected_courses,
  onChange,
  className = '',
}: AICourseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCourses = available_courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleCourse = (course: CourseForSelection) => {
    const isSelected = selected_courses.some((c) => c.course_id === course.id)

    if (isSelected) {
      onChange(selected_courses.filter((c) => c.course_id !== course.id))
    } else {
      const newCourse: AICourseSelection = {
        course_id: course.id,
        course_title: course.title,
        priority: 'medium',
        include_all_lessons: true,
        specific_lessons: [],
      }
      onChange([...selected_courses, newCourse])
    }
  }

  const handlePriorityChange = (courseId: string, priority: 'high' | 'medium' | 'low') => {
    onChange(
      selected_courses.map((c) => (c.course_id === courseId ? { ...c, priority } : c))
    )
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    const colors = {
      high: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
      medium:
        'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
      low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    }
    return colors[priority]
  }

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low'): string => {
    const labels = {
      high: 'Alta Prioridad',
      medium: 'Prioridad Media',
      low: 'Baja Prioridad',
    }
    return labels[priority]
  }

  const totalTimeMinutes = selected_courses.reduce((sum, selection) => {
    const course = available_courses.find((c) => c.id === selection.course_id)
    return sum + (course?.estimated_total_time_minutes || 0)
  }, 0)

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Selecciona tus Cursos
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige qué cursos incluir y establece prioridades. La IA organizará el contenido de forma
          óptima.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-4 mb-6">
        {filteredCourses.map((course) => {
          const selection = selected_courses.find((c) => c.course_id === course.id)
          const isSelected = !!selection

          return (
            <div
              key={course.id}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleCourse(course)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />

                {/* Thumbnail */}
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {course.title}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      {course.level}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                      {course.category}
                    </span>
                    {course.complexity_multiplier && (
                      <ComplexityBadge
                        level={course.level as any}
                        category={course.category as any}
                        variant="simple"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{course.total_lessons} lecciones</span>
                    <span>•</span>
                    <span>
                      {Math.round(course.estimated_total_time_minutes / 60)}h{' '}
                      {course.estimated_total_time_minutes % 60}m
                    </span>
                    <span>•</span>
                    <span>
                      {Math.round(
                        (course.completed_lessons / course.total_lessons) * 100
                      )}
                      % completado
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                      style={{
                        width: `${(course.completed_lessons / course.total_lessons) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Priority Selector (only if selected) */}
              {isSelected && selection && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prioridad de este curso:
                  </label>
                  <div className="flex gap-2">
                    {(['high', 'medium', 'low'] as const).map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => handlePriorityChange(course.id, priority)}
                        className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                          selection.priority === priority
                            ? getPriorityColor(priority)
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {getPriorityLabel(priority)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {selection.priority === 'high' &&
                      'La IA priorizará este curso al inicio del plan'}
                    {selection.priority === 'medium' &&
                      'Este curso se distribuirá de forma balanceada'}
                    {selection.priority === 'low' &&
                      'Este curso se programará después de los prioritarios'}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No se encontraron cursos</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {selected_courses.length > 0 && (
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">
                {selected_courses.length} curso{selected_courses.length !== 1 ? 's' : ''}{' '}
                seleccionado{selected_courses.length !== 1 ? 's' : ''}
              </p>
              <div className="text-xs text-green-700 dark:text-green-300">
                <p>
                  Tiempo total estimado:{' '}
                  <span className="font-semibold">
                    {Math.floor(totalTimeMinutes / 60)}h {totalTimeMinutes % 60}m
                  </span>
                </p>
                <p className="mt-1">
                  Prioridades:{' '}
                  {selected_courses.filter((c) => c.priority === 'high').length} alta,{' '}
                  {selected_courses.filter((c) => c.priority === 'medium').length} media,{' '}
                  {selected_courses.filter((c) => c.priority === 'low').length} baja
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              Sobre las prioridades
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              La IA distribuirá inteligentemente tu contenido según las prioridades. Los cursos de
              alta prioridad se programarán primero, pero la IA puede intercalarlos con otros para
              optimizar el aprendizaje.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
