'use client';

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AIWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function AIWizard({ onComplete, onCancel }: AIWizardProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onCancel}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a selección</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 sm:p-10"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Plan con IA</h2>
          <p className="text-gray-300 mb-8">
            El wizard de IA se implementará aquí. Por ahora, puedes usar este placeholder.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Completar (Placeholder)
          </button>
        </motion.div>
      </div>
    </div>
  );
}


