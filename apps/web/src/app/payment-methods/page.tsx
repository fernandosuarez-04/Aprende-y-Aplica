'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus } from 'lucide-react';

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-carbon dark:bg-carbon-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Métodos de pago
              </h1>
              <p className="text-text-tertiary">
                Gestiona tus tarjetas y métodos de pago
              </p>
            </div>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-6 py-3 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              Agregar método
            </button>
          </div>

          {/* Contenido principal */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-text-primary mb-2">
                No hay métodos de pago guardados
              </h2>
              <p className="text-text-tertiary mb-6">
                Agrega una tarjeta o método de pago para realizar compras más rápido
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

