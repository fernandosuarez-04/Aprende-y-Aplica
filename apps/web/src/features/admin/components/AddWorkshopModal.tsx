'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { ImageUploadCourse } from '../../instructor/components/ImageUploadCourse'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

export function AddWorkshopModal({ isOpen, onClose, onSave }: AddWorkshopModalProps) {
  const fieldStyles = {
    container: "group",
    label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
    inputContainer: "relative",
    icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400",
    input: "w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white",
    inputNoIcon: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white",
    textarea: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 60,
    thumbnail_url: '',
    slug: '',
    price: 0,
    instructor_id: '',
    is_active: true,
    learning_objectives: []
  })
  const [instructors, setInstructors] = useState<Array<{ id: string; name: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        category: 'ia',
        level: 'beginner',
        duration_total_minutes: 60,
        thumbnail_url: '',
        slug: '',
        price: 0,
        instructor_id: '',
        is_active: true,
        learning_objectives: []
      })
      setErrors({})
      setError(null)
      fetchInstructors()
    }
  }, [isOpen])

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/admin/instructors')
      const data = await response.json()
      if (data.success && data.instructors) {
        setInstructors(data.instructors.map((instructor: any) => ({
          id: instructor.id,
          name: instructor.name
        })))
      }
    } catch (err) {
      // console.error('Error fetching instructors:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))
    
    // Auto-generar slug desde el título
    if (name === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({ ...prev, slug }))
    }
    
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido'
    }
    
    if (!formData.instructor_id) {
      newErrors.instructor_id = 'Debe seleccionar un instructor'
    }
    
    if (formData.duration_total_minutes <= 0) {
      newErrors.duration_total_minutes = 'La duración debe ser mayor a 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {

      const response = await fetch('/api/admin/workshops/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          level: formData.level,
          duration_total_minutes: formData.duration_total_minutes,
          instructor_id: formData.instructor_id,
          is_active: formData.is_active,
          thumbnail_url: formData.thumbnail_url,
          slug: formData.slug,
          price: formData.price,
          learning_objectives: formData.learning_objectives
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Error al crear el taller')
      }

      // La traducción ya se completó en el servidor antes de devolver la respuesta
      // pero esperamos un momento para asegurarnos de que todo se guardó
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await onSave()

      onClose()
    } catch (err) {
      console.error('[AddWorkshopModal] Error al crear taller:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el taller')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Crear Nuevo Taller</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className={fieldStyles.container}>
              <label className={fieldStyles.label}>
                Título del Taller *
              </label>
              <div className={fieldStyles.inputContainer}>
                <BookOpenIcon className={fieldStyles.icon} />
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={fieldStyles.input}
                  placeholder="Ej: Introducción a la Inteligencia Artificial"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.title}</p>
              )}
            </div>

            <div className={fieldStyles.container}>
              <label className={fieldStyles.label}>
                Descripción *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={fieldStyles.textarea}
                placeholder="Describe el contenido y objetivos del taller..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldStyles.container}>
                <label className={fieldStyles.label}>
                  Instructor *
                </label>
                <select
                  name="instructor_id"
                  value={formData.instructor_id}
                  onChange={handleChange}
                  className={fieldStyles.inputNoIcon}
                >
                  <option value="">Seleccionar instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
                {errors.instructor_id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.instructor_id}</p>
                )}
              </div>

              <div className={fieldStyles.container}>
                <label className={fieldStyles.label}>
                  Categoría *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={fieldStyles.inputNoIcon}
                >
                  <option value="ia">Inteligencia Artificial</option>
                  <option value="tecnologia">Tecnología</option>
                  <option value="negocios">Negocios</option>
                  <option value="diseño">Diseño</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldStyles.container}>
                <label className={fieldStyles.label}>
                  Nivel *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className={fieldStyles.inputNoIcon}
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                </select>
              </div>

              <div className={fieldStyles.container}>
                <label className={fieldStyles.label}>
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  name="duration_total_minutes"
                  value={formData.duration_total_minutes}
                  onChange={handleChange}
                  min="1"
                  className={fieldStyles.inputNoIcon}
                />
                {errors.duration_total_minutes && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.duration_total_minutes}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={fieldStyles.container}>
                <label className={fieldStyles.label}>
                  Precio
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={fieldStyles.inputNoIcon}
                  placeholder="0.00"
                />
              </div>

              <div className={fieldStyles.container}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={fieldStyles.label}>Taller activo</span>
                </label>
              </div>
            </div>

            <div className={fieldStyles.container}>
              <label className={fieldStyles.label}>
                Imagen del Taller
              </label>
              <ImageUploadCourse
                value={formData.thumbnail_url}
                onChange={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
                disabled={isLoading}
              />
            </div>

            <div className={fieldStyles.container}>
              <label className={fieldStyles.label}>
                Slug (URL amigable) *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className={fieldStyles.inputNoIcon}
                placeholder="introduccion-ia"
              />
              {errors.slug && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.slug}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Creando...' : 'Crear Taller'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

