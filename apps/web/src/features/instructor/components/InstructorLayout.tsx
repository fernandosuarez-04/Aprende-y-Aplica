'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { InstructorSidebar } from './InstructorSidebar'
import { InstructorHeader } from './InstructorHeader'

interface InstructorLayoutProps {
  children: React.ReactNode
}

export function InstructorLayout({ children }: InstructorLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('instructor-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('instructor-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })

  const isLoading = typeof authLoading === 'boolean' ? authLoading : true

  useEffect(() => {
    if (isLoading === false) {
      if (!user) {
        router.push('/auth')
        return
      }
      
      // Verificar que el rol sea Instructor o Administrador (case-insensitive)
      const userRole = user.cargo_rol?.toLowerCase().trim()
      if (userRole !== 'instructor' && userRole !== 'administrador') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, isLoading, router])

  // Guardar estado de colapso en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('instructor-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Guardar estado pinned en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('instructor-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500"></div>
          <p className="text-purple-300 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Verificar rol nuevamente antes de renderizar (permitir instructor o administrador)
  const userRole = user?.cargo_rol?.toLowerCase().trim()
  if (userRole !== 'instructor' && userRole !== 'administrador') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Sidebar */}
      <InstructorSidebar 
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
      <div className={`bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed && !sidebarPinned ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <InstructorHeader 
          onMenuClick={() => setSidebarOpen(true)}
          title="Panel de Instructor"
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

