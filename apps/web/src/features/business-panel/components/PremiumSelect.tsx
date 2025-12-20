'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
}

interface PremiumSelectProps {
  value: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  options: Option[]
  placeholder?: string
  icon?: React.ReactNode
  className?: string
  emptyMessage?: string
}

export function PremiumSelect({
  value,
  onChange,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  icon,
  className = '',
  emptyMessage = 'Sin opciones'
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find(opt => opt.value === value)

  // Obtener estilos de la organización
  const { styles } = useOrganizationStylesContext()
  const panelStyles = styles?.panel

  // Colores dinámicos
  const primaryColor = panelStyles?.primary_button_color || '#8B5CF6'
  const cardBackground = panelStyles?.card_background || '#1E2329'
  const textColor = panelStyles?.text_color || '#FFFFFF'

  // Usar onValueChange si está disponible, sino onChange
  const handleValueChange = onValueChange || onChange || (() => { })

  // Detectar si hay una selección activa (diferente a 'all' o el primer valor)
  const hasActiveSelection = value !== 'all' && value !== options[0]?.value

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative min-w-[160px] ${className}`}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        className="w-full px-4 py-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all duration-300 group"
        style={{
          backgroundColor: cardBackground,
          borderColor: hasActiveSelection ? primaryColor : 'rgba(255,255,255,0.1)',
          color: textColor,
          boxShadow: hasActiveSelection ? `0 0 0 1px ${primaryColor}30` : 'none'
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          {icon && (
            <span
              className="flex-shrink-0 transition-colors duration-200"
              style={{
                color: hasActiveSelection ? primaryColor : `${textColor}50`
              }}
            >
              {icon}
            </span>
          )}

          {/* Selected Value */}
          <span
            className="text-sm font-medium truncate"
            style={{
              color: selectedOption ? textColor : `${textColor}50`
            }}
          >
            {selectedOption?.label || placeholder}
          </span>
        </div>

        {/* Chevron Icon with Animation */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            className="w-4 h-4 transition-colors duration-200"
            style={{ color: `${textColor}50` }}
          />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl border overflow-hidden backdrop-blur-xl"
            style={{
              backgroundColor: cardBackground,
              borderColor: 'rgba(255,255,255,0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 9999
            }}
          >
            {/* Options List */}
            <div
              className="py-2 max-h-64 overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent'
              }}
            >
              {options.length === 0 ? (
                <div
                  className="px-4 py-3 text-sm text-center"
                  style={{ color: `${textColor}50` }}
                >
                  {emptyMessage}
                </div>
              ) : (
                options.map((option, index) => {
                  const isSelected = option.value === value

                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        handleValueChange(option.value)
                        setIsOpen(false)
                      }}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150"
                      style={{
                        backgroundColor: isSelected ? `${primaryColor}20` : 'transparent',
                        color: isSelected ? textColor : `${textColor}99`
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                          e.currentTarget.style.color = textColor
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = `${textColor}99`
                        }
                      }}
                    >
                      {/* Option Icon */}
                      {option.icon && (
                        <span
                          className="flex-shrink-0"
                          style={{ color: isSelected ? primaryColor : `${textColor}50` }}
                        >
                          {option.icon}
                        </span>
                      )}

                      {/* Option Label */}
                      <span className="flex-1 font-medium">{option.label}</span>

                      {/* Check Icon for Selected */}
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="w-4 h-4" style={{ color: primaryColor }} />
                        </motion.span>
                      )}
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
