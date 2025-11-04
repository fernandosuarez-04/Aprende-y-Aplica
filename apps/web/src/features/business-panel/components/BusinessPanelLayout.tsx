'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { BusinessPanelSidebar } from './BusinessPanelSidebar'
import { BusinessPanelHeader } from './BusinessPanelHeader'
import { OrganizationStylesProvider, useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { generateCSSVariables, getBackgroundStyle } from '../utils/styles'

interface BusinessPanelLayoutProps {
  children: React.ReactNode
}

function BusinessPanelLayoutInner({ children }: BusinessPanelLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { styles } = useOrganizationStylesContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('business-sidebar-collapsed') === 'true'
    }
    return false
  })
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    if (typeof window !== 'undefined') {
      const pinned = localStorage.getItem('business-sidebar-pinned')
      return pinned === 'true'
    }
    return false
  })

  // Asegurar que isLoading sea siempre un booleano
  const isLoading = typeof authLoading === 'boolean' ? authLoading : true;

  useEffect(() => {
    // Solo ejecutar lógica de redirección cuando loading sea explícitamente false
    if (isLoading === false) {
      if (!user) {
        router.push('/auth')
        return
      }
      
      // Normalizar rol para comparación
      const normalizedRole = user.cargo_rol?.toLowerCase().trim()
      
      if (normalizedRole !== 'business') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, isLoading, router])

  // Guardar estado de colapso en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Guardar estado pinned en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('business-sidebar-pinned', sidebarPinned.toString())
    }
  }, [sidebarPinned])

  // Mostrar loading spinner si isLoading es true
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-carbon via-carbon to-carbon-dark">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-success rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-white/70 text-sm font-medium">Cargando panel de gestión...</p>
        </div>
      </div>
    )
  }

  // Verificar rol
  const normalizedRole = user?.cargo_rol?.toLowerCase().trim()
  if (!user || normalizedRole !== 'business') {
    return null
  }

  // Aplicar estilos personalizados
  const panelStyles = styles?.panel
  const backgroundStyle = getBackgroundStyle(panelStyles)
  const cssVariables = generateCSSVariables(panelStyles)

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden transition-all duration-300 business-panel-layout"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Header Global - Full Width */}
      <BusinessPanelHeader 
        onMenuClick={() => setSidebarOpen(true)}
        title="Panel de Gestión Business"
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Content Area with Sidebar + Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Global */}
        <BusinessPanelSidebar 
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 business-panel-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export function BusinessPanelLayout({ children }: BusinessPanelLayoutProps) {
  return (
    <OrganizationStylesProvider>
      <BusinessPanelLayoutInner>{children}</BusinessPanelLayoutInner>
    </OrganizationStylesProvider>
  )
}
