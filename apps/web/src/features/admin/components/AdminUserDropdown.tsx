'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  HomeIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/hooks/useAuth'
import { useThemeStore, Theme } from '@/core/stores/themeStore'

interface AdminUserDropdownProps {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    profile_picture_url?: string
    cargo_rol: string
  }
}

export function AdminUserDropdown({ user }: AdminUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()
  const { theme, setTheme, initializeTheme } = useThemeStore()
  const themeMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeTheme()
  }, [initializeTheme])

  // Cerrar menú de tema al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false)
      }
    }

    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isThemeMenuOpen])

  // console.log('🔍 AdminUserDropdown: Usuario recibido:', user)
  // console.log('🎭 Rol del usuario:', user.cargo_rol)
  // console.log('✅ Es administrador:', user.cargo_rol?.toLowerCase() === 'administrador')

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      // console.error('Error al cerrar sesión:', error)
    }
  }

  const handleDashboard = () => {
    router.push('/dashboard')
    setIsOpen(false)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setIsThemeMenuOpen(false)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'system':
        return <Monitor className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Modo Claro'
      case 'dark':
        return 'Modo Oscuro'
      case 'system':
        return 'Seguir Sistema'
      default:
        return 'Seguir Sistema'
    }
  }

  const getInitials = () => {
    const firstName = user.first_name || ''
    const lastName = user.last_name || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    return user.email
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-[#E9ECEF] dark:hover:bg-[#1E2329] transition-all duration-300 group"
      >
        {/* Avatar */}
        <div className="relative">
          {user.profile_picture_url ? (
            <motion.img
              src={user.profile_picture_url}
              alt={getDisplayName()}
              className="w-9 h-9 rounded-full object-cover border-2 border-[#00D4B3]/30 dark:border-[#00D4B3]/50 group-hover:border-[#00D4B3] transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            />
          ) : (
            <motion.div 
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-[#00D4B3]/20"
              whileHover={{ scale: 1.05 }}
            >
              {getInitials()}
            </motion.div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-[#0A2540] dark:text-white transition-colors duration-300">
            {getDisplayName()}
          </p>
          <p className="text-xs text-[#6C757D] dark:text-white/70">
            {user.cargo_rol}
          </p>
        </div>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <ChevronDownIcon 
            className="w-4 h-4 text-[#6C757D] dark:text-white/70 group-hover:text-[#00D4B3] transition-colors duration-300" 
          />
        </motion.div>
      </Menu.Button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 translate-y-2"
      >
        <Menu.Items className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#1E2329] rounded-2xl shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 py-3 z-50 backdrop-blur-xl overflow-hidden">
          {/* User Info Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="px-5 py-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-gradient-to-r from-[#0A2540]/5 to-transparent dark:from-[#00D4B3]/5"
          >
            <div className="flex items-center space-x-3">
              {user.profile_picture_url ? (
                <motion.img
                  src={user.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#00D4B3]/30 dark:border-[#00D4B3]/50 ring-2 ring-[#00D4B3]/10"
                  whileHover={{ scale: 1.05 }}
                />
              ) : (
                <motion.div 
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-base font-semibold shadow-lg shadow-[#00D4B3]/20 ring-2 ring-[#00D4B3]/10"
                  whileHover={{ scale: 1.05 }}
                >
                  {getInitials()}
                </motion.div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#0A2540] dark:text-white truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-[#6C757D] dark:text-white/60 truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
                <p className="text-xs text-[#00D4B3] font-medium mt-1">
                  {user.cargo_rol}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Menu Items */}
          <div className="py-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Menu.Item>
                {({ active }) => (
                  <motion.button
                    onClick={handleDashboard}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`${
                      active ? 'bg-[#E9ECEF] dark:bg-[#0A2540]/30' : ''
                    } flex items-center w-full px-5 py-3 text-sm text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 transition-all duration-200 rounded-xl mx-2 group`}
                  >
                    <HomeIcon className="w-5 h-5 mr-3 text-[#6C757D] dark:text-white/70 group-hover:text-[#00D4B3] transition-colors duration-200" />
                    <span className="font-medium">Ir al Home</span>
                  </motion.button>
                )}
              </Menu.Item>
            </motion.div>

            {/* Botón de acceso de administración - Solo visible para administradores */}
            {user.cargo_rol?.toLowerCase() === 'administrador' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`${
                            active ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/30' : ''
                          } flex items-center w-full px-5 py-3 text-sm text-[#0A2540] dark:text-white hover:bg-[#0A2540]/10 dark:hover:bg-[#0A2540]/30 transition-all duration-200 rounded-xl mx-2 group`}
                        >
                          <ShieldCheckIcon className="w-5 h-5 mr-3 text-[#00D4B3] group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Panel de Administración</span>
                        </motion.div>
                      </Link>
                    )}
                  </Menu.Item>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/instructor/dashboard" onClick={() => setIsOpen(false)}>
                        <motion.div
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`${
                            active ? 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20' : ''
                          } flex items-center w-full px-5 py-3 text-sm text-[#0A2540] dark:text-white hover:bg-[#F59E0B]/10 dark:hover:bg-[#F59E0B]/20 transition-all duration-200 rounded-xl mx-2 group`}
                        >
                          <AcademicCapIcon className="w-5 h-5 mr-3 text-[#F59E0B] group-hover:scale-110 transition-transform duration-200" />
                          <span className="font-medium">Panel de Instructor</span>
                        </motion.div>
                      </Link>
                    )}
                  </Menu.Item>
                </motion.div>
              </>
            )}

            <div className="border-t border-[#E9ECEF] dark:border-[#6C757D]/30 my-3 mx-4"></div>

            {/* Opciones de Tema - Menú Desplegable */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="px-2"
              ref={themeMenuRef}
            >
              <Menu.Item>
                {({ active }) => (
                  <div>
                    <motion.button
                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`${
                        active ? 'bg-[#E9ECEF] dark:bg-[#0A2540]/30' : ''
                      } flex items-center justify-between w-full px-5 py-3 text-sm text-[#0A2540] dark:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/30 transition-all duration-200 rounded-xl group`}
                    >
                      <div className="flex items-center">
                        <div className="w-5 h-5 mr-3 text-[#6C757D] dark:text-white/70 group-hover:text-[#00D4B3] transition-colors duration-200 flex items-center justify-center">
                          {getThemeIcon()}
                        </div>
                        <span className="font-medium">Tema</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isThemeMenuOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRightIcon className="w-4 h-4 text-[#6C757D] dark:text-white/70" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {isThemeMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 ml-8 space-y-1 overflow-hidden"
                        >
                          {[
                            { value: 'light' as Theme, label: 'Modo Claro', icon: Sun, color: '#F59E0B' },
                            { value: 'dark' as Theme, label: 'Modo Oscuro', icon: Moon, color: '#00D4B3' },
                            { value: 'system' as Theme, label: 'Seguir Sistema', icon: Monitor, color: '#6C757D' },
                          ].map((themeOption) => (
                            <motion.button
                              key={themeOption.value}
                              onClick={() => handleThemeChange(themeOption.value)}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              className={`${
                                theme === themeOption.value
                                  ? 'bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 text-[#00D4B3]'
                                  : 'text-[#6C757D] dark:text-white/70 hover:text-[#0A2540] dark:hover:text-white'
                              } flex items-center justify-between w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group`}
                            >
                              <div className="flex items-center">
                                <themeOption.icon className={`w-4 h-4 mr-3 transition-colors duration-200 ${
                                  theme === themeOption.value ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/70 group-hover:text-[#00D4B3]'
                                }`} />
                                <span className="font-medium">{themeOption.label}</span>
                              </div>
                              {theme === themeOption.value && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                >
                                  <Check className="w-4 h-4 text-[#00D4B3]" />
                                </motion.div>
                              )}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Menu.Item>
            </motion.div>

            <div className="border-t border-[#E9ECEF] dark:border-[#6C757D]/30 my-3 mx-4"></div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Menu.Item>
                {({ active }) => (
                  <motion.button
                    onClick={handleLogout}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`${
                      active ? 'bg-red-500/10 dark:bg-red-500/20' : ''
                    } flex items-center w-full px-5 py-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-all duration-200 rounded-xl mx-2 group`}
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-200" />
                    <span className="font-medium">Cerrar Sesión</span>
                  </motion.button>
                )}
              </Menu.Item>
            </motion.div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
