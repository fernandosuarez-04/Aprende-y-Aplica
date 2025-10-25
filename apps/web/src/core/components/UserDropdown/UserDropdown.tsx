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
  LogOut,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '../../../features/auth/hooks/useAuth'
import { useUserProfile } from '../../../features/auth/hooks/useUserProfile'
import { useTheme } from '../../hooks/useTheme'

interface UserDropdownProps {
  className?: string
}

export function UserDropdown({ className = '' }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const { userProfile, loading: profileLoading } = useUserProfile()
  const { toggleTheme, isDark } = useTheme()
  const router = useRouter()

  console.log('🔍 UserDropdown renderizado, user:', user)
  console.log('🔍 UserProfile:', userProfile)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
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
        console.log('Aprendizaje clicked')
        setIsOpen(false)
      }
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
      id: 'theme',
      label: isDark ? 'Modo claro' : 'Modo oscuro',
      icon: Moon,
      onClick: () => {
        toggleTheme()
        setIsOpen(false)
      }
    },
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
        className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-carbon-700/50 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div 
          className="relative w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden"
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
          <p className="text-sm font-medium text-text-primary">
            {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
          </p>
          <p className="text-xs text-text-tertiary">
            {truncateEmail(userProfile?.email || user?.email || 'usuario@ejemplo.com')}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-text-secondary" />
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
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
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
              className="absolute right-0 top-full mt-2 w-96 bg-gray-900 rounded-xl shadow-2xl border-2 border-gray-600 z-50 ring-1 ring-white/10"
            >
            {/* Header del usuario */}
            <div className="px-6 py-5 border-b border-gray-600 bg-gray-800/50">
              <div className="flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {userProfile?.profile_picture_url ? (
                    <img 
                      src={userProfile.profile_picture_url} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary truncate">
                    {userProfile?.display_name || userProfile?.first_name || user?.display_name || user?.username || 'Usuario'}
                  </h3>
                  <p className="text-sm text-text-tertiary truncate">
                    {truncateEmail(userProfile?.email || user?.email || 'usuario@ejemplo.com')}
                  </p>
                </div>
              </div>
            </div>

            {/* Items del menú */}
            <div className="py-3">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-4 px-6 py-4 text-left transition-colors ${
                      item.isDestructive 
                        ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300' 
                        : 'text-text-secondary hover:bg-gray-800 hover:text-text-primary'
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
                        item.isDestructive ? 'text-red-400' : 'text-primary'
                      }`} />
                    </motion.div>
                    <span className="font-medium text-base">{item.label}</span>
                  </motion.button>
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
