'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  UserCircleIcon,
  HomeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/hooks/useAuth'

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
  const router = useRouter()
  const { logout } = useAuth()

  console.log('🔍 AdminUserDropdown: Usuario recibido:', user)
  console.log('🎭 Rol del usuario:', user.cargo_rol)
  console.log('✅ Es administrador:', user.cargo_rol?.toLowerCase() === 'administrador')

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const handleDashboard = () => {
    router.push('/dashboard')
    setIsOpen(false)
  }

  const handleSettings = () => {
    router.push('/admin/settings')
    setIsOpen(false)
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
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
      >
        {/* Avatar */}
        <div className="relative">
          {user.profile_picture_url ? (
            <img
              src={user.profile_picture_url}
              alt={getDisplayName()}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
              {getInitials()}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-400">
            {user.cargo_rol}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </Menu.Button>

      <Transition
        show={isOpen}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={getDisplayName()}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                  {getInitials()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-400 truncate" title={user.email}>
                  {user.email}
                </p>
                <p className="text-xs text-blue-400 font-medium">
                  {user.cargo_rol}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDashboard}
                  className={`${
                    active ? 'bg-gray-700' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200`}
                >
                  <HomeIcon className="w-4 h-4 mr-3" />
                  Ir al Dashboard
                </button>
              )}
            </Menu.Item>

            {/* Botón de acceso de administración - Solo visible para administradores */}
            {user.cargo_rol?.toLowerCase() === 'administrador' && (
              <Menu.Item>
                {({ active }) => (
                  <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                    <div className={`${
                      active ? 'bg-gray-700' : ''
                    } flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors duration-200`}>
                      <ShieldCheckIcon className="w-4 h-4 mr-3" />
                      Panel de Administración
                    </div>
                  </Link>
                )}
              </Menu.Item>
            )}

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSettings}
                  className={`${
                    active ? 'bg-gray-700' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200`}
                >
                  <Cog6ToothIcon className="w-4 h-4 mr-3" />
                  Configuración
                </button>
              )}
            </Menu.Item>

            <div className="border-t border-gray-700 my-2"></div>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-red-600/20' : ''
                  } flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors duration-200`}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                  Cerrar Sesión
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
