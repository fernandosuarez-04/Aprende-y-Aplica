'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper,
  Sparkles,
  Grid3X3
} from 'lucide-react'
import { usePrefetchOnHover } from '../../hooks/usePrefetch'

const navigationItems = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen, route: '/dashboard' },
  { id: 'directory', name: 'Directorio IA', icon: Brain, route: null }, // null porque tiene dropdown
  { id: 'community', name: 'Comunidad', icon: Users, route: '/communities' },
  { id: 'news', name: 'Noticias', icon: Newspaper, route: '/news' },
]

const directoryOptions = [
  {
    id: 'prompt-directory',
    name: 'Prompt Directory',
    description: 'Prompts de IA',
    icon: Sparkles,
    route: '/prompt-directory',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'apps-directory',
    name: 'Apps Directory',
    description: 'Herramientas de IA',
    icon: Grid3X3,
    route: '/apps-directory',
    gradient: 'from-blue-500 to-cyan-500'
  }
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isDirectoryDropdownOpen, setIsDirectoryDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prefetchOnHover = usePrefetchOnHover()

  // Determinar item activo basado en pathname
  const getActiveItem = (): string => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/my-courses') || pathname.startsWith('/courses')) return 'workshops'
    if (pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory')) return 'directory'
    if (pathname.startsWith('/communities')) return 'community'
    if (pathname.startsWith('/news')) return 'news'
    return 'workshops'
  }

  const activeItem = getActiveItem()

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDirectoryDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDirectoryDropdownOpen(false)
      }
    }

    if (isDirectoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Prevenir scroll del body cuando el dropdown está abierto
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [isDirectoryDropdownOpen])

  const handleNavigation = (itemId: string, route: string | null) => {
    if (itemId === 'directory') {
      setIsDirectoryDropdownOpen(!isDirectoryDropdownOpen)
    } else if (route) {
      router.push(route)
    }
  }

  const handleDirectoryOptionClick = (route: string) => {
    router.push(route)
    setIsDirectoryDropdownOpen(false)
  }

  return (
    <>
      {/* Backdrop para el dropdown */}
      <AnimatePresence>
        {isDirectoryDropdownOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[49] lg:hidden"
            onClick={() => setIsDirectoryDropdownOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Barra de navegación inferior */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 lg:hidden"
        style={{ 
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          height: 'calc(70px + max(env(safe-area-inset-bottom), 8px))'
        }}
      >
        <div className="grid grid-cols-4 h-[70px]">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            const isDirectory = item.id === 'directory'

            return (
              <div key={item.id} className="relative flex items-center justify-center">
                <motion.button
                  onClick={() => handleNavigation(item.id, item.route)}
                  className={`
                    flex flex-col items-center justify-center gap-1 w-full h-full
                    transition-colors duration-200
                    ${isActive && !isDirectory
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                    }
                    ${isDirectory && isDirectoryDropdownOpen
                      ? 'text-blue-600 dark:text-blue-400'
                      : ''
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Indicador activo */}
                  {isActive && !isDirectory && (
                    <motion.div
                      layoutId="mobileBottomNavActive"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Icono */}
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Texto */}
                  <span className="text-[10px] font-medium leading-tight text-center px-1">
                    {item.name}
                  </span>
                </motion.button>

                {/* Dropdown de Directorio IA */}
                {isDirectory && (
                  <div ref={dropdownRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-[60]">
                    <AnimatePresence>
                      {isDirectoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden mb-2"
                        >
                          {directoryOptions.map((option, index) => {
                            const OptionIcon = option.icon
                            return (
                              <motion.button
                                key={option.id}
                                onClick={() => handleDirectoryOptionClick(option.route)}
                                {...prefetchOnHover(option.route)}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left first:border-b border-gray-200 dark:border-gray-700"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ x: 2 }}
                              >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0`}>
                                  <OptionIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white">
                                    {option.name}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {option.description}
                                  </div>
                                </div>
                              </motion.button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.nav>
    </>
  )
}

