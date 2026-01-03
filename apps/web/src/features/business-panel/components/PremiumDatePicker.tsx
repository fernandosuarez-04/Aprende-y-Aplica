'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react'
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext'
import { useThemeStore } from '@/core/stores/themeStore'

interface PremiumDatePickerProps {
    value: string
    onChange: (date: string) => void
    placeholder?: string
    minDate?: Date
    maxDate?: Date
    disabled?: boolean
    className?: string
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function PremiumDatePicker({
    value,
    onChange,
    placeholder = 'Seleccionar fecha',
    minDate,
    maxDate,
    disabled = false,
    className = ''
}: PremiumDatePickerProps) {
    const { styles } = useOrganizationStylesContext()
    const panelStyles = styles?.panel

    const [isOpen, setIsOpen] = useState(false)
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const date = new Date(value + 'T00:00:00')
            return { year: date.getFullYear(), month: date.getMonth() }
        }
        const now = new Date()
        return { year: now.getFullYear(), month: now.getMonth() }
    })

    const containerRef = useRef<HTMLDivElement>(null)

    // Theme colors
    // Theme colors
    const { resolvedTheme } = useThemeStore()
    const isDark = resolvedTheme === 'dark'

    const primaryColor = panelStyles?.primary_button_color || (isDark ? '#8B5CF6' : '#6366F1')
    const accentColor = panelStyles?.accent_color || '#10B981'
    const cardBackground = isDark ? (panelStyles?.card_background || '#1E2329') : '#FFFFFF'
    const textColor = isDark ? (panelStyles?.text_color || '#FFFFFF') : '#0F172A'
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

    // Close on outside click
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

    // Get calendar days
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month)
        const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month)
        const daysInPrevMonth = getDaysInMonth(viewDate.year, viewDate.month - 1)

        const days: { day: number; month: 'prev' | 'current' | 'next'; date: Date }[] = []

        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i
            const date = new Date(viewDate.year, viewDate.month - 1, day)
            days.push({ day, month: 'prev', date })
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(viewDate.year, viewDate.month, i)
            days.push({ day: i, month: 'current', date })
        }

        // Next month days
        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(viewDate.year, viewDate.month + 1, i)
            days.push({ day: i, month: 'next', date })
        }

        return days
    }

    const isDateDisabled = (date: Date) => {
        if (minDate) {
            const min = new Date(minDate)
            min.setHours(0, 0, 0, 0)
            if (date < min) return true
        }
        if (maxDate) {
            const max = new Date(maxDate)
            max.setHours(23, 59, 59, 999)
            if (date > max) return true
        }
        return false
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    const isSelected = (date: Date) => {
        if (!value) return false
        const selected = new Date(value + 'T00:00:00')
        return date.toDateString() === selected.toDateString()
    }

    const handleSelectDate = (date: Date) => {
        if (isDateDisabled(date)) return
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        onChange(`${year}-${month}-${day}`)
        setIsOpen(false)
    }

    const handlePrevMonth = () => {
        setViewDate(prev => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 }
            }
            return { ...prev, month: prev.month - 1 }
        })
    }

    const handleNextMonth = () => {
        setViewDate(prev => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 }
            }
            return { ...prev, month: prev.month + 1 }
        })
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
    }

    const handleToday = () => {
        const today = new Date()
        if (!isDateDisabled(today)) {
            handleSelectDate(today)
        }
    }

    const formatDisplayDate = () => {
        if (!value) return ''
        const date = new Date(value + 'T00:00:00')
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const calendarDays = generateCalendarDays()

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input Trigger */}
            <motion.button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                whileTap={{ scale: 0.98 }}
                className={`w-full px-4 py-3 rounded-xl border flex items-center gap-3 transition-all text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-white/20'
                    }`}
                style={{
                    backgroundColor: `${cardBackground}80`,
                    borderColor: isOpen ? primaryColor : borderColor,
                    boxShadow: isOpen ? `0 0 0 3px ${primaryColor}20` : 'none'
                }}
            >
                <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                <span
                    className={`flex-1 ${value ? '' : 'opacity-50'}`}
                    style={{ color: textColor }}
                >
                    {value ? formatDisplayDate() : placeholder}
                </span>
                {value && !disabled && (
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClear}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" style={{ color: `${textColor}60` }} />
                    </motion.div>
                )}
            </motion.button>

            {/* Calendar Popup */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute z-50 top-full mt-2 left-0 p-4 rounded-2xl border shadow-2xl min-w-[320px]"
                        style={{
                            backgroundColor: cardBackground,
                            borderColor: borderColor,
                            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px ${primaryColor}20`
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <motion.button
                                type="button"
                                onClick={handlePrevMonth}
                                whileHover={{ scale: 1.1, x: -2 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                            >
                                <ChevronLeft className="w-5 h-5" style={{ color: textColor }} />
                            </motion.button>

                            <motion.div
                                key={`${viewDate.year}-${viewDate.month}`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <span className="font-bold text-lg" style={{ color: textColor }}>
                                    {MONTHS[viewDate.month]}
                                </span>
                                <span className="ml-2 font-medium" style={{ color: `${textColor}60` }}>
                                    {viewDate.year}
                                </span>
                            </motion.div>

                            <motion.button
                                type="button"
                                onClick={handleNextMonth}
                                whileHover={{ scale: 1.1, x: 2 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
                            >
                                <ChevronRight className="w-5 h-5" style={{ color: textColor }} />
                            </motion.button>
                        </div>

                        {/* Days Header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {DAYS.map((day, index) => (
                                <div
                                    key={day}
                                    className="h-8 flex items-center justify-center text-xs font-medium"
                                    style={{ color: index === 0 ? '#EF4444' : `${textColor}50` }}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <motion.div
                            key={`${viewDate.year}-${viewDate.month}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-7 gap-1"
                        >
                            {calendarDays.map((item, index) => {
                                const isDayDisabled = isDateDisabled(item.date)
                                const isDayToday = isToday(item.date)
                                const isDaySelected = isSelected(item.date)
                                const isOtherMonth = item.month !== 'current'

                                return (
                                    <motion.button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelectDate(item.date)}
                                        disabled={isDayDisabled}
                                        whileHover={!isDayDisabled ? { scale: 1.1 } : undefined}
                                        whileTap={!isDayDisabled ? { scale: 0.9 } : undefined}
                                        className={`
                      h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium
                      transition-all duration-200 relative
                      ${isDayDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
                      ${isOtherMonth ? 'opacity-30' : ''}
                    `}
                                        style={{
                                            backgroundColor: isDaySelected
                                                ? primaryColor
                                                : isDayToday
                                                    ? `${primaryColor}20`
                                                    : 'transparent',
                                            color: isDaySelected
                                                ? '#FFFFFF'
                                                : isDayToday
                                                    ? primaryColor
                                                    : textColor,
                                            boxShadow: isDaySelected
                                                ? `0 4px 15px ${primaryColor}40`
                                                : 'none'
                                        }}
                                    >
                                        {item.day}
                                        {isDayToday && !isDaySelected && (
                                            <motion.div
                                                layoutId="today-indicator"
                                                className="absolute bottom-1 w-1 h-1 rounded-full"
                                                style={{ backgroundColor: primaryColor }}
                                            />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </motion.div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: borderColor }}>
                            <motion.button
                                type="button"
                                onClick={() => onChange('')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                                style={{ color: `${textColor}70` }}
                            >
                                Limpiar
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleToday}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                style={{
                                    backgroundColor: `${accentColor}20`,
                                    color: accentColor
                                }}
                            >
                                Hoy
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
