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
      return 'from-[#0A2540] to-[#0A2540]';
    } else if (title.toLowerCase().includes('premium')) {
      return 'from-[#00D4B3] to-[#00D4B3]';
    } else if (title.toLowerCase().includes('pro')) {
      return 'from-[#F59E0B] to-[#F59E0B]';
    }
    return 'from-[#6C757D] to-[#6C757D]';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
              </div>
              <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
                Carrito de compras
              </h1>
            </div>
            <p className="text-xs text-[#6C757D] dark:text-gray-400 ml-12">
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
              className="bg-white dark:bg-[#1E2329] rounded-xl p-10 text-center border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm"
            >
              <div className="p-6 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/20 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="w-12 h-12 text-[#6C757D] dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2">
                Tu carrito está vacío
              </h2>
              <p className="text-[#6C757D] dark:text-gray-400 mb-6 text-sm">
                Agrega cursos o suscripciones para comenzar
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white font-medium px-5 py-2.5 rounded-md transition-colors text-sm"
              >
                Explorar cursos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Lista de items */}
              <div className="lg:col-span-2 space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-[#1E2329] rounded-xl p-4 flex items-start gap-3 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : item.itemType === 'subscription' ? (
                      <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getSubscriptionGradient(item.title)} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                        {getSubscriptionIcon(item.title)}
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-[#0A2540]/10 dark:bg-[#0A2540]/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-[#0A2540] dark:text-[#00D4B3]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-[#0A2540] dark:text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400 mb-3">
                        {item.itemType === 'course'
                          ? 'Curso'
                          : item.itemType === 'subscription'
                          ? 'Suscripción'
                          : item.itemType === 'workshop'
                          ? 'Taller'
                          : 'Otro'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-1 rounded-md hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/20 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-[#6C757D] dark:text-gray-400" />
                          </button>
                          <span className="text-[#0A2540] dark:text-white font-medium w-6 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 rounded-md hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/20 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#6C757D] dark:text-gray-400" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#0A2540] dark:text-[#00D4B3]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-[#6C757D] dark:text-gray-400">
                              ${item.price.toFixed(2)} c/u
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-[#6C757D] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 rounded-md hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
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
                  className="bg-white dark:bg-[#1E2329] rounded-xl p-5 sticky top-20 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm"
                >
                  <h2 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-4">
                    Resumen de compra
                  </h2>

                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between text-sm text-[#6C757D] dark:text-gray-400">
                      <span>Subtotal ({itemCount} items)</span>
                      <span className="text-[#0A2540] dark:text-white font-medium">${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#6C757D] dark:text-gray-400">
                      <span>Impuestos</span>
                      <span className="text-[#0A2540] dark:text-white font-medium">$0.00</span>
                    </div>
                    <div className="h-px bg-[#E9ECEF] dark:bg-[#6C757D]/30 my-3" />
                    <div className="flex justify-between text-lg font-bold text-[#0A2540] dark:text-white">
                      <span>Total</span>
                      <span className="text-[#0A2540] dark:text-[#00D4B3]">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {success && (
                    <div className="mb-4 p-3 bg-[#10B981]/10 dark:bg-[#10B981]/20 border border-[#10B981] dark:border-[#10B981] rounded-lg flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-[#10B981] dark:text-[#10B981] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-[#10B981] dark:text-[#10B981]">
                          ¡Compra procesada exitosamente!
                        </p>
                        <p className="text-xs text-[#0A2540] dark:text-gray-300 mt-0.5">
                          Redirigiendo a tus cursos...
                        </p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-800 dark:text-red-200">
                          Error al procesar el pago
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={isProcessing || items.length === 0 || success}
                    className="w-full bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] disabled:bg-[#6C757D] disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-md transition-colors mb-3 flex items-center justify-center gap-2 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : success ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Procesado
                      </>
                    ) : (
                      <>
                        Proceder al pago
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={clearCart}
                    className="w-full text-[#6C757D] dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium py-2 px-4 transition-colors text-xs"
                  >
                    Vaciar carrito
                  </button>

                  <div className="mt-5 pt-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30">
                    <p className="text-xs text-[#6C757D] dark:text-gray-400">
                      <span className="font-medium text-[#0A2540] dark:text-white">Garantía de satisfacción</span>
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

