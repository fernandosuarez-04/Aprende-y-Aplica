'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  ChevronDown, 
  Edit3, 
  LogOut, 
  Building2,
  Menu,
  X
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo } from 'react'
import { StyleConfig } from '@/features/business-panel/hooks/useOrganizationStyles'
import { hexToRgb } from '@/features/business-panel/utils/styles'

interface ModernNavbarProps {
  organization: {
    id: string
    name: string
    logo_url?: string | null
    favicon_url?: string | null
  } | null
  user: {
    profile_picture_url?: string | null
    first_name?: string | null
    last_name?: string | null
    display_name?: string | null
    username?: string | null
    email?: string | null
  } | null
  getDisplayName: () => string
  getInitials: () => string
  onProfileClick: () => void
  onLogout: () => void
  styles?: StyleConfig | null
}

export function ModernNavbar({
  organization,
  user,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout,
  styles
}: ModernNavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Calcular estilos del navbar basados en los estilos personalizados
  const navbarStyle = useMemo(() => {
    if (!styles) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(229, 231, 235, 0.1)',
        color: undefined as string | undefined
      }
    }

    const sidebarBg = styles.sidebar_background || '#1e293b'
    const sidebarOpacity = styles.sidebar_opacity !== undefined ? styles.sidebar_opacity : 0.8
    const borderColor = styles.border_color || 'rgba(229, 231, 235, 0.1)'
    const textColor = styles.text_color

    // Convertir hex a rgba si es necesario
    let backgroundColor: string
    if (sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      backgroundColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else if (sidebarBg.startsWith('rgba')) {
      // Si ya es rgba, extraer el valor de opacidad y reemplazarlo
      const rgbaMatch = sidebarBg.match(/rgba?\(([^)]+)\)/)
      if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',')
        if (parts.length >= 3) {
          backgroundColor = `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${sidebarOpacity})`
        } else {
          backgroundColor = sidebarBg
        }
      } else {
        backgroundColor = sidebarBg
      }
    } else {
      backgroundColor = sidebarBg
    }

    return {
      backgroundColor,
      borderColor,
      color: textColor
    }
  }, [styles])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav 
      className="sticky top-0 z-50 w-full border-b backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60"
      style={{
        backgroundColor: navbarStyle.backgroundColor,
        borderColor: navbarStyle.borderColor,
        color: navbarStyle.color
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo y Nombre */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {(organization?.favicon_url || organization?.logo_url) ? (
                <div className="relative h-12 w-12 rounded-xl overflow-hidden ring-1 ring-gray-200/30 dark:ring-gray-800/30 shadow-sm">
                  <Image
                    src={organization.favicon_url || organization.logo_url || '/icono.png'}
                    alt={organization.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-1 ring-gray-200/30 dark:ring-gray-800/30 shadow-sm">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 
                  className="text-base font-semibold leading-none"
                  style={{ color: navbarStyle.color || undefined }}
                >
                  {organization?.name || 'Mi Organización'}
                </h1>
                <p 
                  className="text-xs mt-0.5 opacity-70"
                  style={{ color: navbarStyle.color || undefined }}
                >
                  Panel de aprendizaje
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop User Menu */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-2 ring-gray-200/50 dark:ring-gray-800/50">
                  {user?.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={getDisplayName()}
                      width={32}
                      height={32}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-white">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <p 
                    className="text-sm font-medium leading-none"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {getDisplayName()}
                  </p>
                  <p 
                    className="text-xs mt-0.5 opacity-70"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                </div>
                <ChevronDown 
                  className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl border backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
                      style={{
                        backgroundColor: navbarStyle.backgroundColor,
                        borderColor: navbarStyle.borderColor,
                        color: navbarStyle.color
                      }}
                    >
                      {/* User Info */}
                      <div 
                        className="px-4 py-3 border-b"
                        style={{ borderColor: navbarStyle.borderColor }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-2 ring-gray-200/50 dark:ring-gray-800/50">
                            {user?.profile_picture_url ? (
                              <Image
                                src={user.profile_picture_url}
                                alt={getDisplayName()}
                                width={40}
                                height={40}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-white">
                                {getInitials()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="text-sm font-semibold truncate"
                              style={{ color: navbarStyle.color || undefined }}
                            >
                              {getDisplayName()}
                            </p>
                            <p 
                              className="text-xs truncate opacity-70"
                              style={{ color: navbarStyle.color || undefined }}
                            >
                              {user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1.5">
                        <motion.button
                          onClick={() => {
                            onProfileClick()
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:opacity-80"
                          style={{ color: navbarStyle.color || undefined }}
                          whileHover={{ x: 2 }}
                        >
                          <Edit3 className="h-4 w-4 text-blue-500" />
                          <span>Editar perfil</span>
                        </motion.button>

                        <div 
                          className="h-px my-1.5" 
                          style={{ backgroundColor: navbarStyle.borderColor }}
                        />

                        <motion.button
                          onClick={() => {
                            onLogout()
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          whileHover={{ x: 2 }}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar sesión</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t backdrop-blur-xl"
            style={{
              backgroundColor: navbarStyle.backgroundColor,
              borderColor: navbarStyle.borderColor,
              color: navbarStyle.color
            }}
          >
            <div className="px-4 py-4 space-y-3">
              <div 
                className="flex items-center gap-3 pb-3 border-b"
                style={{ borderColor: navbarStyle.borderColor }}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  {user?.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={getDisplayName()}
                      width={40}
                      height={40}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-white">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div>
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {getDisplayName()}
                  </p>
                  <p 
                    className="text-xs opacity-70"
                    style={{ color: navbarStyle.color || undefined }}
                  >
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onProfileClick()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:opacity-80 transition-opacity"
                style={{ color: navbarStyle.color || undefined }}
              >
                <Edit3 className="h-4 w-4 text-blue-500" />
                <span>Editar perfil</span>
              </button>
              <button
                onClick={() => {
                  onLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
