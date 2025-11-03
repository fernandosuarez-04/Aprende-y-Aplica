'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, ArrowRight } from 'lucide-react';
import { useShoppingCartStore } from '../../core/stores/shoppingCartStore';
import Link from 'next/link';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } =
    useShoppingCartStore();

  const total = getTotal();
  const itemCount = items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const handleCheckout = () => {
    // TODO: Implementar checkout
    console.log('Procesando compra...', items);
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
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
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

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-4 flex items-center justify-center gap-2"
                  >
                    Proceder al pago
                    <ArrowRight className="w-4 h-4" />
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

