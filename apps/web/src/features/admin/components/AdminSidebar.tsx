'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UsersIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  NewspaperIcon,
  PlayIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Bars3Icon,
  MapPinIcon
} from '@heroicons/react/24/outline'

interface AdminSidebarProps {
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
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon, current: true },
  { name: 'Usuarios', href: '/admin/users', icon: UsersIcon, current: false },
  { name: 'Talleres', href: '/admin/workshops', icon: BookOpenIcon, current: false },
  { name: 'Comunidades', href: '/admin/communities', icon: UserGroupIcon, current: false },
  { name: 'Prompts', href: '/admin/prompts', icon: ChatBubbleLeftRightIcon, current: false },
  { name: 'Apps de IA', href: '/admin/apps', icon: CpuChipIcon, current: false },
  { name: 'Noticias', href: '/admin/news', icon: NewspaperIcon, current: false },
  { name: 'Reels', href: '/admin/reels', icon: PlayIcon, current: false },
  { name: 'Estadísticas', href: '/admin/statistics', icon: ChartBarIcon, current: false },
  { name: 'Configuración', href: '/admin/settings', icon: Cog6ToothIcon, current: false },
]

export function AdminSidebar({ isOpen, onClose, activeSection, onSectionChange, isCollapsed, onToggleCollapse, isPinned, onTogglePin }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')
  

  // Detectar clics fuera del sidebar para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Si está fijado, no hacer nada
        if (isPinned) {
          return
        }
        
        // Si está colapsado y expandido por hover, cerrarlo
        if (isCollapsed && isHovered) {
          setIsHovered(false)
        }
        
        // Si está expandido normalmente (no colapsado), colapsarlo
        if (!isCollapsed) {
          onToggleCollapse()
        }
      }
    }

    // Agregar el listener siempre, pero la lógica interna decide si actuar
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCollapsed, isHovered, isPinned, onToggleCollapse])

  // Detectar tecla Escape para cerrar el sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Si está expandido por hover, cerrarlo
        if (isCollapsed && isHovered && !isPinned) {
          setIsHovered(false)
        }
        // Si está abierto en mobile, cerrarlo
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

  // Limpiar estado de pin cuando se colapsa
  useEffect(() => {
    // Si el sidebar se colapsa, limpiar el estado de pin
    if (isCollapsed && isPinned) {
      onTogglePin()
    }
  }, [isCollapsed, isPinned, onTogglePin])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

          {/* Sidebar */}
          <div 
            ref={sidebarRef}
            className={`
              fixed inset-y-0 left-0 z-50 bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col
              ${isOpen ? 'translate-x-0' : '-translate-x-full'}
              ${actualWidth}
            `}
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
            onClick={(event) => {
              if (isCollapsed && isHovered && !isPinned && !isClicking) {
                setIsClicking(true)
                event.preventDefault()
                event.stopPropagation()
                onTogglePin()
                // Reset clicking state after a short delay
                setTimeout(() => setIsClicking(false), 300)
              }
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center">
                <img 
                  src="/icono.png" 
                  alt="Aprende y Aplica" 
                  className="h-8 w-8 rounded-lg flex-shrink-0"
                />
                {(!isCollapsed || shouldExpand) && (
                  <span className="ml-3 text-white font-semibold text-sm truncate">
                    Aprende y Aplica
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {/* Indicador de pin - solo visible cuando está pinned */}
                {isPinned && (
                  <div className="hidden lg:block p-1 rounded-md bg-blue-600/20">
                    <MapPinIcon className="h-4 w-4 text-blue-400" />
                  </div>
                )}
                {/* Botón de colapso - solo visible en desktop */}
                <button
                  onClick={(event) => {
                    event.stopPropagation() // Prevenir que el clic llegue al contenedor
                    if (isCollapsed) {
                      if (isHovered && !isPinned) {
                        // Cerrar hover temporal
                        setIsHovered(false)
                      } else if (isPinned) {
                        // Desfijar pero mantener colapsado
                        onTogglePin()
                      } else {
                        // Expandir normalmente
                        onToggleCollapse()
                      }
                    } else {
                      // Colapsar y desfijar si estaba fijado
                      if (isPinned) {
                        onTogglePin()
                      }
                      onToggleCollapse()
                    }
                  }}
                  className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                  title={isCollapsed ? (isHovered && !isPinned ? 'Cerrar sidebar' : 'Expandir sidebar') : 'Colapsar sidebar'}
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="h-5 w-5" />
                  ) : (
                    <ChevronLeftIcon className="h-5 w-5" />
                  )}
                </button>
                {/* Botón de cerrar - solo visible en mobile */}
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                  }}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Indicador de hover para fijar */}
            {isCollapsed && isHovered && !isPinned && (
              <div className="px-4 py-2 bg-blue-600/10 border-b border-blue-600/20">
                <p className="text-xs text-blue-400">
                  Haz clic para fijar el panel
                </p>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-2 py-6 overflow-y-auto">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(event) => {
                        event.stopPropagation() // Prevenir que el clic llegue al contenedor
                        onSectionChange(item.name.toLowerCase())
                        onClose()
                        // Si está expandido por hover, cerrarlo
                        if (isCollapsed && isHovered && !isPinned) {
                          setIsHovered(false)
                        }
                      }}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-md' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                        ${(isCollapsed && !shouldExpand) ? 'justify-center' : ''}
                      `}
                      title={(isCollapsed && !shouldExpand) ? item.name : undefined}
                    >
                      <item.icon 
                        className={`
                          h-5 w-5 transition-colors duration-200 flex-shrink-0
                          ${isActive 
                            ? 'text-white' 
                            : 'text-gray-400 group-hover:text-white'
                          }
                          ${(isCollapsed && !shouldExpand) ? '' : 'mr-3'}
                        `} 
                      />
                      {(!isCollapsed || shouldExpand) && (
                        <>
                          <span className="flex-1 truncate">{item.name}</span>
                          {isActive && (
                            <ChevronRightIcon className="h-4 w-4 text-white flex-shrink-0" />
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* User info at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-gray-700">
              <div className={`flex items-center ${(isCollapsed && !shouldExpand) ? 'justify-center' : ''}`}>
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">A</span>
                  </div>
                </div>
                {(!isCollapsed || shouldExpand) && (
                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      Administrador
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      Panel de Control
                    </p>
                  </div>
                )}
              </div>
            </div>
      </div>
    </>
  )
}
