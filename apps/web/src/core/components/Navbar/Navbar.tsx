'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@aprende-y-aplica/ui';
import { ThemeToggle } from '../ThemeToggle';
import { Menu, X } from 'lucide-react';
import { fadeIn, slideUp } from '../../../shared/utils/animations';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          ? 'backdrop-blur-md border-b'
          : 'bg-transparent'
      }`}
      style={isScrolled ? {
        backgroundColor: 'var(--glass-strong)',
        borderBottomColor: 'var(--glass-light)'
      } : {}}
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
            <span className="font-bold text-xl hidden sm:block" style={{ color: 'var(--color-contrast)' }}>
              Aprende y Aplica
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <ThemeToggle />
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Iniciar Sesión
              </Button>
              <Button variant="primary" size="sm">
                Registrarse
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="lg:hidden w-10 h-10 rounded-lg backdrop-blur-sm border flex items-center justify-center transition-all duration-300"
            style={{
              backgroundColor: 'var(--glass)',
              borderColor: 'var(--glass-light)',
              color: 'var(--color-contrast)'
            }}
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
            isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
          }`}
          style={{ overflow: isMobileMenuOpen ? 'visible' : 'hidden' }}
          initial="hidden"
          animate={isMobileMenuOpen ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, height: 0 },
            visible: { opacity: 1, height: "auto" }
          }}
        >
          <div 
            className="py-4 space-y-4 border-t"
            style={{ borderTopColor: 'var(--glass-light)' }}
          >
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <div className="flex gap-3">
                <Button variant="ghost" size="sm">
                  Iniciar Sesión
                </Button>
                <Button variant="primary" size="sm">
                  Registrarse
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
