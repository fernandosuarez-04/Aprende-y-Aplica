'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ArrowRight, Crown, Star, BookOpen, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { useShoppingCartStore } from '../../core/stores/shoppingCartStore';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user, loading } = useAuth();
  const { items, removeItem, updateQuantity, getTotal, clearCart, setUserId, userId: cartUserId, removePurchasedCourses } =
    useShoppingCartStore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      // Verificar cursos comprados después de un pequeño delay para asegurar que el usuario esté cargado
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

  const total = getTotal();
  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (items.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        // console.error('❌ Error en respuesta del checkout:', data);
        // Mostrar detalles si están disponibles
        const errorMessage = data.details 
          ? `${data.error}\n\nDetalles:\n${data.details.join('\n')}`
          : data.error || 'Error al procesar el pago';
        throw new Error(errorMessage);
      }

      if (data.success) {
        setSuccess(true);
        // Limpiar el carrito
        clearCart();
        // Redirigir después de 2 segundos
        setTimeout(() => {
          router.push('/my-courses');
        }, 2000);
      } else {
        throw new Error(data.error || 'Error al procesar el pago');
      }
    } catch (err) {
      // console.error('Error en checkout:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const getSubscriptionIcon = (title: string) => {
    if (title.toLowerCase().includes('básico') || title.toLowerCase().includes('basic')) {
      return <BookOpen className="w-8 h-8" />;
    } else if (title.toLowerCase().includes('premium')) {
      return <Star className="w-8 h-8" />;
    } else if (title.toLowerCase().includes('pro')) {
      return <Crown className="w-8 h-8" />;
    }
    return <Sparkles className="w-8 h-8" />;
  };

  const getSubscriptionGradient = (title: string) => {
    if (title.toLowerCase().includes('básico') || title.toLowerCase().includes('basic')) {
      return 'from-blue-500 to-blue-600';
    } else if (title.toLowerCase().includes('premium')) {
      return 'from-purple-500 to-purple-600';
    } else if (title.toLowerCase().includes('pro')) {
      return 'from-amber-500 to-amber-600';
    }
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-carbon dark:bg-carbon-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Carrito de compras
            </h1>
            <p className="text-text-tertiary">
              {itemCount === 0
                ? 'Tu carrito está vacío'
                : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} en tu carrito`}
            </p>
          </div>

          {items.length === 0 ? (
            // Carrito vacío
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center"
            >
              <ShoppingCart className="w-20 h-20 text-text-tertiary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-text-tertiary mb-6">
                Agrega cursos o suscripciones para comenzar
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Explorar cursos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-start gap-4"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : item.itemType === 'subscription' ? (
                      <div className={`w-24 h-24 rounded-lg bg-gradient-to-br ${getSubscriptionGradient(item.title)} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                        {getSubscriptionIcon(item.title)}
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white flex-shrink-0">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-text-tertiary mb-4">
                        {item.itemType === 'course'
                          ? 'Curso'
                          : item.itemType === 'subscription'
                          ? 'Suscripción'
                          : item.itemType === 'workshop'
                          ? 'Taller'
                          : 'Otro'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-text-secondary" />
                          </button>
                          <span className="text-text-primary font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-text-secondary" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-sm text-text-tertiary">
                              ${item.price.toFixed(2)} c/u
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Resumen de compra */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 sticky top-24"
                >
                  <h2 className="text-xl font-semibold text-text-primary mb-6">
                    Resumen de compra
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal ({itemCount} items)</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Impuestos</span>
                      <span>$0.00</span>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />
                    <div className="flex justify-between text-xl font-bold text-text-primary">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {success && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          ¡Compra procesada exitosamente!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Redirigiendo a tus cursos...
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error al procesar el pago
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || items.length === 0 || success}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Procesado
                      </>
                    ) : (
                      <>
                        Proceder al pago
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full text-text-tertiary hover:text-red-600 dark:hover:text-red-400 font-medium py-2 px-4 transition-colors text-sm"
                  >
                    Vaciar carrito
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-text-tertiary">
                      <span className="font-medium">Garantía de satisfacción</span>
                      <br />
                      Si no estás satisfecho, te devolvemos tu dinero
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

