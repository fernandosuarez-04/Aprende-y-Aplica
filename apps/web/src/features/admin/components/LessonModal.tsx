'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  UserCircleIcon,
  VideoCameraIcon,
  DocumentTextIcon,
  PlayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { AdminLesson } from '../services/adminLessons.service'
import { VideoProviderSelector } from './VideoProviderSelector'

// Componente de Select personalizado para Instructor
function InstructorSelect({ 
  value, 
  onChange, 
  instructors 
}: { 
  value: string
  onChange: (value: string) => void
  instructors: Array<{ id: string, name: string }>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedInstructor = instructors.find(i => i.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Calcular posición del dropdown
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="group" ref={selectRef}>
      <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
        Instructor *
      </label>
      <div className="relative">
        <motion.button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white transition-all duration-200 flex items-center justify-between ${
            isOpen
              ? 'border-[#00D4B3] ring-2 ring-[#00D4B3]/40'
              : 'border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#00D4B3]/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <UserCircleIcon className={`h-4 w-4 transition-colors ${
              isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
            }`} />
            <span className="font-medium">
              {selectedInstructor ? selectedInstructor.name : 'Seleccionar instructor...'}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className={`h-4 w-4 transition-colors ${
              isOpen ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
            }`} />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55]"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed z-[60] bg-white dark:bg-[#1E2329] rounded-xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 overflow-hidden max-h-[300px] overflow-y-auto"
                style={{
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`
                }}
              >
                <div className="p-1.5">
                  {instructors.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[#6C757D] dark:text-white/60 text-center">
                      No hay instructores disponibles
                    </div>
                  ) : (
                    instructors.map((instructor, index) => {
                      const isSelected = instructor.id === value
                      
                      return (
                        <motion.button
                          key={instructor.id}
                          type="button"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 4, backgroundColor: isSelected ? undefined : 'rgba(0, 212, 179, 0.1)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onChange(instructor.id)
                            setIsOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                            isSelected
                              ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3]'
                              : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#00D4B3]/20'
                                : 'bg-[#E9ECEF] dark:bg-[#0A0D12]'
                            }`}>
                              <UserCircleIcon className={`h-4 w-4 ${
                                isSelected ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
                              }`} />
                            </div>
                            <span className="font-medium">{instructor.name}</span>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            >
                              <CheckCircleIcon className="h-5 w-5 text-[#00D4B3]" />
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface LessonModalProps {
  lesson?: AdminLesson | null
  moduleId: string
  onClose: () => void
  onSave: (data: any) => Promise<void>
  instructors?: Array<{ id: string, name: string }>
}

type TabType = 'basic' | 'video' | 'content'

export function LessonModal({ lesson, moduleId, onClose, onSave, instructors = [] }: LessonModalProps) {
  const [formData, setFormData] = useState({
    lesson_title: '',
    lesson_description: '',
    video_provider_id: '',
    video_provider: 'youtube' as 'youtube' | 'vimeo' | 'direct' | 'custom',
    duration_seconds: 0,
    transcript_content: '',
    summary_content: '',
    is_published: false,
    instructor_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [durationAutoDetected, setDurationAutoDetected] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  useEffect(() => {
    if (lesson) {
      setFormData({
        lesson_title: lesson.lesson_title,
        lesson_description: lesson.lesson_description || '',
        video_provider_id: lesson.video_provider_id,
        video_provider: lesson.video_provider,
        duration_seconds: lesson.duration_seconds,
        transcript_content: lesson.transcript_content || '',
        summary_content: lesson.summary_content || '',
        is_published: lesson.is_published,
        instructor_id: lesson.instructor_id
      })
      setActiveTab('basic')
    } else {
      if (instructors.length > 0 && !formData.instructor_id) {
        setFormData(prev => ({ ...prev, instructor_id: instructors[0].id }))
      }
    }
    setError(null)
  }, [lesson, instructors])

  const handleGenerateAI = async () => {
    // Validar que haya un video válido para analizar
    const canAnalyze = (formData.video_provider === 'direct' || formData.video_provider === 'custom') && 
                       formData.video_provider_id && 
                       formData.video_provider_id.startsWith('http')

    if (!canAnalyze) {
      setError('Debes subir un video o proporcionar una URL válida primero (proveedor: Directo o Custom).')
      return
    }

    setGeneratingAI(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/ai/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl: formData.video_provider_id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el video con IA')
      }

      setFormData(prev => ({
        ...prev,
        transcript_content: data.transcript,
        summary_content: data.summary
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar contenido con IA')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.instructor_id) {
      setError('Debe seleccionar un instructor')
      return
    }

    if (!formData.duration_seconds || formData.duration_seconds <= 0) {
      setError('La duración debe ser mayor a 0 segundos')
      return
    }

    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al guardar la lección'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseDuration = (duration: string) => {
    const [mins, secs] = duration.split(':').map(Number)
    return (mins * 60) + (secs || 0)
  }

  const tabs: { id: TabType; label: string; icon: typeof AcademicCapIcon }[] = [
    { id: 'basic', label: 'Básica', icon: AcademicCapIcon },
    { id: 'video', label: 'Video', icon: VideoCameraIcon },
    { id: 'content', label: 'Contenido', icon: DocumentTextIcon }
  ]

  return (
    <AnimatePresence>
      {true && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E9ECEF] dark:border-[#6C757D]/30 max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header Compacto */}
                <div className="relative bg-gradient-to-r from-[#0A2540] to-[#0A2540]/90 dark:from-[#0A2540] dark:to-[#0A2540]/80 px-6 py-4 border-b border-[#0A2540]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00D4B3]/20 flex items-center justify-center">
                        <AcademicCapIcon className="h-5 w-5 text-[#00D4B3]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {lesson ? 'Editar Lección' : 'Crear Lección'}
                        </h3>
                        <p className="text-xs text-white/70">
                          {lesson ? 'Modifica la información de la lección' : 'Agrega una nueva lección al módulo'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 px-6 py-3 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] border-b border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-[#00D4B3] bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20'
                            : 'text-[#6C757D] dark:text-white/60 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 rounded-xl bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 -z-10"
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                  <div className="p-6">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 dark:border-red-500/30 rounded-xl"
                      >
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                      </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                      {/* Tab: Básica */}
                      {activeTab === 'basic' && (
                        <motion.div
                          key="basic"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <div className="group">
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Título de la Lección *
                            </label>
                            <div className="relative">
                              <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60 group-focus-within:text-[#00D4B3] transition-colors" />
                              <input
                                type="text"
                                required
                                value={formData.lesson_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, lesson_title: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200"
                                placeholder="Ej: Introducción al Machine Learning"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Descripción
                            </label>
                            <textarea
                              rows={3}
                              value={formData.lesson_description}
                              onChange={(e) => setFormData(prev => ({ ...prev, lesson_description: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Descripción de la lección..."
                            />
                          </div>

                          <InstructorSelect
                            value={formData.instructor_id}
                            onChange={(id) => setFormData(prev => ({ ...prev, instructor_id: id }))}
                            instructors={instructors}
                          />

                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-4 bg-[#E9ECEF]/50 dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30"
                          >
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.is_published}
                                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                                  className="sr-only"
                                />
                                <motion.div
                                  animate={{
                                    backgroundColor: formData.is_published ? '#00D4B3' : '#E9ECEF',
                                    borderColor: formData.is_published ? '#00D4B3' : '#E9ECEF'
                                  }}
                                  className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200"
                                >
                                  {formData.is_published && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    >
                                      <CheckCircleIcon className="h-4 w-4 text-white" />
                                    </motion.div>
                                  )}
                                </motion.div>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-[#0A2540] dark:text-white">
                                  Publicado
                                </span>
                                <p className="text-xs text-[#6C757D] dark:text-white/60 mt-0.5">
                                  Visible para los estudiantes
                                </p>
                              </div>
                            </label>
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Tab: Video */}
                      {activeTab === 'video' && (
                        <motion.div
                          key="video"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          <VideoProviderSelector
                            provider={formData.video_provider}
                            videoProviderId={formData.video_provider_id}
                            onProviderChange={(provider) => {
                              setFormData(prev => ({ ...prev, video_provider: provider }))
                              setDurationAutoDetected(false)
                            }}
                            onVideoIdChange={(id) => {
                              setFormData(prev => ({ ...prev, video_provider_id: id }))
                              setDurationAutoDetected(false)
                            }}
                            onDurationChange={(durationSeconds) => {
                              if (durationSeconds && durationSeconds > 0) {
                                setFormData(prev => ({ ...prev, duration_seconds: durationSeconds }))
                                setDurationAutoDetected(true)
                              }
                            }}
                          />

                          <div className="group">
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 uppercase tracking-wide">
                                Duración (mm:ss) *
                              </label>
                              {durationAutoDetected && (
                                <span className="text-xs text-[#10B981] dark:text-[#10B981] font-medium">
                                  ✓ Detectada automáticamente
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6C757D] dark:text-white/60" />
                              <input
                                type="text"
                                value={formatDuration(formData.duration_seconds)}
                                onChange={(e) => {
                                  const seconds = parseDuration(e.target.value)
                                  setFormData(prev => ({ ...prev, duration_seconds: seconds }))
                                  if (seconds > 0) {
                                    setDurationAutoDetected(false)
                                  }
                                }}
                                placeholder="10:30"
                                pattern="\d{1,3}:\d{2}"
                                className={`w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0A0D12] border rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 transition-all duration-200 ${
                                  durationAutoDetected 
                                    ? 'border-[#10B981] dark:border-[#10B981] bg-[#10B981]/10 dark:bg-[#10B981]/20 focus:ring-[#10B981]/40' 
                                    : 'border-[#E9ECEF] dark:border-[#6C757D]/30 focus:ring-[#00D4B3]/40 focus:border-transparent'
                                }`}
                              />
                            </div>
                            {durationAutoDetected && (
                              <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">
                                La duración se detectó automáticamente del video. Puedes editarla manualmente si es necesario.
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Tab: Contenido */}
                      {activeTab === 'content' && (
                        <motion.div
                          key="content"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-4"
                        >
                          {/* Banner de IA */}
                          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 border border-purple-500/20 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg text-white">
                                  <SparklesIcon className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-[#0A2540] dark:text-white">Generación Automática</h4>
                                  <p className="text-xs text-[#6C757D] dark:text-white/70">
                                    Analiza el video subido para generar transcripción y resumen automáticamente con Gemini 2.0 Flash.
                                  </p>
                                </div>
                              </div>
                              <motion.button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={generatingAI || !formData.video_provider_id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {generatingAI ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Analizando...</span>
                                  </>
                                ) : (
                                  <>
                                    <SparklesIcon className="h-4 w-4" />
                                    <span>Generar con IA</span>
                                  </>
                                )}
                              </motion.button>
                            </div>
                            {(!formData.video_provider_id || (formData.video_provider !== 'direct' && formData.video_provider !== 'custom')) && (
                              <p className="text-xs text-orange-500 mt-2 ml-1">
                                * Requiere subir un video (Directo) o URL directa (Custom) primero.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Transcripción (Opcional)
                            </label>
                            <textarea
                              rows={4}
                              value={formData.transcript_content}
                              onChange={(e) => setFormData(prev => ({ ...prev, transcript_content: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Transcripción del video..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#6C757D] dark:text-white/70 mb-1.5 uppercase tracking-wide">
                              Resumen (Opcional)
                            </label>
                            <textarea
                              rows={4}
                              value={formData.summary_content}
                              onChange={(e) => setFormData(prev => ({ ...prev, summary_content: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl text-[#0A2540] dark:text-white placeholder-[#6C757D] dark:placeholder-white/60 focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all duration-200 resize-none"
                              placeholder="Resumen del contenido del video..."
                            />
                            <p className="mt-1 text-xs text-[#6C757D] dark:text-white/60">
                              Resumen breve del contenido de la lección. Se mostrará en la pestaña "Resumen" del curso.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-[#E9ECEF]/30 dark:bg-[#0A0D12] border-t border-[#E9ECEF] dark:border-[#6C757D]/30 flex items-center justify-end gap-3">
                    <motion.button
                      type="button"
                      onClick={onClose}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 text-[#6C757D] dark:text-white/70 bg-white dark:bg-[#1E2329] hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 rounded-xl text-sm font-medium transition-colors duration-200 border border-[#E9ECEF] dark:border-[#6C757D]/30"
                      disabled={loading}
                    >
                      Cancelar
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-2.5 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/20 flex items-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Guardar</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
