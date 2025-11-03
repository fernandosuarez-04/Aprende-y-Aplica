'use client'

import { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@aprende-y-aplica/ui'
import { BusinessUser } from '../services/businessUsers.service'

interface BusinessDeleteUserModalProps {
  user: BusinessUser | null
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function BusinessDeleteUserModal({ user, isOpen, onClose, onConfirm }: BusinessDeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !user) return null

  const displayName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="backdrop-blur-md rounded-2xl shadow-2xl border border-red-500/30 w-full max-w-md m-4" style={{ backgroundColor: `rgba(var(--org-card-background-rgb, 15, 23, 42), var(--org-modal-opacity, 0.95))` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-carbon-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Eliminar Usuario
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-carbon-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-carbon-400 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Warning message */}
          <div className="p-4 bg-red-900/10 border border-red-500/20 rounded-xl">
            <p className="text-white mb-2">
              ¿Estás seguro de que deseas eliminar a <span className="font-bold text-red-400">{displayName}</span> de tu organización?
            </p>
            <p className="text-carbon-400 text-sm">
              Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.
            </p>
          </div>

          {/* User details */}
          <div className="p-4 bg-carbon-700/30 rounded-xl">
            <p className="text-sm text-carbon-400 mb-1">Email</p>
            <p className="text-white font-medium">{user.email}</p>
            <p className="text-sm text-carbon-400 mb-1 mt-2">Rol</p>
            <p className="text-white font-medium">{user.org_role || 'member'}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-carbon-600">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="gradient"
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? 'Eliminando...' : 'Eliminar Usuario'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

