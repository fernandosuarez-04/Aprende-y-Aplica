'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  ChevronDown,
  Edit3,
  LogOut,
  Building2,
  Menu,
  X,
  Sparkles
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
    const sidebarBg = styles?.sidebar_background || '#0F172A'
    const sidebarOpacity = styles?.sidebar_opacity !== undefined ? styles.sidebar_opacity : 0.9
    const borderColor = styles?.border_color || 'rgba(255, 255, 255, 0.06)'
    const textColor = styles?.text_color || '#FFFFFF'

    let backgroundColor: string
    if (sidebarBg.startsWith('#')) {
      const rgb = hexToRgb(sidebarBg)
      backgroundColor = `rgba(${rgb}, ${sidebarOpacity})`
    } else {
      backgroundColor = sidebarBg
    }

    return {
      backgroundColor,
      borderColor,
      textColor
    }
  }, [styles])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-xl border-b"
      style={{
        backgroundColor: navbarStyle.backgroundColor,
        borderColor: navbarStyle.borderColor,
      }}
    >
      {/* Subtle gradient line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(14, 165, 233, 0.3), rgba(16, 185, 129, 0.3), transparent)'
        }}
      />

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
                <motion.div
                  className="relative h-11 w-11 rounded-xl overflow-hidden border shadow-lg"
                  style={{
                    borderColor: 'rgba(14, 165, 233, 0.2)',
                    boxShadow: '0 4px 20px rgba(14, 165, 233, 0.15)'
                  }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Image
                    src={organization.favicon_url || organization.logo_url || '/icono.png'}
                    alt={organization.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </motion.div>
              ) : (
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center border"
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9, #06B6D4)',
                    borderColor: 'rgba(14, 165, 233, 0.3)',
                    boxShadow: '0 4px 20px rgba(14, 165, 233, 0.2)'
                  }}
                >
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1
                  className="text-base font-semibold leading-none"
                  style={{ color: navbarStyle.textColor }}
                >
                  {organization?.name || 'Mi Organización'}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <p className="text-xs text-cyan-400/80">
                    Panel de aprendizaje
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop User Menu */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <motion.button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300"
                style={{
                  backgroundColor: userDropdownOpen ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                  borderColor: userDropdownOpen ? 'rgba(14, 165, 233, 0.3)' : 'rgba(255, 255, 255, 0.06)'
                }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(14, 165, 233, 0.08)' }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center border"
                  style={{
                    background: 'linear-gradient(135deg, #0EA5E9, #10B981)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {user?.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={getDisplayName()}
                      width={32}
                      height={32}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-white">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div className="text-left hidden lg:block">
                  <p
                    className="text-sm font-medium leading-none"
                    style={{ color: navbarStyle.textColor }}
                  >
                    {getDisplayName()}
                  </p>
                  <p className="text-xs mt-0.5 text-gray-400">
                    {user?.email?.split('@')[0] || 'Usuario'}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: userDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </motion.div>
              </motion.button>

              {/* Dropdown */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[998]"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-72 rounded-2xl border backdrop-blur-xl shadow-2xl z-[999] overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(14, 165, 233, 0.1)'
                      }}
                    >
                      {/* User Info Card */}
                      <div
                        className="p-4 border-b"
                        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-12 w-12 rounded-xl flex items-center justify-center border"
                            style={{
                              background: 'linear-gradient(135deg, #0EA5E9, #10B981)',
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)'
                            }}
                          >
                            {user?.profile_picture_url ? (
                              <Image
                                src={user.profile_picture_url}
                                alt={getDisplayName()}
                                width={48}
                                height={48}
                                className="h-full w-full rounded-xl object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-white">
                                {getInitials()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {getDisplayName()}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {user?.email || ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <motion.button
                          onClick={() => {
                            onProfileClick()
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200"
                          whileHover={{
                            x: 4,
                            backgroundColor: 'rgba(14, 165, 233, 0.1)'
                          }}
                        >
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)' }}
                          >
                            <Edit3 className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-white font-medium">Editar perfil</span>
                            <p className="text-xs text-gray-400">Actualiza tu información</p>
                          </div>
                        </motion.button>

                        <div className="h-px mx-4 my-1" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

                        <motion.button
                          onClick={() => {
                            onLogout()
                            setUserDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200"
                          whileHover={{
                            x: 4,
                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                          }}
                        >
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                          >
                            <LogOut className="h-4 w-4 text-red-400" />
                          </div>
                          <div className="text-left">
                            <span className="text-red-400 font-medium">Cerrar sesión</span>
                            <p className="text-xs text-gray-400">Salir de tu cuenta</p>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border transition-all duration-300"
              style={{
                backgroundColor: mobileMenuOpen ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                borderColor: mobileMenuOpen ? 'rgba(14, 165, 233, 0.3)' : 'rgba(255, 255, 255, 0.06)'
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-cyan-400" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-300" />
                )}
              </motion.div>
            </motion.button>
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
            className="md:hidden border-t backdrop-blur-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              borderColor: 'rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="px-4 py-4 space-y-3">
              {/* User Info */}
              <div
                className="flex items-center gap-3 pb-4 border-b"
                style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9, #10B981)' }}
                >
                  {user?.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={getDisplayName()}
                      width={48}
                      height={48}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {getInitials()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{getDisplayName()}</p>
                  <p className="text-xs text-gray-400">{user?.email || ''}</p>
                </div>
              </div>

              {/* Menu Items */}
              <motion.button
                onClick={() => {
                  onProfileClick()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: 'rgba(14, 165, 233, 0.05)' }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)' }}>
                  <Edit3 className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-white font-medium">Editar perfil</span>
              </motion.button>

              <motion.button
                onClick={() => {
                  onLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                whileTap={{ scale: 0.98 }}
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}
              >
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                  <LogOut className="h-4 w-4 text-red-400" />
                </div>
                <span className="text-red-400 font-medium">Cerrar sesión</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
