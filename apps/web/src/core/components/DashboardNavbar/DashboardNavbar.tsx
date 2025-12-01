'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  UsersRound, 
  FileText
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
  { id: 'workshops', nameKey: 'dashboardNav.workshops', icon: GraduationCap },
  { id: 'community', nameKey: 'dashboardNav.community', icon: UsersRound },
  { id: 'news', nameKey: 'dashboardNav.news', icon: FileText },
]

export function DashboardNavbar({ activeItem = 'workshops' }: DashboardNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg()
  const prefetchOnHover = usePrefetchOnHover()

  // Determinar item activo basado en pathname para móvil
  const getMobileActiveItem = (): string => {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/my-courses') || pathname.startsWith('/courses')) return 'workshops'
    if (pathname.startsWith('/communities')) return 'community'
    if (pathname.startsWith('/news')) return 'news'
    return activeItem
  }

  const mobileActiveItem = getMobileActiveItem()

  const handleNavigation = (itemId: string) => {
    switch (itemId) {
      case 'workshops':
        router.push('/dashboard')
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
      <div className="px-6 py-2.5 lg:px-8">
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
          <nav className="hidden lg:flex items-center space-x-6">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              
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
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm transition-all duration-300 ${
                    isActive
                      ? 'text-color-contrast font-semibold'
                      : 'text-text-secondary font-normal hover:text-color-contrast'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -1, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Estado activo elegante y minimalista */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border border-primary/40 dark:border-primary/50 shadow-sm"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25
                      }}
                    />
                  )}
                  
                  {/* Overlay de hover para estado inactivo */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  
                  <Icon className={`relative z-10 w-4 h-4 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  <span className={`relative z-10 tracking-tight transition-colors duration-200 ${isActive ? 'text-color-contrast font-semibold' : 'text-text-secondary font-normal'}`}>{t(item.nameKey)}</span>
                  
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
        <div className="grid grid-cols-3 h-[60px]">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = mobileActiveItem === item.id

            return (
              <div key={item.id} className="relative flex items-center justify-center">
                <motion.button
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    flex flex-col items-center justify-center gap-1 w-full h-full
                    transition-colors duration-200
                    ${isActive
                      ? 'text-color-contrast font-semibold'
                      : 'text-text-secondary font-normal'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Indicador activo */}
                  {isActive && (
                    <motion.div
                      layoutId="mobileTopNavActive"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-b-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}

                  {/* Icono */}
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Texto */}
                  <span className="text-[10px] leading-tight text-center px-1 tracking-tight">
                    {t(item.nameKey)}
                  </span>
                </motion.button>
              </div>
            )
          })}
        </div>
      </div>
      
    </motion.header>
  )
}
