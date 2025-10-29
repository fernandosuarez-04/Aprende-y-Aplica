'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  VideoCameraIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MapPinIcon,
  NewspaperIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface InstructorSidebarProps {
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
  { name: 'Dashboard', href: '/instructor/dashboard', icon: HomeIcon, current: true },
  { name: 'Talleres', href: '/instructor/workshops', icon: AcademicCapIcon, current: false },
  { name: 'Estadísticas', href: '/instructor/statistics', icon: ChartBarIcon, current: false },
  { name: 'News', href: '/instructor/news', icon: NewspaperIcon, current: false },
  { name: 'Reels', href: '/instructor/reels', icon: VideoCameraIcon, current: false },
  { name: 'Comunidades', href: '/instructor/communities', icon: UsersIcon, current: false },
]

export function InstructorSidebar({ isOpen, onClose, activeSection, onSectionChange, isCollapsed, onToggleCollapse, isPinned, onTogglePin }: InstructorSidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Lógica para determinar si el sidebar debe estar expandido
  const shouldExpand = isPinned || (isCollapsed && isHovered)
  const actualWidth = shouldExpand ? 'w-64' : (isCollapsed ? 'w-16' : 'w-64')

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

  // Detectar tecla Escape
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

  // Limpiar estado de pin cuando se colapsa
  useEffect(() => {
    if (isCollapsed && isPinned) {
      onTogglePin()
    }
  }, [isCollapsed, isPinned, onTogglePin])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col
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
            setTimeout(() => setIsClicking(false), 300)
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-purple-700/50 flex-shrink-0 bg-black/20">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
              <AcademicCapIcon className="h-5 w-5 text-white" />
            </div>
            {(!isCollapsed || shouldExpand) && (
              <span className="ml-3 text-white font-bold text-sm truncate bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                Panel Instructor
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Indicador de pin */}
            {isPinned && (
              <div className="hidden lg:block p-1 rounded-md bg-yellow-600/20 animate-pulse">
                <MapPinIcon className="h-4 w-4 text-yellow-400" />
              </div>
            )}
            {/* Botón de colapso */}
            <button
              onClick={(event) => {
                event.stopPropagation()
                if (isCollapsed) {
                  if (isHovered && !isPinned) {
                    setIsHovered(false)
                  } else if (isPinned) {
                    onTogglePin()
                  } else {
                    onToggleCollapse()
                  }
                } else {
                  if (isPinned) {
                    onTogglePin()
                  }
                  onToggleCollapse()
                }
              }}
              className="hidden lg:block p-2 rounded-md text-purple-300 hover:text-white hover:bg-purple-700/50 transition-all duration-200 hover:scale-110"
              title={isCollapsed ? (isHovered && !isPinned ? 'Cerrar sidebar' : 'Expandir sidebar') : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
            {/* Botón de cerrar - mobile */}
            <button
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              className="lg:hidden p-2 rounded-md text-purple-300 hover:text-white hover:bg-purple-700/50 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Indicador de hover para fijar */}
        {isCollapsed && isHovered && !isPinned && (
          <div className="px-4 py-2 bg-yellow-600/10 border-b border-yellow-600/20 animate-fade-in">
            <p className="text-xs text-yellow-400 font-medium">
              ✨ Haz clic para fijar el panel
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(event) => {
                    event.stopPropagation()
                    onSectionChange(item.name.toLowerCase())
                    onClose()
                    if (isCollapsed && isHovered && !isPinned) {
                      setIsHovered(false)
                    }
                  }}
                  className={`
                    group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg
                    ${isActive 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl transform scale-105' 
                      : 'text-purple-200 hover:bg-purple-800/50 hover:text-white'
                    }
                    ${(isCollapsed && !shouldExpand) ? 'justify-center' : ''}
                    animate-slide-in
                  `}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  title={(isCollapsed && !shouldExpand) ? item.name : undefined}
                >
                  <item.icon 
                    className={`
                      h-5 w-5 transition-all duration-300 flex-shrink-0
                      ${isActive 
                        ? 'text-white animate-pulse' 
                        : 'text-purple-300 group-hover:text-yellow-400 group-hover:scale-110'
                      }
                      ${(isCollapsed && !shouldExpand) ? '' : 'mr-3'}
                    `} 
                  />
                  {(!isCollapsed || shouldExpand) && (
                    <>
                      <span className="flex-1 truncate font-semibold">{item.name}</span>
                      {isActive && (
                        <ChevronRightIcon className="h-4 w-4 text-white flex-shrink-0 animate-bounce" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-purple-700/50 bg-black/20">
          <div className={`flex items-center ${(isCollapsed && !shouldExpand) ? 'justify-center' : ''}`}>
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg ring-2 ring-purple-500/50">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            {(!isCollapsed || shouldExpand) && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-bold text-white truncate bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                  Instructor
                </p>
                <p className="text-xs text-purple-300 truncate">
                  Panel de Enseñanza
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

