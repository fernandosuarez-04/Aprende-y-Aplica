'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);
  const registerButtonRef = useRef<HTMLButtonElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  // Sincronizar el tab activo con el query parameter
  useEffect(() => {
    if (tabParam === 'register') {
      setActiveTab('register');
    } else if (tabParam === 'login' || !tabParam) {
      setActiveTab('login');
    }
  }, [tabParam]);

  // Calcular posición y tamaño del indicador basado en los botones reales
  const updateIndicatorPosition = () => {
    const activeButton = activeTab === 'login' ? loginButtonRef.current : registerButtonRef.current;
    const container = tabsContainerRef.current;
    
    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    }
  };

  // Actualizar posición del indicador cuando cambia el tab o el tamaño de la ventana
  useEffect(() => {
    updateIndicatorPosition();
    
    const handleResize = () => {
      updateIndicatorPosition();
    };
    
    window.addEventListener('resize', handleResize);
    
    // También actualizar después de un pequeño delay para asegurar que los elementos estén renderizados
    const timeoutId = setTimeout(updateIndicatorPosition, 10);
    const timeoutId2 = setTimeout(updateIndicatorPosition, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Medir altura del nuevo contenido antes de animar
  useEffect(() => {
    if (measureRef.current) {
      // Función para medir altura
      const measureHeight = () => {
        if (measureRef.current) {
          const newHeight = measureRef.current.scrollHeight;
          if (newHeight > 0) {
            setHeight(newHeight);
          }
        }
      };

      // Múltiples intentos para asegurar que el contenido lazy-loaded se haya cargado
      const timeout1 = setTimeout(measureHeight, 50);
      const timeout2 = setTimeout(measureHeight, 200);
      const timeout3 = setTimeout(measureHeight, 500);

      // También usar ResizeObserver para detectar cuando el contenido se carga
      const resizeObserver = new ResizeObserver(() => {
        measureHeight();
      });

      if (measureRef.current) {
        resizeObserver.observe(measureRef.current);
      }

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        resizeObserver.disconnect();
      };
    }
  }, [activeTab]);

  // Medir altura inicial y cuando el contenido visible cambia (fallback)
  useEffect(() => {
    if (contentRef.current) {
      const measureVisibleHeight = () => {
        if (contentRef.current) {
          const currentHeight = contentRef.current.scrollHeight;
          if (currentHeight > 0) {
            setHeight((prevHeight) => {
              // Si la altura previa es 'auto' o 0, establecer directamente
              if (prevHeight === 'auto' || (typeof prevHeight === 'number' && prevHeight === 0)) {
                return currentHeight;
              }
              // Solo actualizar si es significativamente diferente (más de 20px)
              if (typeof prevHeight === 'number' && Math.abs(currentHeight - prevHeight) > 20) {
                return currentHeight;
              }
              return prevHeight;
            });
          }
        }
      };

      // Medir después de que el contenido se renderice (múltiples intentos para lazy loading)
      const timeout1 = setTimeout(measureVisibleHeight, 150);
      const timeout2 = setTimeout(measureVisibleHeight, 400);
      const timeout3 = setTimeout(measureVisibleHeight, 700);

      // ResizeObserver para el contenido visible
      const resizeObserver = new ResizeObserver(() => {
        measureVisibleHeight();
      });

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        resizeObserver.disconnect();
      };
    }
  }, [activeTab]);

  return (
    <div className="space-y-4 relative">
      {/* Tabs - Animaciones reducidas */}
      <div ref={tabsContainerRef} className="flex gap-4 relative bg-gray-100/50 dark:bg-slate-800/30 p-1 rounded-lg">
        {/* Indicador de Tab Activo - Posicionado exactamente sobre el botón activo */}
        <motion.div
          className="absolute bg-primary rounded-lg"
          initial={false}
          animate={{
            width: indicatorStyle.width,
            left: indicatorStyle.left,
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.3
          }}
          style={{ 
            top: '4px',
            bottom: '4px',
            height: 'calc(100% - 8px)'
          }}
        />

        <button
          ref={loginButtonRef}
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
          ref={registerButtonRef}
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

      {/* Contenedor invisible para medir altura del nuevo contenido */}
      <div 
        ref={measureRef}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          height: 'auto',
          width: '100%',
          maxWidth: '100%',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1,
          overflow: 'hidden'
        }}
      >
        <div style={{ width: '100%' }}>
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>

      {/* Form Content - Animación suave de altura */}
      <motion.div
        animate={{ 
          height: height === 'auto' || (typeof height === 'number' && height === 0) 
            ? 'auto' 
            : `${height}px` 
        }}
        transition={{ 
          duration: 0.5, 
          ease: [0.4, 0, 0.2, 1]
        }}
        style={{ 
          overflow: height === 'auto' || (typeof height === 'number' && height === 0) ? 'visible' : 'hidden',
          position: 'relative',
          minHeight: height === 'auto' || (typeof height === 'number' && height === 0) ? 'auto' : '0px'
        }}
        className="relative"
      >
        <div ref={contentRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Link - Sin animaciones innecesarias */}
      <div className="text-center space-y-1 pt-2">
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
