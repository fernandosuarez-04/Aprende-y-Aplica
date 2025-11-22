'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { getBackgroundStyle } from '../utils/styles'
import {
  Home,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  X,
  Building2,
  ClipboardCheck,
  Pin,
  PinOff
} from 'lucide-react'

interface BusinessPanelSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/business-panel/dashboard', icon: Home },
  { name: 'Usuarios', href: '/business-panel/users', icon: Users },
  { name: 'Cursos', href: '/business-panel/courses', icon: BookOpen },
  { name: 'Progreso', href: '/business-panel/progress', icon: ClipboardCheck },
  { name: 'Reportes', href: '/business-panel/reports', icon: FileText },
  { name: 'Analytics', href: '/business-panel/analytics', icon: BarChart3 },
  { name: 'Configuración', href: '/business-panel/settings', icon: Settings },
]

export function BusinessPanelSidebar({ 
  isOpen, 
  onClose, 
  activeSection, 
  onSectionChange, 
  isCollapsed, 
  onToggleCollapse,
  isPinned,
  onTogglePin 
}: BusinessPanelSidebarProps) {
  const pathname = usePathname()
  const { styles } = useOrganizationStylesContext()
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [showPinFeedback, setShowPinFeedback] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Aplicar estilos personalizados del sidebar
  const panelStyles = styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || '#1e293b'
  
  // useMemo para recalcular estilos cuando cambien los panelStyles
  const sidebarStyle: React.CSSProperties = useMemo(() => {
    // console.log('🎨 Sidebar Background Value:', sidebarBackground);
    // console.log('🎨 Panel Styles:', panelStyles);
    
    const getSidebarBackgroundStyle = (backgroundValue: string): React.CSSProperties => {
      const opacity = panelStyles?.sidebar_opacity || 1;
      
      if (!backgroundValue) {
        return { backgroundColor: `rgba(30, 41, 59, ${opacity})` };
      }

      // Si es un gradiente CSS (verificar primero porque puede contener URLs)
      if (backgroundValue.includes('linear-gradient') || backgroundValue.includes('radial-gradient') || backgroundValue.includes('conic-gradient')) {
        // console.log('✅ Aplicando gradiente con opacidad:', backgroundValue, opacity);
        return {
          background: backgroundValue,
          backgroundColor: 'transparent',
          opacity: opacity,
        };
      }

      // Si es una imagen (URL absoluta o relativa)
      if (backgroundValue.startsWith('http://') || backgroundValue.startsWith('https://') || 
          (backgroundValue.startsWith('/') && !backgroundValue.startsWith('/#'))) {
        // console.log('✅ Aplicando imagen con opacidad:', backgroundValue, opacity);
        return {
          backgroundImage: `url(${backgroundValue})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'transparent',
          opacity: opacity,
        };
      }

      // Si es un color (hex, rgb, rgba, hsl, etc.)
      // console.log('✅ Aplicando color con opacidad:', backgroundValue, opacity);
      // Convertir color hex/rgb a rgba con opacidad
      if (backgroundValue.startsWith('#')) {
        // Convertir hex a rgb
        const hex = backgroundValue.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return {
          backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
        };
      }
      return {
        backgroundColor: backgroundValue,
        opacity: opacity,
      };
    }
    
    const result = getSidebarBackgroundStyle(sidebarBackground);
    // console.log('🎨 Sidebar Style Result:', result);
    return result;
  }, [sidebarBackground, panelStyles])

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : (isCollapsed ? 'w-20' : 'w-64')

  // Detectar clics fuera del sidebar para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isPinned) {
          return
        }
        
        if (isCollapsed && isHovered) {
          setIsHovered(false)
        }
        
        if (!isCollapsed) {
          onToggleCollapse()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCollapsed, isHovered, isPinned, onToggleCollapse])

  // Detectar tecla Escape para cerrar el sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCollapsed && isHovered && !isPinned) {
          setIsHovered(false)
        }
        if (isOpen) {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isCollapsed, isHovered, isPinned, isOpen, onClose])

  // Limpiar estado de hover cuando cambia el estado de colapso
  useEffect(() => {
    if (!isCollapsed) {
      setIsHovered(false)
    }
  }, [isCollapsed])

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        key={`sidebar-${sidebarBackground}`}
        ref={sidebarRef}
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        style={{
          ...sidebarStyle,
          // Forzar aplicación de estilos
          ...(sidebarStyle.backgroundColor && { backgroundColor: sidebarStyle.backgroundColor }),
          ...(sidebarStyle.background && { background: sidebarStyle.background }),
          ...(sidebarStyle.backgroundImage && { backgroundImage: sidebarStyle.backgroundImage })
        }}
        className={`
          fixed lg:relative z-50 h-screen lg:h-full flex flex-col
          border-r backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${actualWidth}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl
        `}
        style={{
          borderColor: panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)'
        }}
        onMouseEnter={() => {
          if (isCollapsed && !isPinned) {
            setIsHovered(true)
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed && !isPinned) {
            setIsHovered(false)
          }
        }}
        onDoubleClick={(event) => {
          // Solo activar doble click si no se hace click en un enlace o botón
          const target = event.target as HTMLElement
          if (target.tagName !== 'A' && target.tagName !== 'BUTTON' && !target.closest('a') && !target.closest('button')) {
            onTogglePin()
            setShowPinFeedback(true)
            setTimeout(() => setShowPinFeedback(false), 2000)
          }
        }}
        onClick={(event) => {
          // Manejar clicks en el sidebar colapsado cuando está expandido por hover
          if (isCollapsed && isHovered && !isPinned && !isClicking) {
            setIsClicking(true)
            event.preventDefault()
            event.stopPropagation()
            onTogglePin()
            setTimeout(() => setIsClicking(false), 300)
          }
        }}
      >
        {/* Header - Botones de control */}
        <div className="h-16 flex items-center justify-end px-4 border-b backdrop-blur-sm" style={{ borderColor: panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)' }}>
          <div className="flex items-center gap-2">
            {/* Botón de fijar - siempre visible en desktop */}
            <motion.button
              onClick={(event) => {
                event.stopPropagation()
                onTogglePin()
              }}
              className="hidden lg:block p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: panelStyles?.text_color || 'rgba(203, 213, 225, 0.8)' }}
              title={isPinned ? 'Desfijar panel' : 'Fijar panel'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isPinned ? (
                <PinOff className="w-4 h-4" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </motion.button>
            
            {/* Botón de cerrar en mobile */}
            <button
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              className="lg:hidden p-2 rounded-lg transition-colors hover:opacity-80"
              style={{ color: panelStyles?.text_color || 'rgba(203, 213, 225, 0.8)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Indicador de hover para fijar */}
        <AnimatePresence>
          {isCollapsed && isHovered && !isPinned && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-1.5 backdrop-blur-sm border-b"
              style={{ 
                borderColor: panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)',
                background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)'
              }}
            >
              <p className="text-xs font-light flex items-center gap-1.5" style={{ color: panelStyles?.text_color || 'var(--org-text-color, #cbd5e1)' }}>
                <Pin className="w-3 h-3" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                Doble clic para fijar
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Indicador de panel fijado */}
        <AnimatePresence>
          {isPinned && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-1.5 backdrop-blur-sm border-b"
              style={{ 
                borderColor: panelStyles?.border_color || 'rgba(71, 85, 105, 0.3)',
                background: 'linear-gradient(to right, rgba(59, 130, 246, 0.15), transparent)'
              }}
            >
              <p className="text-xs font-light flex items-center gap-1.5" style={{ color: panelStyles?.text_color || 'var(--org-text-color, #e0e7ff)' }}>
                <PinOff className="w-3 h-3" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                Panel fijado
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Feedback temporal de doble click */}
        <AnimatePresence>
          {showPinFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-1.5 backdrop-blur-sm border-b"
              style={{ 
                borderColor: panelStyles?.border_color || 'rgba(71, 85, 105, 0.4)',
                background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), transparent)'
              }}
            >
              <p className="text-xs font-light flex items-center gap-1.5" style={{ color: panelStyles?.text_color || 'var(--org-text-color, #e0e7ff)' }}>
                <PinOff className="w-3 h-3" style={{ color: 'var(--org-primary-button-color, #3b82f6)' }} />
                {isPinned ? 'Panel fijado' : 'Panel desfijado'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {!isCollapsed || shouldExpand ? (
                    <Link
                      href={item.href}
                      onClick={(event) => {
                        event.stopPropagation()
                        onSectionChange(item.name.toLowerCase())
                        onClose()
                        // Si está expandido por hover, cerrarlo
                        if (isCollapsed && isHovered && !isPinned) {
                          setIsHovered(false)
                        }
                      }}
                      className={`
                        group relative flex items-center px-4 py-3 rounded-xl
                        transition-all duration-200 backdrop-blur-sm
                        ${
                          isActive
                            ? 'text-white shadow-lg shadow-primary/10'
                            : 'hover:opacity-80'
                        }
                      `}
                      style={{
                        background: isActive 
                          ? `linear-gradient(to right, var(--org-primary-button-color, rgba(59, 130, 246, 0.2)), var(--org-secondary-button-color, rgba(16, 185, 129, 0.2)))`
                          : undefined,
                        color: isActive 
                          ? (panelStyles?.text_color || 'var(--org-text-color, #ffffff)')
                          : (panelStyles?.text_color || 'rgba(203, 213, 225, 0.7)')
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                          style={{
                            backgroundImage: `linear-gradient(to bottom, var(--org-primary-button-color, #3b82f6), var(--org-secondary-button-color, #10b981))`
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <Icon 
                        className="w-5 h-5 mr-3 transition-colors flex-shrink-0"
                        style={{
                          color: isActive 
                            ? 'var(--org-primary-button-color, #3b82f6)'
                            : undefined
                        }}
                      />

                      {/* Label */}
                      <span className="text-sm font-medium">
                        {item.name}
                      </span>

                      {/* Hover effect */}
                      {!isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))'
                          }}
                        />
                      )}
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center justify-center p-3 rounded-xl transition-all duration-200 backdrop-blur-sm"
                      style={{
                        background: isActive 
                          ? `linear-gradient(to right, var(--org-primary-button-color, rgba(59, 130, 246, 0.2)), var(--org-secondary-button-color, rgba(16, 185, 129, 0.2)))`
                          : undefined,
                        color: isActive 
                          ? (panelStyles?.text_color || 'var(--org-text-color, #ffffff)')
                          : (panelStyles?.text_color || 'rgba(203, 213, 225, 0.7)')
                      }}
                      title={item.name}
                    >
                      <Icon 
                        className="w-6 h-6"
                        style={isActive ? { color: 'var(--org-primary-button-color, #3b82f6)' } : undefined}
                      />
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        </nav>

      </motion.div>
    </>
  )
}

