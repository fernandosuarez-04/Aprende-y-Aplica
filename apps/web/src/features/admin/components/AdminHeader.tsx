'use client'

import { motion } from 'framer-motion'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { AdminUserDropdown } from './AdminUserDropdown'
import { AdminNotifications } from './AdminNotifications'
import { useAdminUser } from '../hooks/useAdminUser'

interface AdminHeaderProps {
  onMenuClick: () => void
  title: string
  isCollapsed?: boolean
  isPinned?: boolean
  onToggleCollapse?: () => void
}

export function AdminHeader({ onMenuClick, title, isCollapsed, isPinned, onToggleCollapse }: AdminHeaderProps) {
  const { user, isLoading } = useAdminUser()

  // Calcular el left del header basado en el estado del sidebar
  // Si el sidebar está colapsado Y no está fijado, usar left-16 (64px)
  // De lo contrario, usar left-64 (256px)
  const sidebarWidth = isCollapsed && !isPinned ? 'lg:left-16' : 'lg:left-64'

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 right-0 z-50 bg-white/80 dark:bg-[#0F1419]/80 backdrop-blur-md shadow-sm border-b border-[#E9ECEF] dark:border-[#6C757D]/30 transition-all duration-300 ${sidebarWidth} left-0`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onMenuClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg text-[#6C757D] dark:text-gray-400 hover:text-[#0A2540] dark:hover:text-white hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20 transition-colors"
            >
              <Bars3Icon className="h-6 w-6" />
            </motion.button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <h1 className="text-lg font-semibold text-[#0A2540] dark:text-white">
                  {title}
                </h1>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-semibold text-[#0A2540] dark:text-white">
                  {title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <AdminNotifications />

            {/* User Menu */}
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full animate-pulse"></div>
                <div className="hidden md:block">
                  <div className="w-20 h-4 bg-[#E9ECEF] dark:bg-[#1E2329] rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-[#E9ECEF] dark:bg-[#1E2329] rounded animate-pulse"></div>
                </div>
              </div>
            ) : user ? (
              <AdminUserDropdown user={user} />
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[#E9ECEF] dark:bg-[#1E2329] rounded-full"></div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-[#6C757D] dark:text-gray-400">
                    Usuario no encontrado
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
