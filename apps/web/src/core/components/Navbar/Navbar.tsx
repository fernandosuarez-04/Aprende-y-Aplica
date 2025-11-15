'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../ThemeToggle';
import { useLogoEasterEgg } from '../../hooks/useLogoEasterEgg';
import { Menu, X } from 'lucide-react';
import { fadeIn, slideUp } from '../../../shared/utils/animations';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { clickCount, isActivated, handleLogoClick } = useLogoEasterEgg();
  const { t } = useTranslation('common');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            className="flex items-center gap-3 cursor-pointer"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden relative"
              animate={isActivated ? { 
                rotate: [0, 360, 0],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <Image
                src="/icono.png"
                alt={t('navbar.logoAlt')}
                width={40}
                height={40}
                className="w-full h-full object-contain logo-adaptive"
              />
              {/* Efecto visual cuando está activado */}
              {isActivated && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </motion.div>
            <span className="font-bold text-xl hidden sm:block text-gray-900 dark:text-white navbar-logo-text">
              {t('appName')}
            </span>
            
            {/* Contador oculto - solo para debugging */}
            {clickCount > 0 && clickCount < 5 && (
              <div className="sr-only">
                {t('navbar.clickCounter', { current: clickCount, total: 5 })}
              </div>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Navigation Links - Solo Inicio */}
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t('navbar.home')}
              </Link>
            </div>
            
            <ThemeToggle />
            
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">
                  {t('navbar.login')}
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button variant="primary" size="sm">
                  {t('navbar.register')}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden w-10 h-10 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-all duration-300 navbar-mobile-button text-gray-900 dark:text-white"
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
            {/* Mobile Navigation Links - Solo Inicio */}
            <div className="space-y-3">
              <Link 
                href="/" 
                className="block text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('navbar.home')}
              </Link>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <ThemeToggle />
              <div className="flex gap-3">
                <Link href="/auth">
                  <Button variant="ghost" size="sm">
                    {t('navbar.login')}
                  </Button>
                </Link>
                <Link href="/auth?tab=register">
                  <Button variant="primary" size="sm">
                    {t('navbar.register')}
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
