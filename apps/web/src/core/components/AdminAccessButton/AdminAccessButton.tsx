'use client'

import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useUserRole } from '@/core/hooks/useUserRole'

interface AdminAccessButtonProps {
  onClose?: () => void
  className?: string
}

export function AdminAccessButton({ onClose, className = '' }: AdminAccessButtonProps) {
  const { isAdmin, isLoading } = useUserRole()

  console.log('🔍 AdminAccessButton: Verificando acceso...')
  console.log('👤 isAdmin:', isAdmin)
  console.log('⏳ isLoading:', isLoading)

  // Solo mostrar si es administrador y no está cargando
  if (isLoading || !isAdmin) {
    console.log('❌ AdminAccessButton: No se muestra - isLoading:', isLoading, 'isAdmin:', isAdmin)
    return null
  }

  console.log('✅ AdminAccessButton: Mostrando botón de administración')

  return (
    <Link href="/admin/dashboard" onClick={onClose}>
      <div className={`flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors duration-200 ${className}`}>
        <ShieldCheckIcon className="w-4 h-4 mr-3" />
        Panel de Administración
      </div>
    </Link>
  )
}
