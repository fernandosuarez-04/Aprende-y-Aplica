'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthTab } from '../../types/auth.types';
import { LoginForm } from '../LoginForm';

// ⚡ OPTIMIZACIÓN: Lazy load de RegisterForm (538 líneas, solo se carga si el usuario cambia de tab)
const RegisterForm = dynamic(
  () => import('../RegisterForm').then(mod => ({ default: mod.RegisterForm })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full py-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    )
  }
);

export function AuthTabs() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<AuthTab>(
    tabParam === 'register' ? 'register' : 'login'
  );

  // Sincronizar el tab activo con el query parameter
  useEffect(() => {
    if (tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'login' || !tabParam) {
      setActiveTab('login');
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      {/* Tabs - Animaciones reducidas */}
      <div className="flex gap-4 relative">
        {/* Indicador de Tab Activo - Simplificado */}
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
          {/* ⚡ OPTIMIZACIÓN: Eliminadas animaciones whileHover/whileTap (CSS es más eficiente) */}
          <span className="inline-block transition-transform hover:scale-105 active:scale-95">
            Ingresar
          </span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all relative z-10 ${
            activeTab === 'register'
              ? 'text-white'
              : 'text-text-secondary hover:text-color-contrast'
          }`}
        >
          <span className="inline-block transition-transform hover:scale-105 active:scale-95">
            Crear cuenta
          </span>
        </button>
      </div>

      {/* Form Content - Animación simplificada */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </motion.div>
      </AnimatePresence>

      {/* Footer Link - Sin animaciones innecesarias */}
      <div className="text-center space-y-2">
        {activeTab === 'login' ? (
          <>
            <p className="text-sm text-text-secondary">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => setActiveTab('register')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Crear cuenta
              </button>
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
              <button
                onClick={() => setActiveTab('login')}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Iniciar sesión
              </button>
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
      </div>
    </div>
  );
}
