'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper,
  Bell,
  Settings,
  ChevronDown,
  Sparkles,
  Grid3X3
} from 'lucide-react'
import { UserDropdown } from '../UserDropdown'
import { HiddenAdminButton } from '../HiddenAdminButton'
import { useLogoEasterEgg } from '../../hooks/useLogoEasterEgg'
import { useRouter } from 'next/navigation'
import { usePrefetchOnHover } from '../../hooks/usePrefetch'

interface DashboardNavbarProps {
  activeItem?: string
}

const navigationItems = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen },
  { id: 'directory', name: 'Directorio IA', icon: Brain },
  { id: 'community', name: 'Comunidad', icon: Users },
  { id: 'news', name: 'Noticias', icon: Newspaper },
]

export function DashboardNavbar({ activeItem = 'workshops' }: DashboardNavbarProps) {
  const router = useRouter()
  const [isDirectoryDropdownOpen, setIsDirectoryDropdownOpen] = useState(false)
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg()
  const prefetchOnHover = usePrefetchOnHover()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDirectoryDropdownOpen) {
        const target = event.target as Element;
        const dropdownElement = document.querySelector('.directory-dropdown');
        if (dropdownElement && !dropdownElement.contains(target)) {
          setIsDirectoryDropdownOpen(false);
        }
      }
    };

    if (isDirectoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDirectoryDropdownOpen]);

  const handleNavigation = (itemId: string) => {
    switch (itemId) {
      case 'workshops':
        router.push('/dashboard')
        break
      case 'directory':
        setIsDirectoryDropdownOpen(!isDirectoryDropdownOpen)
        break
      case 'community':
        router.push('/communities')
        break
      case 'news':
        router.push('/news')
        break
      default:
        break
    }
  }

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-carbon/95 dark:bg-carbon-900/95 backdrop-blur-sm border-b border-carbon-700/50 dark:border-carbon-700/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-lg overflow-hidden relative"
              animate={isActivated ? { 
                rotate: [0, 360, 0],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="/icono.png" 
                alt="Aprende y Aplica" 
                className="w-full h-full object-contain"
              />
              {/* Efecto visual cuando está activado */}
              {isActivated && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
            
            {/* Contador oculto - solo para debugging */}
            {clickCount > 0 && clickCount < 5 && (
              <div className="sr-only">
                Contador: {clickCount}/5
              </div>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              
              // Special handling for directory dropdown
              if (item.id === 'directory') {
                return (
                  <div key={item.id} className="relative directory-dropdown">
                    <motion.button
                      onClick={() => handleNavigation(item.id)}
                      className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive || isDirectoryDropdownOpen
                          ? 'text-gray-900 dark:text-white'
                          : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary'
                      }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Fondo activo con gradiente */}
                      {(isActive || isDirectoryDropdownOpen) && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl"
                          layoutId="activeTab"
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        />
                      )}
                      
                      {/* Overlay de hover */}
                      {!isActive && !isDirectoryDropdownOpen && (
                        <motion.div
                          className="absolute inset-0 bg-carbon-700/50 rounded-xl opacity-0"
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      <Icon className={`relative z-10 w-4 h-4 ${isActive || isDirectoryDropdownOpen ? 'text-gray-900 dark:text-white' : 'text-text-secondary dark:text-text-secondary'}`} />
                      <span className={`relative z-10 ${isActive || isDirectoryDropdownOpen ? 'text-gray-900 dark:text-white' : 'text-text-secondary dark:text-text-secondary'}`}>{item.name}</span>
                      <ChevronDown className={`relative z-10 w-4 h-4 transition-transform duration-200 ${
                        isDirectoryDropdownOpen ? 'rotate-180' : ''
                      } ${isActive || isDirectoryDropdownOpen ? 'text-gray-900 dark:text-white' : 'text-text-secondary dark:text-text-secondary'}`} />
                    </motion.button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isDirectoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[100]"
                        >
                          <div className="p-2">
                            <motion.button
                              onClick={() => {
                                router.push('/prompt-directory')
                                setIsDirectoryDropdownOpen(false)
                              }}
                              {...prefetchOnHover('/prompt-directory')}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full text-left"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                                  Prompt Directory
                                </div>
                                <div className="text-xs text-gray-600 dark:text-text-secondary">
                                  Colección de prompts de IA
                                </div>
                              </div>
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                router.push('/apps-directory')
                                setIsDirectoryDropdownOpen(false)
                              }}
                              {...prefetchOnHover('/apps-directory')}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full text-left"
                              whileHover={{ x: 4 }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <Grid3X3 className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                  Apps Directory
                                </div>
                                <div className="text-xs text-gray-600 dark:text-text-secondary">
                                  Herramientas de IA disponibles
                                </div>
                              </div>
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }
              
              // Regular navigation items
              const routeMap: Record<string, string> = {
                'workshops': '/dashboard',
                'community': '/communities',
                'news': '/news'
              }
              const href = routeMap[item.id]
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  {...(href && prefetchOnHover(href))}
                  className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-gray-900 dark:text-white'
                      : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Fondo activo con gradiente */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl"
                      layoutId="activeTab"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  
                  {/* Overlay de hover */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-carbon-700/50 rounded-xl opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  
                  <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-gray-900 dark:text-white' : 'text-text-secondary dark:text-text-secondary'}`} />
                  <span className={`relative z-10 ${isActive ? 'text-gray-900 dark:text-white' : 'text-text-secondary dark:text-text-secondary'}`}>{item.name}</span>
                  
                  {/* Indicador de notificación */}
                  {item.id === 'community' && (
                    <motion.div
                      className="relative z-10 w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              )
            })}
          </nav>

          {/* User Menu con animaciones */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Notificaciones */}
            <motion.button 
              className="relative p-3 text-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5 text-text-secondary dark:text-text-secondary" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                3
              </span>
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>

            {/* Configuración */}
            <motion.button 
              className="p-3 text-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5 text-text-secondary dark:text-text-secondary" />
            </motion.button>

            {/* User Dropdown */}
            <UserDropdown />
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div 
        className="lg:hidden border-t border-carbon-700/50 dark:border-carbon-700/50"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              
              // Special handling for directory dropdown on mobile
              if (item.id === 'directory') {
                return (
                  <div key={item.id} className="col-span-2">
                    <motion.button
                      onClick={() => handleNavigation(item.id)}
                      className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 w-full ${
                        isActive || isDirectoryDropdownOpen
                          ? 'text-gray-900 dark:text-white bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/80'
                          : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isDirectoryDropdownOpen ? 'rotate-180' : ''
                      }`} />
                    </motion.button>
                    
                    {/* Mobile Dropdown */}
                    <AnimatePresence>
                      {isDirectoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 space-y-2"
                        >
                          <motion.button
                            onClick={() => {
                              router.push('/prompt-directory')
                              setIsDirectoryDropdownOpen(false)
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                              <Sparkles className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">Prompt Directory</div>
                              <div className="text-xs text-gray-600 dark:text-text-secondary">Prompts de IA</div>
                            </div>
                          </motion.button>
                          
                          <motion.button
                            onClick={() => {
                              router.push('/apps-directory')
                              setIsDirectoryDropdownOpen(false)
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                              <Grid3X3 className="w-3 h-3 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">Apps Directory</div>
                              <div className="text-xs text-gray-600 dark:text-text-secondary">Herramientas de IA</div>
                            </div>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              }
              
              // Regular navigation items
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-gray-900 dark:text-white bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/80'
                      : 'text-text-secondary dark:text-text-secondary hover:text-text-primary dark:hover:text-text-primary hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
      
      {/* Botón oculto de administración */}
      <HiddenAdminButton />
    </motion.header>
  )
}
