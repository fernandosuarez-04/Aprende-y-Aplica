'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  UserGroupIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { ImageUpload } from './ImageUpload'

interface AddCommunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (communityData: any) => Promise<void>
}

export function AddCommunityModal({ isOpen, onClose, onSave }: AddCommunityModalProps) {
  // Estilos consistentes para los campos
  const fieldStyles = {
    container: "group",
    label: "block text-sm font-medium text-gray-300 mb-2 group-hover:text-white transition-colors",
    inputContainer: "relative",
    icon: "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors",
    input: "w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700 transition-all duration-200 hover:border-gray-500",
    inputNoIcon: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700 transition-all duration-200 hover:border-gray-500",
    textarea: "w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-gray-700 transition-all duration-200 hover:border-gray-500 resize-none"
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    image_url: '',
    is_active: true,
    visibility: 'public',
    access_type: 'open',
    course_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        slug: '',
        image_url: '',
        is_active: true,
        visibility: 'public',
        access_type: 'open',
        course_id: ''
      })
      setErrors({})
      setError(null)
      setImageError(null)
      loadCourses()
    }
  }, [isOpen])

  const loadCourses = async () => {
    setLoadingCourses(true)
    try {
      console.log('🔄 Cargando cursos desde API...')
      const response = await fetch('/api/admin/courses')
      const data = await response.json()
      
      console.log('📡 Respuesta de API cursos:', data)
      
      if (data.success) {
        setCourses(data.courses || [])
        console.log('✅ Cursos cargados exitosamente:', data.courses?.length || 0)
        console.log('📋 Lista de cursos:', data.courses)
      } else {
        console.error('❌ Error loading courses:', data.error)
        setCourses([]) // Asegurar que courses sea un array vacío
      }
    } catch (error) {
      console.error('💥 Error loading courses:', error)
      setCourses([]) // Asegurar que courses sea un array vacío
    } finally {
      setLoadingCourses(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
    
    // Auto-generar slug desde el nombre
    if (name === 'name') {
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

  const handleImageChange = (url: string) => {
    setFormData(prev => ({
      ...prev,
      image_url: url
    }))
    setImageError(null)
  }

  const handleImageError = (error: string) => {
    setImageError(error)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida'
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'El slug es requerido'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'El slug solo puede contener letras minúsculas, números y guiones'
    }
    
    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'La URL de imagen no es válida'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear comunidad')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-600 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-green-600 to-blue-600 rounded-t-2xl p-6">
            <div className="absolute inset-0 bg-black/20 rounded-t-2xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Crear Nueva Comunidad
                  </h3>
                  <p className="text-green-100 text-sm">
                    Configura una nueva comunidad en la plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-all duration-200 text-white hover:scale-105"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Información Básica */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6 border border-blue-500/20">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                    <UserGroupIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  Información Básica
                </h4>
                <p className="text-gray-400 text-sm ml-11">
                  Datos principales de la comunidad
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Nombre de la comunidad *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <UserGroupIcon className={fieldStyles.icon} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      placeholder="ej. Comunidad de Desarrolladores"
                      required
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                </div>

                {/* Slug */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Slug (URL amigable) *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <LinkIcon className={fieldStyles.icon} />
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      placeholder="ej. comunidad-desarrolladores"
                      required
                      pattern="[a-z0-9-]+"
                      title="Solo letras minúsculas, números y guiones"
                    />
                  </div>
                  {errors.slug && <p className="mt-1 text-sm text-red-400">{errors.slug}</p>}
                </div>
              </div>

              {/* Descripción */}
              <div className="mt-6">
                <label className={fieldStyles.label}>
                  Descripción *
                </label>
                <div className={fieldStyles.inputContainer}>
                  <DocumentTextIcon className={fieldStyles.icon} />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className={fieldStyles.textarea}
                    placeholder="Describe el propósito y objetivos de la comunidad..."
                    required
                  />
                </div>
                {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
              </div>

              {/* Imagen */}
              <div className="mt-6">
                <label className={fieldStyles.label}>
                  Imagen de la comunidad
                </label>
                <ImageUpload
                  value={formData.image_url}
                  onChange={handleImageChange}
                  onError={handleImageError}
                  communityName={formData.name || 'comunidad'}
                  disabled={isLoading}
                />
                {imageError && <p className="mt-1 text-sm text-red-400">{imageError}</p>}
                {errors.image_url && <p className="mt-1 text-sm text-red-400">{errors.image_url}</p>}
              </div>
            </div>

            {/* Configuración de Privacidad */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-500/20">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <ShieldCheckIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  Configuración de Privacidad
                </h4>
                <p className="text-gray-400 text-sm ml-11">
                  Controla quién puede ver y acceder a la comunidad
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visibilidad */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Visibilidad *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <GlobeAltIcon className={fieldStyles.icon} />
                    <select
                      name="visibility"
                      value={formData.visibility}
                      onChange={handleChange}
                      className={fieldStyles.input}
                    >
                      <option value="public">Pública</option>
                      <option value="private">Privada</option>
                    </select>
                  </div>
                </div>

                {/* Tipo de Acceso */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Tipo de Acceso *
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <LockClosedIcon className={fieldStyles.icon} />
                    <select
                      name="access_type"
                      value={formData.access_type}
                      onChange={handleChange}
                      className={fieldStyles.input}
                    >
                      <option value="open">Abierto</option>
                      <option value="moderated">Moderado</option>
                      <option value="invite_only">Solo por invitación</option>
                    </select>
                  </div>
                </div>

                {/* Curso Vinculado */}
                <div className={fieldStyles.container}>
                  <label className={fieldStyles.label}>
                    Curso Vinculado (Opcional)
                  </label>
                  <div className={fieldStyles.inputContainer}>
                    <DocumentTextIcon className={fieldStyles.icon} />
                    <select
                      name="course_id"
                      value={formData.course_id}
                      onChange={handleChange}
                      className={fieldStyles.input}
                      disabled={loadingCourses}
                    >
                      <option value="">Sin curso vinculado</option>
                      {courses.length > 0 ? (
                        courses.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title} - {course.instructor_name} ({course.level})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          {loadingCourses ? 'Cargando cursos...' : 'No hay cursos disponibles'}
                        </option>
                      )}
                    </select>
                  </div>
                  {loadingCourses && (
                    <p className="text-sm text-gray-400 mt-1">Cargando cursos...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Estado de la Comunidad */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 mb-6 border border-green-500/20">
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    {formData.is_active ? (
                      <EyeIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  Estado de la Comunidad
                </h4>
                <p className="text-gray-400 text-sm ml-11">
                  Controla si la comunidad está activa y visible
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Comunidad activa (visible para los usuarios)
                </label>
              </div>
            </div>

            {/* Aviso de Protección de Datos */}
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-blue-400 mb-2">
                    Protección de Datos Personales
                  </h5>
                  <p className="text-xs text-blue-300 leading-relaxed">
                    Al crear esta comunidad, se está manejando información sensible protegida por la Ley Federal de Protección de Datos Personales (LFPDPPP) y las normas ISO 27001. 
                    La creación será registrada en el log de auditoría para cumplir con los requisitos de trazabilidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 text-gray-300 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all duration-200 hover:scale-105 border border-gray-600"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PlusIcon className="h-5 w-5" />
                    <span>Crear Comunidad</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
