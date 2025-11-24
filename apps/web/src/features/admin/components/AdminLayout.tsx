'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('admin-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })

  // Asegurar que isLoading sea siempre un booleano, por defecto true si es undefined
  const isLoading = typeof authLoading === 'boolean' ? authLoading : true;

  useEffect(() => {
    // Evitar redirecciones múltiples o durante desmontaje
    if (isRedirecting) return

    // Solo ejecutar lógica de redirección cuando loading sea explícitamente false
    if (isLoading === false) {
      if (!user) {
        setIsRedirecting(true)
        // Usar replace en lugar de push para evitar problemas de navegación
        router.replace('/auth')
        return
      }
      
      if (user.cargo_rol !== 'Administrador') {
        setIsRedirecting(true)
        // Usar replace en lugar de push para evitar problemas de navegación
        router.replace('/dashboard')
        return
      }
    }

    // Cleanup: resetear estado de redirección si el componente se desmonta
    return () => {
      setIsRedirecting(false)
    }
  }, [user, isLoading, router, isRedirecting])

  // Guardar estado de colapso en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Guardar estado pinned en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  // Mostrar loading spinner si isLoading es true
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Si loading es false, y el usuario es administrador, renderizar children
  if (!user || user.cargo_rol !== 'Administrador') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800">
          {/* Sidebar Global */}
          <AdminSidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isPinned={sidebarPinned}
            onTogglePin={() => setSidebarPinned(!sidebarPinned)}
          />

      {/* Main Content Area */}
      <div className={`bg-gray-50 dark:bg-gray-800 min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed && !sidebarPinned ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header Global */}
        <AdminHeader 
          onMenuClick={() => setSidebarOpen(true)}
          title="Panel de Administración"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="bg-gray-50 dark:bg-gray-800 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
