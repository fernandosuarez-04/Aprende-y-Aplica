'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Users, 
  Newspaper,
  Bell,
  Settings
} from 'lucide-react'
import { UserDropdown } from '../UserDropdown'
import { useRouter } from 'next/navigation'

interface DashboardNavbarProps {
  activeItem?: string
}

const navigationItems = [
  { id: 'workshops', name: 'Talleres', icon: BookOpen },
  { id: 'directory', name: 'Directorio IA', icon: Brain },
  { id: 'community', name: 'Comunidad', icon: Users },
  { id: 'news', name: 'Noticias', icon: Newspaper },
]

export function DashboardNavbar({ activeItem = 'workshops' }: DashboardNavbarProps) {
  const router = useRouter()

  const handleNavigation = (itemId: string) => {
    switch (itemId) {
      case 'workshops':
        router.push('/dashboard')
        break
      case 'directory':
        // TODO: Implementar página de directorio
        console.log('Directorio IA clicked')
        break
      case 'community':
        // TODO: Implementar página de comunidad
        console.log('Comunidad clicked')
        break
      case 'news':
        router.push('/news')
        break
      default:
        break
    }
  }

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-carbon-900/95 backdrop-blur-sm border-b border-carbon-700/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img 
                src="/icono.png" 
                alt="Aprende y Aplica" 
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-4">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`relative flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Fondo activo con gradiente */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl"
                      layoutId="activeTab"
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                  )}
                  
                  {/* Overlay de hover */}
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-carbon-700/50 rounded-xl opacity-0"
                      whileHover={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  
                  <Icon className={`relative z-10 w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  <span className="relative z-10">{item.name}</span>
                  
                  {/* Indicador de notificación */}
                  {item.id === 'community' && (
                    <motion.div
                      className="relative z-10 w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
              )
            })}
          </nav>

          {/* User Menu con animaciones */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Notificaciones */}
            <motion.button 
              className="relative p-3 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                3
              </span>
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.button>

            {/* Configuración */}
            <motion.button 
              className="p-3 text-text-secondary hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            {/* User Dropdown */}
            <UserDropdown />
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div 
        className="lg:hidden border-t border-carbon-700/50"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3 }}
      >
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeItem === item.id
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center justify-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-primary to-primary/80'
                      : 'text-text-secondary hover:text-text-primary hover:bg-carbon-700/50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.header>
  )
}
