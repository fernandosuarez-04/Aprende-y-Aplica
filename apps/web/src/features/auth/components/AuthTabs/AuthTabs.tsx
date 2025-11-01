'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthTab } from '../../types/auth.types';
import { LoginForm } from '../LoginForm';
import { RegisterForm } from '../RegisterForm';

export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  return (
    <div className="space-y-6">
      {/* Tabs con Animación */}
      <div className="flex gap-4 relative">
        {/* Indicador de Tab Activo */}
        <motion.div
          className="absolute inset-0 bg-primary rounded-lg"
          initial={false}
          animate={{
            x: activeTab === 'login' ? 0 : '100%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: 'calc(50% - 0.5rem)' }}
        />
        
        <button
          onClick={() => setActiveTab('login')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all relative z-10 ${
            activeTab === 'login'
              ? 'text-white'
              : 'text-text-secondary hover:text-color-contrast'
          }`}
        >
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Ingresar
          </motion.span>
        </button>
        
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all relative z-10 ${
            activeTab === 'register'
              ? 'text-white'
              : 'text-text-secondary hover:text-color-contrast'
          }`}
        >
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Crear cuenta
          </motion.span>
        </button>
      </div>

      {/* Form Content con Animación */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </motion.div>
      </AnimatePresence>

      {/* Footer Link con Animación */}
      <motion.div
        className="text-center space-y-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {activeTab === 'login' ? (
          <>
            <p className="text-sm text-text-secondary">
              ¿No tienes cuenta?{' '}
              <motion.button
                onClick={() => setActiveTab('register')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Crear cuenta
              </motion.button>
            </p>
            <p className="text-xs text-text-secondary">
              ¿Eres{' '}
              <Link href="/instructor" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Instructor
              </Link>
              {' '}o representas una{' '}
              <Link href="/business" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Empresa
              </Link>
              ?
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              ¿Ya tienes cuenta?{' '}
              <motion.button
                onClick={() => setActiveTab('login')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Iniciar sesión
              </motion.button>
            </p>
            <p className="text-xs text-text-secondary">
              ¿Eres{' '}
              <Link href="/instructor" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Instructor
              </Link>
              {' '}o representas una{' '}
              <Link href="/business" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Empresa
              </Link>
              ?
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
