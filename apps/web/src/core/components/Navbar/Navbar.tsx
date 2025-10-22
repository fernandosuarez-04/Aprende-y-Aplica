'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { ThemeToggle } from '../ThemeToggle';
import { Menu, X, ChevronDown, Sparkles, Grid3X3 } from 'lucide-react';
import { fadeIn, slideUp } from '../../../shared/utils/animations';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDirectoryDropdownOpen, setIsDirectoryDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDirectoryDropdownOpen) {
        const target = event.target as Element;
        const dropdownElement = document.querySelector('.directory-dropdown');
        if (dropdownElement && !dropdownElement.contains(target)) {
          setIsDirectoryDropdownOpen(false);
        }
      }
    };

    if (isDirectoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDirectoryDropdownOpen]);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-md border-b navbar-scrolled'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <Image
                src="/icono.png"
                alt="Aprende y Aplica Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain logo-adaptive"
              />
            </div>
            <span className="font-bold text-xl hidden sm:block navbar-logo-text">
              Aprende y Aplica
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Inicio
              </Link>
              
              {/* AI Directory Dropdown */}
              <div className="relative directory-dropdown">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Dropdown clicked, current state:', isDirectoryDropdownOpen);
                    setIsDirectoryDropdownOpen(!isDirectoryDropdownOpen);
                  }}
                  className="flex items-center gap-1 text-sm font-medium hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800/50"
                >
                  Directorio IA
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                    isDirectoryDropdownOpen ? 'rotate-180' : ''
                  }`} />
                  {isDirectoryDropdownOpen && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </button>
                
                {isDirectoryDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl z-[60] animate-fade-in-down">
                    <div className="p-2">
                      <Link
                        href="/prompt-directory"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                        onClick={() => setIsDirectoryDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-purple-300 transition-colors">
                            Prompt Directory
                          </div>
                          <div className="text-xs text-gray-400">
                            Colección de prompts de IA
                          </div>
                        </div>
                      </Link>
                      
                      <Link
                        href="/apps-directory"
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                        onClick={() => setIsDirectoryDropdownOpen(false)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Grid3X3 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-blue-300 transition-colors">
                            Apps Directory
                          </div>
                          <div className="text-xs text-gray-400">
                            Herramientas de IA disponibles
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              <Link href="/news" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Noticias
              </Link>
            </div>
            
            <ThemeToggle />
            
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth">
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden w-10 h-10 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-all duration-300 navbar-mobile-button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          className={`lg:hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ overflow: isMobileMenuOpen ? 'visible' : 'hidden' }}
          initial="hidden"
          animate={isMobileMenuOpen ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, height: 0 },
            visible: { opacity: 1, height: "auto" }
          }}
        >
          <div className="py-4 space-y-4 border-t navbar-mobile-menu">
            {/* Mobile Navigation Links */}
            <div className="space-y-3">
              <Link 
                href="/" 
                className="block text-sm font-medium hover:text-blue-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-400">Directorio IA</div>
                <div className="pl-4 space-y-2">
                  <Link
                    href="/prompt-directory"
                    className="flex items-center gap-2 text-sm hover:text-purple-400 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Sparkles className="w-4 h-4" />
                    Prompt Directory
                  </Link>
                  <Link
                    href="/apps-directory"
                    className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Apps Directory
                  </Link>
                </div>
              </div>
              
              <Link 
                href="/news" 
                className="block text-sm font-medium hover:text-blue-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Noticias
              </Link>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <ThemeToggle />
              <div className="flex gap-3">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
