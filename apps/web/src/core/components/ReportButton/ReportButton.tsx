'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, AlertCircle } from 'lucide-react';
import { ReporteProblema } from '../ReporteProblema/ReporteProblema';

/**
 * Botón flotante para reportar problemas
 * Aparece en todas las páginas (excepto donde esté deshabilitado)
 */
export function ReportButton() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-[180px] right-6 z-[9998]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-xl">
                Reportar un problema
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 w-2 h-2 bg-gray-900" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsReportOpen(true)}
          className="relative w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-2xl hover:shadow-red-500/50 transition-all duration-300 flex items-center justify-center group overflow-hidden"
          aria-label="Reportar problema"
        >
          {/* Efecto de pulso */}
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-red-500"
          />

          {/* Ícono con animación */}
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="relative z-10"
          >
            <Bug className="w-6 h-6" />
          </motion.div>

          {/* Badge de alerta (opcional - mostrar si hay algo importante) */}
          {/* <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse" /> */}
        </motion.button>
      </motion.div>

      {/* Modal de Reporte */}
      <ReporteProblema
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        fromLia={false}
      />
    </>
  );
}
