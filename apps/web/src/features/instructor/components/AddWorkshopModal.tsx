'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import { ImageUploadCourse } from './ImageUploadCourse'

interface AddWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => Promise<void>
}

export function AddWorkshopModal({ isOpen, onClose, onSave }: AddWorkshopModalProps) {
  const fieldStyles = {
    container: "group",
    label: "block text-sm font-medium text-gray-300 mb-2 group-hover:text-white transition-colors",
    inputContainer: "relative",
    icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors",
    input: "w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-gray-800 transition-all duration-200 hover:border-gray-600",
    inputNoIcon: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-gray-800 transition-all duration-200 hover:border-gray-600",
    textarea: "w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-gray-800 transition-all duration-200 hover:border-gray-600 resize-none"
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
    learning_objectives: []
  })
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
        learning_objectives: []
      })
      setErrors({})
      setError(null)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
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
      const response = await fetch('/api/instructor/workshops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el taller')
      }

      await onSave()
      onClose()
    } catch (err) {
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
        
        <div className="relative w-full max-w-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AcademicCapIcon className="h-6 w-6 text-white" />
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
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className={fieldStyles.container}>
              <label className={fieldStyles.label}>
                Título del Taller *
              </label>
              <div className={fieldStyles.inputContainer}>
                <AcademicCapIcon className={fieldStyles.icon} />
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
                <p className="mt-1 text-xs text-red-400">{errors.title}</p>
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
                <p className="mt-1 text-xs text-red-400">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="mt-1 text-xs text-red-400">{errors.duration_total_minutes}</p>
                )}
              </div>

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
                <p className="mt-1 text-xs text-red-400">{errors.slug}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

