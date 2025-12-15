'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  User,
  BarChart,
  BookOpen,
  Edit3,
  Moon,
  Sun,
  Monitor,
  LogOut,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  CreditCard,
  Wallet,
  Settings,
  Receipt,
  Award,
  Bell,
  ShoppingCart,
  Languages,
  Radio
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useThemeStore, Theme } from '../../stores/themeStore'
import { useShoppingCartStore } from '../../stores/shoppingCartStore'
import { useLanguage } from '../../providers/I18nProvider'
import { usePathname } from 'next/navigation'
import { resetOnboarding } from '../OnboardingAgent/utils'

interface UserDropdownProps {
  className?: string
}

export const UserDropdown = React.memo(function UserDropdown({ className = '' }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const themeSubmenuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const { getItemCount } = useShoppingCartStore()
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation('common')
  
  const itemCount = getItemCount()
  const isOnDashboard = pathname === '/dashboard'

  // Inicializar tema al montar
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsThemeSubmenuOpen(false)
      }
      if (themeSubmenuRef.current && !themeSubmenuRef.current.contains(event.target as Node)) {
        setIsThemeSubmenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Memoizar verificación de admin para evitar recálculos innecesarios
  const isAdmin = useMemo(
    () => user?.cargo_rol?.toLowerCase() === 'administrador',
    [user?.cargo_rol]
  )

  const isInstructor = useMemo(
    () => user?.cargo_rol?.toLowerCase() === 'instructor',
    [user?.cargo_rol]
  )

  const handleLogout = useCallback(async () => {
    await logout()
    setIsOpen(false)
  }, [logout])

  const themeLabel =
    theme === 'light'
      ? t('menu.theme.light')
      : theme === 'dark'
        ? t('menu.theme.dark')
        : t('menu.theme.system')

  const truncateEmail = useCallback((email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email
    return email.substring(0, maxLength) + '...'
  }, [])

  // Función para obtener el username del usuario
  const getShortName = useCallback(() => {
    return user?.username || userProfile?.username || 'Usuario'
  }, [user?.username, userProfile?.username])

  // Función para obtener animaciones específicas por icono
  const getIconAnimation = (itemId: string) => {
    const animations: Record<string, { rotate?: number; scale?: number; y?: number }> = {
      'cart': { rotate: -5, scale: 1.15, y: -2 },
      'language': { rotate: 5, scale: 1.15, y: -2 },
      'stats': { rotate: -5, scale: 1.15, y: -2 },
      'learning': { rotate: 5, scale: 1.15, y: -2 },
      'certificates': { rotate: 0, scale: 1.2, y: -2 },
      'profile': { rotate: 10, scale: 1.15, y: -2 },
      'account-settings': { rotate: -10, scale: 1.15, y: -2 },
      'subscriptions': { rotate: 5, scale: 1.15, y: -2 },
      'payment-methods': { rotate: -5, scale: 1.15, y: -2 },
      'purchase-history': { rotate: 0, scale: 1.15, y: -2 },
      'theme': { rotate: 15, scale: 1.15, y: -2 },
      'tour': { rotate: 0, scale: 1.15, y: -2 },
      'admin': { rotate: 0, scale: 1.2, y: -2 },
      'instructor': { rotate: 0, scale: 1.2, y: -2 },
      'logout': { rotate: -10, scale: 1.15, y: -2 }
    }
    return animations[itemId] || { scale: 1.15, y: -2 }
  }

  const handleTourClick = useCallback(() => {
    if (isOnDashboard) {
      resetOnboarding()
      window.location.reload()
    }
    setIsOpen(false)
  }, [isOnDashboard])
  
  const languageOptions: { value: 'es' | 'en' | 'pt'; label: string; flag: string }[] = [
    { value: 'es', label: t('languages.es'), flag: '🇪🇸' },
    { value: 'en', label: t('languages.en'), flag: '🇺🇸' },
    { value: 'pt', label: t('languages.pt'), flag: '🇧🇷' },
  ]
  
  const currentLanguage = languageOptions.find(opt => opt.value === language)

  const menuItems = [
    // Sección 1: Perfil y Configuración (arriba)
    {
      id: 'profile',
      label: t('menu.profile'),
      icon: Edit3,
      onClick: () => {
        router.push('/profile')
        setIsOpen(false)
      }
    },
    {
      id: 'account-settings',
      label: t('menu.account'),
      icon: Settings,
      onClick: () => {
        router.push('/account-settings')
        setIsOpen(false)
      }
    },
    {
      id: 'separator0',
      isSeparator: true
    },
    // Sección 2: Aprendizaje y Progreso
    {
      id: 'stats',
      label: t('menu.stats'),
      icon: BarChart,
      onClick: () => {
        router.push('/statistics')
        setIsOpen(false)
      }
    },
    {
      id: 'learning',
      label: t('menu.learning'),
      icon: BookOpen,
      onClick: () => {
        router.push('/my-courses')
        setIsOpen(false)
      }
    },
    {
      id: 'certificates',
      label: t('menu.certificates'),
      icon: Award,
      onClick: () => {
        router.push('/certificates')
        setIsOpen(false)
      }
    },
    {
      id: 'notifications',
      label: t('menu.notifications'),
      icon: Bell,
      onClick: () => {
        router.push('/dashboard/notifications')
        setIsOpen(false)
      }
    },
    {
      id: 'separator1',
      isSeparator: true
    },
    // Sección 3: Suscripciones y Pagos (con carrito)
    {
      id: 'cart',
      label: itemCount > 0 ? `Carrito (${itemCount})` : 'Carrito',
      icon: ShoppingCart,
      onClick: () => {
        router.push('/cart')
        setIsOpen(false)
      },
      badge: itemCount > 0 ? itemCount : undefined
    },
    {
      id: 'subscriptions',
      label: t('menu.subscriptions'),
      icon: CreditCard,
      onClick: () => {
        router.push('/subscriptions')
        setIsOpen(false)
      }
    },
    {
      id: 'payment-methods',
      label: t('menu.paymentMethods'),
      icon: Wallet,
      onClick: () => {
        router.push('/payment-methods')
        setIsOpen(false)
      }
    },
    {
      id: 'purchase-history',
      label: t('menu.purchaseHistory'),
      icon: Receipt,
      onClick: () => {
        router.push('/purchase-history')
        setIsOpen(false)
      }
    },
    {
      id: 'separator2',
      isSeparator: true
    },
    // Sección 4: Configuración de la Aplicación (con idioma)
    {
      id: 'language',
      label: `Idioma: ${currentLanguage?.label || 'ES'}`,
      icon: Languages,
      onClick: () => {
        // Alternar entre idiomas
        const currentIndex = languageOptions.findIndex(opt => opt.value === language)
        const nextIndex = (currentIndex + 1) % languageOptions.length
        setLanguage(languageOptions[nextIndex].value)
        setIsOpen(false)
      }
    },
    {
      id: 'theme',
      label: themeLabel,
      icon: resolvedTheme === 'light' ? Sun : resolvedTheme === 'dark' ? Moon : Monitor,
      onClick: () => {
        setIsThemeSubmenuOpen(!isThemeSubmenuOpen)
      }
    },
    // Ver Tour con LIA - Solo en dashboard
    ...(isOnDashboard ? [{
      id: 'tour',
      label: t('tours.viewTourWithLia'),
      icon: Radio,
      onClick: handleTourClick
    }] : []),
    {
      id: 'separator3',
      isSeparator: true
    },
    // Sección 5: Administración (solo para roles específicos)
    ...(isAdmin ? [{
      id: 'admin',
      label: t('menu.adminPanel'),
      icon: ShieldCheck,
      onClick: () => {
        router.push('/admin/dashboard')
        setIsOpen(false)
      },
      isAdmin: true
    }] : []),
    ...(isInstructor ? [{
      id: 'instructor',
      label: t('menu.instructorPanel'),
      icon: GraduationCap,
      onClick: () => {
        router.push('/instructor/dashboard')
        setIsOpen(false)
      },
      isInstructor: true
    }] : []),
    {
      id: 'separator4',
      isSeparator: true
    },
    // Sección 6: Cerrar sesión (al final)
    {
      id: 'logout',
      label: t('menu.logout'),
      icon: LogOut,
      onClick: handleLogout,
      isDestructive: true
    }
  ]

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: 1000 }}>
      {/* Botón del usuario - Rediseñado */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Iniciales a la izquierda */}
        <span className="text-base font-semibold text-gray-900 dark:text-white">
          {getShortName()}
        </span>
        
        {/* Foto a la derecha - Más grande */}
        <motion.div 
          className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center dark:shadow-none overflow-hidden flex-shrink-0"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {userProfile?.profile_picture_url ? (
            <img 
              src={userProfile.profile_picture_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-full"
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay de fondo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                duration: 0.2,
                ease: "easeOut"
              }}
              className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] bg-white dark:bg-[#1E2329] rounded-xl shadow-lg dark:shadow-none border border-[#E9ECEF] dark:border-[#6C757D]/30 z-[10000] flex flex-col"
            >
            {/* Header del usuario */}
            <div className="px-4 py-3 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329] flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0A2540] to-[#0A2540]/70 rounded-full flex items-center justify-center dark:shadow-none overflow-hidden flex-shrink-0 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30">
                  {userProfile?.profile_picture_url ? (
                    <img 
                      src={userProfile.profile_picture_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-sm font-semibold truncate text-[#6C757D] dark:text-white/60 mb-0.5"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {userProfile?.username || user?.username || 'Usuario'}
                  </h3>
                  <p 
                    className="text-base font-semibold truncate text-[#0A2540] dark:text-white"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {userProfile?.first_name && userProfile?.last_name 
                      ? `${userProfile.first_name} ${userProfile.last_name}`
                      : userProfile?.display_name || user?.display_name || userProfile?.first_name || 'Usuario'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items del menú - Con scroll invisible */}
            <div className="py-2 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
              {menuItems.map((item, index) => {
                // Renderizar separador
                if ((item as any).isSeparator) {
                  return (
                    <div
                      key={item.id}
                      className="h-px bg-[#E9ECEF] dark:bg-[#6C757D]/30 my-1.5 mx-4"
                    />
                  )
                }

                const Icon = item.icon
                return (
                  <React.Fragment key={item.id}>
                    <motion.button
                      onClick={item.onClick}
                      className={`group w-full flex items-center space-x-3 px-4 py-2.5 text-left transition-all duration-200 ${
                        item.isDestructive 
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300' 
                          : item.isAdmin
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300'
                          : 'text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0F1419]'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3,
                        delay: index * 0.03,
                        ease: "easeOut"
                      }}
                      whileHover={{ 
                        x: 6,
                        transition: { 
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }
                      }}
                      whileTap={{ 
                        scale: 0.96,
                        transition: { duration: 0.1 }
                      }}
                    >
                    <motion.div
                      className="relative"
                      whileHover={getIconAnimation(item.id)}
                      whileTap={{ scale: 0.9 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 400,
                        damping: 17
                      }}
                    >
                      {/* Efecto de pulso/glow animado */}
                      <motion.div
                        className="absolute inset-0 rounded-full -z-0"
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0, 0.4, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          background: item.isDestructive || item.isAdmin 
                            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(0, 212, 179, 0.3) 0%, transparent 70%)'
                        }}
                      />
                      {/* Efecto de brillo en hover */}
                      <motion.div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100"
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileHover={{
                          scale: 1.2,
                          opacity: [0, 0.5, 0]
                        }}
                        transition={{
                          duration: 0.6,
                          ease: "easeOut"
                        }}
                        style={{
                          background: item.isDestructive || item.isAdmin 
                            ? 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(0, 212, 179, 0.4) 0%, transparent 70%)'
                        }}
                      />
                      <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-all duration-300 ${
                        item.isDestructive || item.isAdmin 
                          ? 'text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' 
                          : 'text-[#6C757D] dark:text-white/70 group-hover:text-[#0A2540] dark:group-hover:text-[#00D4B3] group-hover:drop-shadow-[0_0_8px_rgba(0,212,179,0.4)]'
                      }`} />
                    </motion.div>
                      <span className="font-medium text-sm flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{item.label}</span>
                      {(item as any).badge && (item as any).badge > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-[#0A2540] dark:bg-[#0A2540] text-white rounded-full" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {(item as any).badge > 99 ? '99+' : (item as any).badge}
                        </span>
                      )}
                      {item.id === 'theme' && (
                        <ChevronDown className={`w-4 h-4 text-[#6C757D] dark:text-white/60 transition-transform flex-shrink-0 ${
                          isThemeSubmenuOpen ? 'rotate-180' : ''
                        }`} />
                      )}
                    </motion.button>

                    {/* Submenu de tema */}
                    {item.id === 'theme' && isThemeSubmenuOpen && (
                      <div 
                        ref={themeSubmenuRef}
                        className="mt-1 ml-4 border-l-2 border-[#E9ECEF] dark:border-[#6C757D]/30 pl-2"
                      >
                        {[
                          { value: 'light' as Theme, label: t('menu.theme.light'), icon: Sun },
                          { value: 'dark' as Theme, label: t('menu.theme.dark'), icon: Moon },
                          { value: 'system' as Theme, label: t('menu.theme.system'), icon: Monitor }
                        ].map((themeOption) => {
                          const ThemeIcon = themeOption.icon
                          const isActive = theme === themeOption.value
                          return (
                            <motion.button
                              key={themeOption.value}
                              onClick={() => {
                                setTheme(themeOption.value)
                                setIsThemeSubmenuOpen(false)
                              }}
                              className={`w-full flex items-center space-x-2 px-3 py-2 text-left transition-colors rounded-lg ${
                                isActive
                                  ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3] dark:text-[#00D4B3]'
                                  : 'text-[#6C757D] dark:text-white/70 hover:bg-[#E9ECEF] dark:hover:bg-[#0F1419] hover:text-[#0A2540] dark:hover:text-white'
                              }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15 }}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <motion.div
                                whileHover={{ 
                                  scale: 1.2,
                                  rotate: themeOption.value === 'light' ? 15 : themeOption.value === 'dark' ? -15 : 0
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                <ThemeIcon className={`w-4 h-4 flex-shrink-0 ${
                                  isActive ? 'text-[#00D4B3] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/60'
                                }`} />
                              </motion.div>
                              <span className={`text-xs font-medium ${
                                isActive ? 'text-[#00D4B3] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/70'
                              }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                                {themeOption.label}
                              </span>
                              {isActive && (
                                <motion.div
                                  layoutId="activeThemeIndicator"
                                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D4B3] flex-shrink-0"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                />
                              )}
                            </motion.button>
                          )
                        })}
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
})
