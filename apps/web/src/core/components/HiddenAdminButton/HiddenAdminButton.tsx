'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useUserRole } from '@/core/hooks/useUserRole'

export const HiddenAdminButton = React.memo(function HiddenAdminButton() {
  const [isVisible, setIsVisible] = useState(false)
  const { isAdmin, isLoading } = useUserRole()

  // Solo mostrar si es administrador y no está cargando
  if (isLoading || !isAdmin) {
    return null
  }

  return (
    <>
      {/* Área de activación invisible - Esquina superior derecha */}
      <div 
        className="fixed top-0 right-0 w-16 h-16 z-40 cursor-pointer"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      
      {/* Botón oculto - Solo visible en hover */}
      <motion.div
        className="fixed top-4 right-4 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isVisible ? 1 : 0, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        <Link href="/admin/dashboard">
          <motion.button
            className="group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Icono principal */}
            <ShieldCheckIcon className="w-6 h-6" />
            
            {/* Tooltip */}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Panel de Administración
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
            </div>
          </motion.button>
        </Link>
      </motion.div>
    </>
  )
})