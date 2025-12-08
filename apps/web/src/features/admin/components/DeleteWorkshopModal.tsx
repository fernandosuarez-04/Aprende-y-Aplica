'use client'

import { useState } from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { AdminWorkshop } from '../services/adminWorkshops.service'

interface DeleteWorkshopModalProps {
  isOpen: boolean
  onClose: () => void
  workshop: AdminWorkshop | null
  onConfirm: () => Promise<void>
}

export function DeleteWorkshopModal({ isOpen, onClose, workshop, onConfirm }: DeleteWorkshopModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } catch (error) {
      // console.error('Error deleting workshop:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !workshop) return null

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-gray-600/75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Eliminar Taller</h2>
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                ¿Estás seguro de que quieres eliminar este taller?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Esta acción no se puede deshacer. Se eliminará permanentemente:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">{workshop.title}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Categoría: {workshop.category}</p>
                  <p>Nivel: {workshop.level}</p>
                  <p>Estado: <span className="capitalize">{workshop.is_active ? 'Activo' : 'Inactivo'}</span></p>
                  <p>Instructor: {workshop.instructor_name || 'Sin instructor'}</p>
                  {(workshop.student_count && workshop.student_count > 0) && (
                    <p>Estudiantes inscritos: {workshop.student_count}</p>
                  )}
                  <p>Duración: {workshop.duration_total_minutes} minutos</p>
                </div>
              </div>

              {workshop.student_count && workshop.student_count > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Este taller tiene {workshop.student_count} estudiante{workshop.student_count > 1 ? 's' : ''} inscrito{workshop.student_count > 1 ? 's' : ''}. 
                    Las inscripciones también se eliminarán.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Taller'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

