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
import { useState, useRef, useEffect } from 'react'

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
}

export function ModernNavbar({
  organization,
  user,
  getDisplayName,
  getInitials,
  onProfileClick,
  onLogout
}: ModernNavbarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/10 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-gray-200/50 dark:ring-gray-800/50">
                  <Image
                    src={organization.favicon_url || organization.logo_url || '/icono.png'}
                    alt={organization.name}
                    fill
                    className="object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icono.png';
                    }}
                  />
                </div>
              ) : (
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center ring-1 ring-gray-200/50 dark:ring-gray-800/50">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white leading-none">
                  {organization?.name || 'Mi Organización'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Panel de aprendizaje</p>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl z-[999] overflow-hidden"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50">
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
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {getDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                          whileHover={{ x: 2 }}
                        >
                          <Edit3 className="h-4 w-4 text-blue-500" />
                          <span>Editar perfil</span>
                        </motion.button>

                        <div className="h-px bg-gray-200/50 dark:bg-gray-800/50 my-1.5" />

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
            className="md:hidden border-t border-gray-200/50 dark:border-gray-800/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-200/50 dark:border-gray-800/50">
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onProfileClick()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50"
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
