'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ShoppingCart as ShoppingCartIcon, X } from 'lucide-react';
import { useShoppingCartStore } from '../../stores/shoppingCartStore';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ShoppingCartProps {
  className?: string;
}

export function ShoppingCart({ className = '' }: ShoppingCartProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, loading } = useAuth();
  const { items, removeItem, getTotal, getItemCount, setUserId, userId: cartUserId, removePurchasedCourses } = useShoppingCartStore();

  // ⚠️ CRÍTICO: Sincronizar userId del carrito con el usuario actual
  // Solo sincronizar cuando la autenticación haya terminado de cargar
  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (loading) {
      return; // No hacer nada mientras carga
    }

    // Si hay usuario autenticado
    if (user?.id) {
      // Solo actualizar si el userId del carrito es diferente
      if (cartUserId !== user.id) {
        setUserId(user.id);
      }

      // ⚠️ CRÍTICO: Verificar y remover cursos comprados del carrito
      const checkAndRemovePurchasedCourses = async () => {
        try {
          // Obtener lista de cursos comprados
          const response = await fetch('/api/my-courses', {
            credentials: 'include',
            cache: 'no-store',
          });

          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              // Extraer IDs de cursos comprados
              const purchasedCourseIds = data
                .map((course: any) => course.course_id || course.id)
                .filter((id: string | undefined): id is string => !!id);

              // Remover cursos comprados del carrito
              if (purchasedCourseIds.length > 0) {
                removePurchasedCourses(purchasedCourseIds);
              }
            }
          }
        } catch (error) {
          // Si falla, no hacer nada (el carrito se mantiene)
          // console.error('Error verificando cursos comprados:', error);
        }
      };

      // Verificar cursos comprados después de un pequeño delay
      const timer = setTimeout(checkAndRemovePurchasedCourses, 500);
      return () => clearTimeout(timer);
    } else {
      // Solo limpiar si realmente no hay usuario Y el carrito tiene un userId guardado
      // Esto evita limpiar el carrito durante la recarga de página
      if (cartUserId !== null) {
        setUserId(null);
      }
    }
  }, [user?.id, loading, cartUserId, setUserId, removePurchasedCourses]);

  const itemCount = getItemCount();
  const total = getTotal();

  // Detectar cuando el componente está montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsHovered(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCartClick = () => {
    setIsHovered(false);
    router.push('/cart');
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(id);
  };

  return (
    <div
      className={`relative ${className}`}
      ref={dropdownRef}
      style={{ zIndex: 1000 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Botón del carrito */}
      <motion.button
        onClick={handleCartClick}
        className="relative p-3 text-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-xl hover:bg-carbon-700/50 dark:hover:bg-carbon-700/50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingCartIcon className="w-5 h-5 text-text-secondary dark:text-text-secondary" />
        {mounted && itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center text-white font-bold">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown al hover */}
      <AnimatePresence>
        {isHovered && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border-2 border-gray-200 dark:border-gray-700 z-[9999]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-text-primary">
                Carrito de compras
              </h3>
              <p className="text-sm text-text-tertiary">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>

            {/* Items del carrito */}
            <div className="max-h-80 overflow-y-auto">
              {items.slice(0, 4).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.05,
                  }}
                  className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-start space-x-4 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text-primary truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-text-tertiary mt-1">
                      Cantidad: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="p-1 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              {items.length > 4 && (
                <div className="px-6 py-2 text-center text-sm text-text-tertiary">
                  +{items.length - 4} {items.length - 4 === 1 ? 'item más' : 'items más'}
                </div>
              )}
            </div>

            {/* Footer con total y botón */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-medium text-text-primary">
                  Total:
                </span>
                <span className="text-xl font-bold text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
              <motion.button
                onClick={handleCartClick}
                className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Ver carrito completo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown vacío */}
      <AnimatePresence>
        {isHovered && items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: 'easeOut',
            }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border-2 border-gray-200 dark:border-gray-700 z-[9999]"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="px-6 py-8 text-center">
              <ShoppingCartIcon className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary font-medium mb-2">
                Tu carrito está vacío
              </p>
              <p className="text-sm text-text-tertiary">
                Agrega cursos o suscripciones para comenzar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

