'use client'

import Image from 'next/image'
import { Award, Play, BookOpen, CheckCircle2 } from 'lucide-react'

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

interface CourseCard3DProps {
  course: AssignedCourse
  index: number
  onClick: () => void
  onCertificateClick?: () => void
  styles?: any
}

/**
 * CourseCard3D - Simplified course card without heavy 3D animations
 * Uses CSS transitions for hover effects instead of Framer Motion
 */
export function CourseCard3D({
  course,
  index,
  onClick,
  onCertificateClick,
  styles
}: CourseCard3DProps) {
  const primaryColor = styles?.primary_button_color || '#0A2540'
  const accentColor = styles?.accent_color || '#00D4B3'

  const getStatusColor = () => {
    switch (course.status) {
      case 'Completado':
        return 'from-green-500 to-emerald-500'
      case 'En progreso':
        return 'from-blue-500 to-cyan-500'
      default:
        return 'from-gray-500 to-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (course.status) {
      case 'Completado':
        return <CheckCircle2 className="w-4 h-4" />
      case 'En progreso':
        return <Play className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/10 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl"
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        animationDelay: `${index * 100}ms`
      }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        {/* Status badge */}
        <div 
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor()}`}
        >
          {getStatusIcon()}
          {course.status}
        </div>

        {/* Certificate button */}
        {course.has_certificate && course.progress === 100 && onCertificateClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCertificateClick()
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-yellow-500/90 text-white transition-all duration-200 hover:scale-110 hover:bg-yellow-500"
          >
            <Award className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-gray-400 mb-4">{course.instructor}</p>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Progreso</span>
            <span className="text-xs font-medium" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${course.progress}%`,
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
              }}
            />
          </div>
        </div>

        {/* Due date */}
        {course.due_date && (
          <p className="text-xs text-gray-500 mt-3">
            Fecha límite: {new Date(course.due_date).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Border gradient */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}40, transparent, ${accentColor}25)`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />
    </div>
  )
}
