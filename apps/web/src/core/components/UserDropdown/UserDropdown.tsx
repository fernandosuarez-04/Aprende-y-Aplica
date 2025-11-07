'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  Award
} from 'lucide-react'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useThemeStore, Theme } from '../../stores/themeStore'

interface UserDropdownProps {
  className?: string
}

export function UserDropdown({ className = '' }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const themeSubmenuRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const { theme, setTheme, resolvedTheme, initializeTheme } = useThemeStore()
  const router = useRouter()

  // Inicializar tema al montar
  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  console.log('🔍 UserDropdown renderizado, user:', user)
  console.log('🔍 UserProfile:', userProfile)
  console.log('🎭 Rol del usuario:', user?.cargo_rol)
  console.log('✅ Es administrador:', user?.cargo_rol?.toLowerCase() === 'administrador')

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

  const handleLogout = async () => {
    await logout()
    setIsOpen(false)
  }

  const truncateEmail = (email: string, maxLength: number = 20) => {
    if (email.length <= maxLength) return email
    return email.substring(0, maxLength) + '...'
  }

  const menuItems = [
    // Accesos rápidos
    {
      id: 'stats',
      label: 'Mis Estadísticas',
      icon: BarChart,
      onClick: () => {
        router.push('/statistics')
        setIsOpen(false)
      }
    },
    {
      id: 'learning',
      label: 'Mi aprendizaje',
      icon: BookOpen,
      onClick: () => {
        router.push('/my-courses')
        setIsOpen(false)
      }
    },
    {
      id: 'certificates',
      label: 'Mis Certificados',
      icon: Award,
      onClick: () => {
        router.push('/certificates')
        setIsOpen(false)
      }
    },
    {
      id: 'separator1',
      isSeparator: true
    },
    {
      id: 'profile',
      label: 'Editar perfil',
      icon: Edit3,
      onClick: () => {
        router.push('/profile')
        setIsOpen(false)
      }
    },
    {
      id: 'account-settings',
      label: 'Configuración de la cuenta',
      icon: Settings,
      onClick: () => {
        router.push('/account-settings')
        setIsOpen(false)
      }
    },
    {
      id: 'separator2',
      isSeparator: true
    },
    // Sección: Suscripciones y Pagos
    {
      id: 'subscriptions',
      label: 'Suscripciones',
      icon: CreditCard,
      onClick: () => {
        router.push('/subscriptions')
        setIsOpen(false)
      }
    },
    {
      id: 'payment-methods',
      label: 'Métodos de pago',
      icon: Wallet,
      onClick: () => {
        router.push('/payment-methods')
        setIsOpen(false)
      }
    },
    {
      id: 'purchase-history',
      label: 'Historial de compras',
      icon: Receipt,
      onClick: () => {
        router.push('/purchase-history')
        setIsOpen(false)
      }
    },
    {
      id: 'separator3',
      isSeparator: true
    },
    // Tema (submenu)
    {
      id: 'theme',
      label: theme === 'light' ? 'Modo claro' : theme === 'dark' ? 'Modo oscuro' : 'Modo sistema',
      icon: resolvedTheme === 'light' ? Sun : resolvedTheme === 'dark' ? Moon : Monitor,
      onClick: () => {
        setIsThemeSubmenuOpen(!isThemeSubmenuOpen)
      }
    },
    {
      id: 'separator4',
      isSeparator: true
    },
    // Botón de administración - Solo para administradores
    ...(user?.cargo_rol?.toLowerCase() === 'administrador' ? [{
      id: 'admin',
      label: 'Panel de Administración',
      icon: ShieldCheck,
      onClick: () => {
        router.push('/admin/dashboard')
        setIsOpen(false)
      },
      isAdmin: true
    }] : []),
    // Botón de instructor - Solo para instructores
    ...(user?.cargo_rol?.toLowerCase() === 'instructor' ? [{
      id: 'instructor',
      label: 'Panel de Instructor',
      icon: GraduationCap,
      onClick: () => {
        router.push('/instructor/dashboard')
        setIsOpen(false)
      },
      isInstructor: true
    }] : []),
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: LogOut,
      onClick: handleLogout,
      isDestructive: true
    }
  ]

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: 1000 }}>
      {/* Botón del usuario */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div 
          className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center dark:shadow-none overflow-hidden"
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
        
        <div className="hidden sm:block text-left">
          <p 
            className="text-sm font-medium text-gray-900 dark:text-white"
          >
            {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
          </p>
          <p 
            className="text-xs text-gray-700 dark:text-gray-300"
          >
            {truncateEmail(userProfile?.email || user?.email || 'usuario@ejemplo.com')}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-text-secondary dark:text-text-secondary" />
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
              className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border-2 border-gray-200 dark:border-gray-700 z-[10000] flex flex-col"
            >
            {/* Header del usuario */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center dark:shadow-none overflow-hidden">
                  {userProfile?.profile_picture_url ? (
                    <img 
                      src={userProfile.profile_picture_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary dark:text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="text-lg font-semibold truncate text-gray-900 dark:text-white"
                  >
                    {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
                  </h3>
                  <p 
                    className="text-sm truncate text-gray-700 dark:text-gray-300"
                  >
                    {truncateEmail(userProfile?.email || user?.email || 'usuario@ejemplo.com')}
                  </p>
                </div>
              </div>
            </div>

            {/* Items del menú - Con scroll invisible */}
            <div className="py-3 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
              {menuItems.map((item, index) => {
                // Renderizar separador
                if ((item as any).isSeparator) {
                  return (
                    <div
                      key={item.id}
                      className="h-px bg-gray-200 dark:bg-gray-700 my-2 mx-6"
                    />
                  )
                }

                const Icon = item.icon
                return (
                  <React.Fragment key={item.id}>
                    <motion.button
                      onClick={item.onClick}
                    className={`w-full flex items-center space-x-4 px-6 py-4 text-left transition-colors ${
                      item.isDestructive 
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300' 
                        : item.isAdmin
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      duration: 0.2,
                      delay: index * 0.05
                    }}
                    whileHover={{ 
                      x: 4,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ 
                      scale: 0.98,
                      transition: { duration: 0.1 }
                    }}
                  >
                    <motion.div
                      whileHover={{ 
                        scale: 1.1,
                        rotate: item.id === 'theme' ? 15 : 0
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className={`w-6 h-6 ${
                        item.isDestructive || item.isAdmin ? 'text-red-400' : 'text-primary'
                      }`} />
                      </motion.div>
                      <span className="font-medium text-base flex-1">{item.label}</span>
                      {item.id === 'theme' && (
                        <ChevronDown className={`w-4 h-4 text-text-secondary dark:text-text-secondary transition-transform ${
                          isThemeSubmenuOpen ? 'rotate-180' : ''
                        }`} />
                      )}
                    </motion.button>

                    {/* Submenu de tema */}
                    {item.id === 'theme' && isThemeSubmenuOpen && (
                      <div 
                        ref={themeSubmenuRef}
                        className="mt-1 ml-6 border-l-2 border-gray-300 dark:border-gray-700 pl-2"
                      >
                        {[
                          { value: 'light' as Theme, label: 'Claro', icon: Sun },
                          { value: 'dark' as Theme, label: 'Oscuro', icon: Moon },
                          { value: 'system' as Theme, label: 'Sistema', icon: Monitor }
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
                              className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors rounded-lg ${
                                isActive
                                  ? 'bg-primary/20 dark:bg-primary/20 text-primary dark:text-primary'
                                  : 'text-text-secondary dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-text-primary dark:hover:text-text-primary'
                              }`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15 }}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <ThemeIcon className={`w-5 h-5 ${
                                isActive ? 'text-primary dark:text-primary' : 'text-text-tertiary dark:text-text-tertiary'
                              }`} />
                              <span className={`text-sm font-medium ${
                                isActive ? 'text-primary dark:text-primary' : 'text-text-secondary dark:text-text-secondary'
                              }`}>
                                {themeOption.label}
                              </span>
                              {isActive && (
                                <motion.div
                                  layoutId="activeThemeIndicator"
                                  className="ml-auto w-2 h-2 rounded-full bg-primary"
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
}
