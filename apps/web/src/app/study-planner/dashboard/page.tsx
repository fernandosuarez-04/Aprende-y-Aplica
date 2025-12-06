'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target, Clock, TrendingUp } from 'lucide-react';

export default function StudyPlannerDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Planificador de Estudios
              </h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-slate-400 text-lg">
            Gestiona tu tiempo y completa tus cursos de manera eficiente
          </p>
        </motion.div>

        {/* Content Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800/50 backdrop-blur-sm border border-gray-200 dark:border-slate-700/50 rounded-2xl p-8 shadow-lg dark:shadow-xl"
        >
          <div className="text-center py-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Target className="w-12 h-12 text-gray-400 dark:text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard del Planificador
            </h3>
            <p className="text-gray-600 dark:text-slate-400">
              Aquí verás tus planes de estudio y progreso
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

