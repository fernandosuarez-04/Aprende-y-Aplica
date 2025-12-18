'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useBusinessSettings } from '../hooks/useBusinessSettings'
import { useAuth } from '../../auth/hooks/useAuth'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  FileText,
  Settings,
  X,
  Building2,
  UsersRound,
  LogOut
} from 'lucide-react'

interface BusinessPanelSidebarProps {
  isOpen: boolean
  onClose: () => void
  activeSection: string
  onSectionChange: (section: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
  isPinned: boolean
  onTogglePin: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/business-panel/dashboard', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/business-panel/users', icon: Users },
  { name: 'Cursos', href: '/business-panel/courses', icon: BookOpen },
  { name: 'Equipos', href: '/business-panel/teams', icon: UsersRound },
  { name: 'Reportes', href: '/business-panel/reports', icon: FileText },
  { name: 'Analytics', href: '/business-panel/analytics', icon: BarChart3 },
  { name: 'Configuración', href: '/business-panel/settings', icon: Settings },
]

export function BusinessPanelSidebar({ 
  isOpen, 
  onClose,
  isCollapsed,
}: BusinessPanelSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { styles } = useOrganizationStylesContext()
  const { data: businessData } = useBusinessSettings()
  const { logout } = useAuth()
  const sidebarRef = useRef<HTMLDivElement>(null)

  const organization = businessData?.organization
  const panelStyles = styles?.panel
  const sidebarBackground = panelStyles?.sidebar_background || '#0a0a0a'
  
  const sidebarStyle: React.CSSProperties = useMemo(() => {
    const opacity = panelStyles?.sidebar_opacity || 1
    
    if (!sidebarBackground) {
      return { backgroundColor: `rgba(10, 10, 10, ${opacity})` }
    }

    if (sidebarBackground.includes('linear-gradient') || sidebarBackground.includes('radial-gradient')) {
      return {
        background: sidebarBackground,
        backgroundColor: 'transparent',
        opacity: opacity,
      }
    }

    if (sidebarBackground.startsWith('#')) {
      const hex = sidebarBackground.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return {
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${opacity})`,
      }
    }
    
    return {
      backgroundColor: sidebarBackground,
      opacity: opacity,
    }
  }, [sidebarBackground, panelStyles])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onClose()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleLogout = async () => {
    if (logout && typeof logout === 'function') {
      await logout()
    }
    onClose()
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={{ x: 0 }}
        animate={{ x: 0 }}
        style={sidebarStyle}
        className={`
          fixed lg:relative z-50 h-screen flex flex-col
          w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Close button for mobile */}
        <AnimatePresence>
          {isOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 z-10 p-2 rounded-lg backdrop-blur-md transition-opacity hover:opacity-80"
              style={{ 
                color: panelStyles?.text_color || 'rgba(255, 255, 255, 0.9)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)'
              }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Logo Section */}
        <div className="p-6 flex items-center gap-3">
          <div
            className="relative h-12 w-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--org-primary-button-color, #8B5CF6), var(--org-secondary-button-color, #7C3AED))'
            }}
          >
            {(organization?.brand_favicon_url || organization?.favicon_url) ? (
              <Image
                src={organization?.brand_favicon_url || organization?.favicon_url || '/icono.png'}
                alt={organization?.name || 'Organización'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icono.png'
                }}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <h1 
            className="text-lg font-bold truncate"
            style={{ color: panelStyles?.text_color || '#ffffff' }}
          >
            {organization?.name || 'Panel Admin'}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: index * 0.03,
                    duration: 0.2,
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group relative flex items-center gap-3 px-4 py-3 rounded-xl
                      transition-all duration-200
                      ${isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                    style={{
                      background: isActive 
                        ? 'linear-gradient(90deg, var(--org-primary-button-color, #8B5CF6) 0%, var(--org-secondary-button-color, #7C3AED) 100%)'
                        : undefined,
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
