'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus } from 'lucide-react';

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1419]">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
                </div>
                <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white">
                  Métodos de pago
                </h1>
              </div>
              <p className="text-xs text-[#6C757D] dark:text-gray-400 ml-12">
                Gestiona tus tarjetas y métodos de pago
              </p>
            </div>
            <button 
              disabled
              className="flex items-center gap-2 bg-[#6C757D] text-white font-medium px-4 py-2 rounded-md transition-colors cursor-not-allowed opacity-60 text-sm"
            >
              <Plus className="w-4 h-4" />
              Próximamente
            </button>
          </div>

          {/* Contenido principal */}
          <div className="bg-white dark:bg-[#1E2329] rounded-xl p-10 border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm">
            <div className="text-center py-8">
              <div className="p-6 bg-[#E9ECEF]/50 dark:bg-[#0A2540]/20 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-[#6C757D] dark:text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#0A2540] dark:text-white mb-2">
                No hay métodos de pago guardados
              </h2>
              <p className="text-sm text-[#6C757D] dark:text-gray-400">
                Agrega una tarjeta o método de pago para realizar compras más rápido
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

