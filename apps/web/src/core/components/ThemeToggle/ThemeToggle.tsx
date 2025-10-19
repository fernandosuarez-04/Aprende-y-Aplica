'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useThemeStore, Theme } from '../../stores/themeStore';

export function ThemeToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme, initializeTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
    // Inicializar el estado de mobile
    setIsMobile(window.innerWidth < 1024);
  }, [initializeTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Oscuro', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Sistema', icon: <Monitor className="w-4 h-4" /> },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current && typeof window !== 'undefined') {
      const rect = buttonRef.current.getBoundingClientRect();
      const mobile = window.innerWidth < 1024; // Breakpoint lg
      setIsMobile(mobile);
      
      if (mobile) {
        // En móvil, usar posición fixed para evitar problemas de overflow
        const dropdownWidth = 160; // 40 * 4 = 160px (w-40)
        let rightPosition = window.innerWidth - rect.right;
        
        // Asegurar que el dropdown no se salga de la pantalla
        if (rightPosition < 16) {
          rightPosition = 16; // Mínimo 16px del borde
        }
        if (rect.right - dropdownWidth < 16) {
          rightPosition = window.innerWidth - rect.left - dropdownWidth;
          if (rightPosition < 16) {
            rightPosition = 16;
          }
        }
        
        setDropdownPosition({
          top: rect.bottom + 8,
          right: rightPosition,
        });
      } else {
        // En desktop, usar posición relativa
        setDropdownPosition({
          top: 0,
          right: 0,
        });
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      const handleUpdatePosition = () => {
        updateDropdownPosition();
      };

      window.addEventListener('resize', handleUpdatePosition);
      window.addEventListener('scroll', handleUpdatePosition);
      
      return () => {
        window.removeEventListener('resize', handleUpdatePosition);
        window.removeEventListener('scroll', handleUpdatePosition);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 px-3 rounded-lg backdrop-blur-sm border flex items-center gap-2 transition-all duration-300 group hover:bg-white/10 theme-toggle-button"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentTheme.icon}
        </motion.div>
        <span className="text-sm font-medium hidden sm:inline">
          {currentTheme.label}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`w-40 rounded-lg backdrop-blur-md border overflow-hidden shadow-lg ${
              isMobile ? 'fixed theme-toggle-dropdown-mobile' : 'absolute top-full mt-2 right-0 theme-toggle-dropdown'
            }`}
            style={isMobile ? {
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            } : {}}
          >
            {themes.map((themeOption) => (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-200 theme-toggle-option ${
                  theme === themeOption.value ? 'active' : ''
                }`}
              >
                {themeOption.icon}
                <span className="text-sm font-medium">{themeOption.label}</span>
                {theme === themeOption.value && (
                  <motion.div
                    layoutId="activeTheme"
                    className="ml-auto w-2 h-2 rounded-full bg-primary"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
