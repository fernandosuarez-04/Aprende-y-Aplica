'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper,
  ChevronDown,
  Sparkles,
  Grid3X3
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UserDropdown } from '../UserDropdown'
import { ShoppingCart } from '../ShoppingCart'
import { NotificationBell } from '../NotificationBell'
import { useLogoEasterEgg } from '../../hooks/useLogoEasterEgg'
import { useRouter, usePathname } from 'next/navigation'
import { usePrefetchOnHover } from '../../hooks/usePrefetch'

interface DashboardNavbarProps {
  activeItem?: string
}

const navigationItems = [
  { id: 'workshops', nameKey: 'dashboardNav.workshops', icon: BookOpen },
  { id: 'directory', nameKey: 'dashboardNav.directory', icon: Brain },
  { id: 'community', nameKey: 'dashboardNav.community', icon: Users },
  { id: 'news', nameKey: 'dashboardNav.news', icon: Newspaper },
]

const directoryOptions = [
  {
    id: 'prompt-directory',
    nameKey: 'dashboardNav.promptDirectory.title',
    descriptionKey: 'dashboardNav.promptDirectory.description',
    icon: Sparkles,
    route: '/prompt-directory',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'apps-directory',
    nameKey: 'dashboardNav.appsDirectory.title',
    descriptionKey: 'dashboardNav.appsDirectory.description',
    icon: Grid3X3,
    route: '/apps-directory',
    gradient: 'from-blue-500 to-cyan-500'
  }
]

export function DashboardNavbar({ activeItem = 'workshops' }: DashboardNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isDirectoryDropdownOpen, setIsDirectoryDropdownOpen] = useState(false)
  const { t } = useTranslation('common')
  const [isMobileDirectoryDropdownOpen, setIsMobileDirectoryDropdownOpen] = useState(false)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg()
  const prefetchOnHover = usePrefetchOnHover()

  // Determinar item activo basado en pathname para móvil
  const getMobileActiveItem = (): string => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/my-courses') || pathname.startsWith('/courses')) return 'workshops'
    if (pathname.startsWith('/prompt-directory') || pathname.startsWith('/apps-directory')) return 'directory'
    if (pathname.startsWith('/communities')) return 'community'
    if (pathname.startsWith('/news')) return 'news'
    return activeItem
  }

  const mobileActiveItem = getMobileActiveItem()

  // Close dropdown when clicking outside (desktop)
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

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileDirectoryDropdownOpen && mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDirectoryDropdownOpen(false)
      }
    }

    if (isMobileDirectoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileDirectoryDropdownOpen])

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
      className="sticky top-0 z-50 bg-white dark:bg-gray-900 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800"
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
                {t('navbar.clickCounter', { current: clickCount, total: 5 })}
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
                          ? 'text-black dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
                          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl opacity-0"
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      
                      <Icon className={`relative z-10 w-4 h-4 ${isActive || isDirectoryDropdownOpen ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                      <span className={`relative z-10 ${isActive || isDirectoryDropdownOpen ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{t(item.nameKey)}</span>
                      <ChevronDown className={`relative z-10 w-4 h-4 transition-transform duration-200 ${
                        isDirectoryDropdownOpen ? 'rotate-180' : ''
                      } ${isActive || isDirectoryDropdownOpen ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`} />
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
                          suppressHydrationWarning
                        >
                          <div className="p-2">
                            <motion.button
                              onClick={() => {
                                router.push('/prompt-directory')
                                setIsDirectoryDropdownOpen(false)
                              }}
                              {...prefetchOnHover('/prompt-directory')}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full text-left active:bg-gray-100 dark:active:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                              whileHover={{ x: 4 }}
                              style={{ color: 'inherit' }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium !text-black dark:!text-white group-hover:!text-purple-600 dark:group-hover:!text-purple-300 transition-colors">
                                  {t('dashboardNav.promptDirectory.title')}
                                </div>
                                <div className="text-xs !text-gray-700 dark:!text-gray-400">
                                  {t('dashboardNav.promptDirectory.description')}
                                </div>
                              </div>
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                router.push('/apps-directory')
                                setIsDirectoryDropdownOpen(false)
                              }}
                              {...prefetchOnHover('/apps-directory')}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full text-left active:bg-gray-100 dark:active:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                              whileHover={{ x: 4 }}
                              style={{ color: 'inherit' }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <Grid3X3 className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium !text-black dark:!text-white group-hover:!text-blue-600 dark:group-hover:!text-blue-300 transition-colors">
                                  {t('dashboardNav.appsDirectory.title')}
                                </div>
                                <div className="text-xs !text-gray-700 dark:!text-gray-400">
                                  {t('dashboardNav.appsDirectory.description')}
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
                      ? 'text-black dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
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
                      className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-xl opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  
                  <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                  <span className={`relative z-10 ${isActive ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{t(item.nameKey)}</span>
                  
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
            <NotificationBell />

            {/* Carrito de compras */}
            <ShoppingCart />

            {/* User Dropdown */}
            <UserDropdown />
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation - Diseño estilo Coda.io */}
      <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        {/* Backdrop para el dropdown móvil */}
        <AnimatePresence>
          {isMobileDirectoryDropdownOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[49] lg:hidden"
              onClick={() => setIsMobileDirectoryDropdownOpen(false)}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-4 h-[70px]">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = mobileActiveItem === item.id
            const isDirectory = item.id === 'directory'

            return (
              <div key={item.id} className="relative flex items-center justify-center">
                <motion.button
                  onClick={() => {
                    if (item.id === 'directory') {
                      setIsMobileDirectoryDropdownOpen(!isMobileDirectoryDropdownOpen)
                    } else {
                      handleNavigation(item.id)
                    }
                  }}
                  className={`
                    flex flex-col items-center justify-center gap-1 w-full h-full
                    transition-colors duration-200
                    ${isActive && !isDirectory
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                    }
                    ${isDirectory && isMobileDirectoryDropdownOpen
                      ? 'text-blue-600 dark:text-blue-400'
                      : ''
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Indicador activo */}
                  {isActive && !isDirectory && (
                    <motion.div
                      layoutId="mobileTopNavActive"
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
                    {t(item.nameKey)}
                  </span>
                </motion.button>

                {/* Dropdown de Directorio IA - se expande hacia abajo */}
                {isDirectory && (
                  <div ref={mobileDropdownRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 z-[60]">
                    <AnimatePresence>
                      {isMobileDirectoryDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                          suppressHydrationWarning
                        >
                          {directoryOptions.map((option, index) => {
                            const OptionIcon = option.icon
                            return (
                              <motion.button
                                key={option.id}
                                onClick={() => {
                                  router.push(option.route)
                                  setIsMobileDirectoryDropdownOpen(false)
                                }}
                                {...prefetchOnHover(option.route)}
                                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left first:border-b border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ x: 2 }}
                                style={{ color: 'inherit' }}
                              >
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${option.gradient} flex items-center justify-center flex-shrink-0`}>
                                  <OptionIcon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm !text-black dark:!text-white">
                                    {t(option.nameKey)}
                                  </div>
                                  <div className="text-xs !text-gray-700 dark:!text-gray-400 truncate">
                                    {t(option.descriptionKey)}
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
      </div>
      
    </motion.header>
  )
}
