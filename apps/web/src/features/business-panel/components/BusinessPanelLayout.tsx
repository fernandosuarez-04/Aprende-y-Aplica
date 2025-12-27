'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/hooks/useAuth'
import { BusinessPanelSidebar } from './BusinessPanelSidebar'
import { BusinessPanelHeader } from './BusinessPanelHeader'
import { PremiumLoadingScreen } from './PremiumLoadingScreen'
import { OrganizationStylesProvider, useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { generateCSSVariables, getBackgroundStyle } from '../utils/styles'
import { LiaSidePanel } from '@/core/components/LiaSidePanel'
import { LiaFloatingButton } from '@/core/components/LiaSidePanel/LiaFloatingButton'
import { useLiaPanel } from '@/core/contexts/LiaPanelContext'

interface BusinessPanelLayoutProps {
  children: React.ReactNode
}

function BusinessPanelLayoutInner({ children }: BusinessPanelLayoutProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { styles, loading: stylesLoading } = useOrganizationStylesContext()
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

  // Obtener estado del panel de LIA para desplazar contenido
  let isLiaPanelOpen = false;
  try {
    const liaPanel = useLiaPanel();
    isLiaPanelOpen = liaPanel.isOpen;
  } catch {
    // Si no está dentro del LiaPanelProvider, ignorar
  }

  // Memorizar estilos personalizados ANTES de cualquier return (Regla de Hooks)
  const panelStyles = useMemo(() => styles?.panel, [styles])
  const backgroundStyle = useMemo(() => getBackgroundStyle(panelStyles), [panelStyles])
  const cssVariables = useMemo(() => generateCSSVariables(panelStyles), [panelStyles])

  // Debug: Log cuando los estilos se aplican
  useEffect(() => {

    if (styles?.panel) {
      console.log('✅ [BusinessPanelLayout] Estilos aplicados correctamente al layout:', {
        theme: styles.selectedTheme,
        backgroundValue: styles.panel.background_value?.substring(0, 50),
        primaryColor: styles.panel.primary_button_color
      });
    }
  }, [styles])

  // Efecto para redireccionar usuarios no autenticados o con rol incorrecto
  // SOLO después de que la carga inicial haya terminado completamente
  useEffect(() => {
    // Esperar a que termine de cargar Y a que se haya intentado obtener el usuario
    if (isLoading === false && user === null) {
      // Usuario no autenticado - obtener organization_slug de localStorage si existe
      let redirectPath = '/auth';

      if (typeof window !== 'undefined') {
        try {
          // Intentar obtener el slug de la organización del usuario desde localStorage
          const lastOrgSlug = localStorage.getItem('last_organization_slug');
          if (lastOrgSlug) {
            redirectPath = `/auth/${lastOrgSlug}`;
          }
        } catch (error) {
          // console.error('Error reading localStorage:', error);
        }
      }

      router.push(redirectPath);
      return;
    }

    // Usuario autenticado pero con rol incorrecto
    if (isLoading === false && user) {
      const normalizedRole = user.cargo_rol?.toLowerCase().trim();

      if (normalizedRole !== 'business') {
        router.push('/dashboard');
        return;
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

  // Estabilizar funciones de callbacks
  const handleMenuClick = useCallback(() => {
    setSidebarOpen(true)
  }, [])

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleTogglePin = useCallback(() => {
    setSidebarPinned(prev => !prev)
  }, [])

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
  }, [])

  // Mostrar loading spinner si isLoading es true
  if (isLoading) {
    return <PremiumLoadingScreen />
  }

  // Verificar rol
  const normalizedRole = user?.cargo_rol?.toLowerCase().trim()
  if (!user || normalizedRole !== 'business') {
    return null
  }

  // Mostrar loading mientras se cargan los estilos
  if (stylesLoading) {
    return <PremiumLoadingScreen />
  }

  return (
    <div
      key={styles?.selectedTheme || 'default-theme'}
      className="h-screen flex flex-col overflow-hidden transition-all duration-300 business-panel-layout"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Header Global - Full Width */}
      <BusinessPanelHeader 
        onMenuClick={handleMenuClick}
        title="Panel de Gestión Business"
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Componentes de LIA */}
      <LiaSidePanel />
      <LiaFloatingButton />

      {/* Content Area with Sidebar + Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Global */}
        <BusinessPanelSidebar 
          isOpen={sidebarOpen} 
          onClose={handleSidebarClose}
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isPinned={sidebarPinned}
          onTogglePin={handleTogglePin}
        />

        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-12 business-panel-content transition-all duration-300"
          style={{ paddingRight: isLiaPanelOpen ? '420px' : '0px' }}
        >
          <div className="w-full max-w-[1920px] mx-auto">
            {children}
          </div>
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
