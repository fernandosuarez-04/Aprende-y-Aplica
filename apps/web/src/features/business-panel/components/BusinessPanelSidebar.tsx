'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Users, 
  BookOpen, 
  BarChart3,
  FileText,
  Settings,
  X,
  ChevronRight,
  ChevronLeft,
  Menu,
  Building2,
  ClipboardCheck
} from 'lucide-react'

interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
}

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
  const [isHovered, setIsHovered] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loadingOrg, setLoadingOrg] = useState(true)

  // Obtener información de la organización
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user?.organization) {
            setOrganization(data.user.organization)
          }
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      } finally {
        setLoadingOrg(false)
      }
    }

    fetchOrganization()
  }, [])

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')

  // Valores por defecto si no hay organización
  const orgName = organization?.name || 'Aprende y Aplica'
  const orgLogo = organization?.logo_url || '/icono.png'

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
        ref={sidebarRef}
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        className={`
          fixed lg:relative z-50 h-full flex flex-col
          bg-gradient-to-b from-carbon-700 via-carbon-800 to-carbon-900
          border-r border-carbon-600/50
          transition-all duration-300 ease-in-out
          ${actualWidth}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          shadow-2xl
        `}
        onMouseEnter={() => isCollapsed && !isPinned && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && !isPinned && setIsHovered(false)}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-carbon-600/50">
          {!isCollapsed || shouldExpand ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center overflow-hidden relative p-1">
                <div className="w-full h-full rounded-lg bg-carbon-900 flex items-center justify-center">
                  {!loadingOrg && (
                    <Image
                      src={orgLogo}
                      alt={`${orgName} Logo`}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        // Fallback al logo por defecto si hay error cargando el logo de la organización
                        (e.target as HTMLImageElement).src = '/icono.png';
                      }}
                    />
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {loadingOrg ? 'Cargando...' : orgName}
                </h2>
                <p className="text-xs text-carbon-300">Business</p>
              </div>
            </motion.div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-success rounded-xl flex items-center justify-center overflow-hidden relative p-1 mx-auto">
              <div className="w-full h-full rounded-lg bg-carbon-900 flex items-center justify-center">
                {!loadingOrg && (
                  <Image
                    src={orgLogo}
                    alt={`${orgName} Logo`}
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-carbon-400 hover:text-white hover:bg-carbon-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                      onClick={() => {
                        onSectionChange(item.name.toLowerCase())
                        onClose()
                      }}
                      className={`
                        group relative flex items-center px-4 py-3 rounded-xl
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-success/20 text-white shadow-lg shadow-primary/10'
                            : 'text-carbon-300 hover:bg-carbon-700/50 hover:text-white'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-success rounded-r-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}

                      {/* Icon */}
                      <Icon className={`
                        w-5 h-5 mr-3 transition-colors
                        ${isActive ? 'text-primary' : 'text-carbon-400 group-hover:text-white'}
                      `} />

                      {/* Label */}
                      <span className="text-sm font-medium">{item.name}</span>

                      {/* Hover effect */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-success/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.02 }}
                      />
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center justify-center p-3 rounded-xl
                        transition-all duration-200
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-primary/20 to-success/20 text-white shadow-lg'
                            : 'text-carbon-400 hover:bg-carbon-700 hover:text-white'
                        }
                      `}
                      title={item.name}
                    >
                      <Icon className="w-6 h-6" />
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-carbon-600/50 p-4">
          {!isCollapsed || shouldExpand ? (
            <div className="space-y-2">
              <button
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-carbon-400 hover:bg-carbon-700 hover:text-white transition-colors text-sm"
              >
                <span>Colapsar</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onTogglePin}
                className={`
                  w-full px-4 py-2 rounded-lg transition-colors text-sm
                  ${
                    isPinned
                      ? 'bg-primary/20 text-primary'
                      : 'text-carbon-400 hover:bg-carbon-700 hover:text-white'
                  }
                `}
              >
                {isPinned ? 'Desanclar' : 'Anclar'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-carbon-400 hover:bg-carbon-700 hover:text-white transition-colors mx-auto"
                title="Expandir"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={onTogglePin}
                className={`
                  p-2 rounded-lg transition-colors mx-auto
                  ${
                    isPinned
                      ? 'bg-primary/20 text-primary'
                      : 'text-carbon-400 hover:bg-carbon-700 hover:text-white'
                  }
                `}
                title={isPinned ? 'Desanclar' : 'Anclar'}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

