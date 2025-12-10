'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { AdminWorkshop } from '../services/adminWorkshops.service'

interface EditWorkshopModalProps {
  workshop: AdminWorkshop | null
  onClose: () => void
  onSave: (data: Partial<AdminWorkshop>) => Promise<void>
}

export function EditWorkshopModal({ workshop, onClose, onSave }: EditWorkshopModalProps) {
  const [formData, setFormData] = useState<Partial<AdminWorkshop>>({
    title: '',
    description: '',
    category: 'ia',
    level: 'beginner',
    duration_total_minutes: 0,
    price: 0,
    is_active: true,
    approval_status: 'pending',
    rejection_reason: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = [
    { value: 'ia', label: 'Inteligencia Artificial' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'negocios', label: 'Negocios' },
    { value: 'diseño', label: 'Diseño' },
    { value: 'marketing', label: 'Marketing' }
  ]

  const levels = [
    { value: 'beginner', label: 'Principiante' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' }
  ]

  const approvalStatuses = [
    { value: 'pending', label: 'Pendiente', icon: AlertCircle, color: 'text-yellow-400' },
    { value: 'approved', label: 'Aprobado', icon: CheckCircle, color: 'text-green-400' },
    { value: 'rejected', label: 'Rechazado', icon: XCircle, color: 'text-red-400' }
  ]

  useEffect(() => {
    if (workshop) {
      setFormData({
        title: workshop.title || '',
        description: workshop.description || '',
        category: workshop.category || 'ia',
        level: workshop.level || 'beginner',
        duration_total_minutes: workshop.duration_total_minutes || 0,
        price: workshop.price || 0,
        is_active: workshop.is_active !== undefined ? workshop.is_active : true,
        approval_status: workshop.approval_status || 'pending',
        rejection_reason: workshop.rejection_reason || ''
      })
      setErrors({})
    }
  }, [workshop])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'El título es obligatorio'
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'La descripción es obligatoria'
    }

    if (!formData.duration_total_minutes || formData.duration_total_minutes <= 0) {
      newErrors.duration_total_minutes = 'La duración debe ser mayor a 0'
    }

    if (formData.approval_status === 'rejected' && (!formData.rejection_reason || formData.rejection_reason.trim() === '')) {
      newErrors.rejection_reason = 'La razón de rechazo es obligatoria cuando el estado es "Rechazado"'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Limpiar rejection_reason si no está rechazado
      const dataToSave = { ...formData }
      if (formData.approval_status !== 'rejected') {
        dataToSave.rejection_reason = ''
      }

      await onSave(dataToSave)
      onClose()
    } catch (error) {
      // console.error('Error updating workshop:', error)
      alert('Error al actualizar el taller')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof AdminWorkshop, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Limpiar error del campo cuando el usuario escribe
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  if (!workshop) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar Taller</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
              Información Básica
            </h3>

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Título del taller"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.description
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Descripción del taller"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Categoría y Nivel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nivel *
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {levels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duración y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duración (minutos) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_total_minutes}
                  onChange={(e) => handleInputChange('duration_total_minutes', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.duration_total_minutes
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-600 focus:ring-blue-500'
                  }`}
                />
                {errors.duration_total_minutes && (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.duration_total_minutes}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Estado y Aprobación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 pb-2">
              Estado y Aprobación
            </h3>

            {/* Estado Activo/Inactivo */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-500'}`}></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formData.is_active ? 'Taller Activo' : 'Taller Inactivo'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Estado de Aprobación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado de Aprobación *
              </label>
              <select
                value={formData.approval_status}
                onChange={(e) => handleInputChange('approval_status', e.target.value as 'pending' | 'approved' | 'rejected')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {approvalStatuses.map(status => {
                  const Icon = status.icon
                  return (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  )
                })}
              </select>
              <div className="mt-2 flex items-center space-x-2">
                {approvalStatuses.map(status => {
                  if (status.value === formData.approval_status) {
                    const Icon = status.icon
                    return (
                      <div key={status.value} className={`flex items-center space-x-1 ${status.value === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : status.value === 'approved' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs">{status.label}</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </div>

            {/* Razón de Rechazo (solo si está rechazado) */}
            {formData.approval_status === 'rejected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Razón de Rechazo *
                </label>
                <textarea
                  value={formData.rejection_reason}
                  onChange={(e) => handleInputChange('rejection_reason', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                    errors.rejection_reason
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-red-600 focus:ring-red-500'
                  }`}
                  placeholder="Explica por qué se rechaza este taller..."
                />
                {errors.rejection_reason ? (
                  <p className="mt-1 text-sm text-red-400 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.rejection_reason}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    La razón de rechazo es obligatoria cuando el estado es "Rechazado"
                  </p>
                )}
              </div>
            )}

            {/* Información de aprobación (solo lectura si está aprobado) */}
            {formData.approval_status === 'approved' && workshop.approved_at && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  <strong>Aprobado el:</strong> {new Date(workshop.approved_at).toLocaleString('es-ES')}
                </p>
                {workshop.approved_by && (
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    Por: {workshop.approved_by}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

