'use client';

import { motion } from 'framer-motion';
import { GoogleLoginButton } from '../GoogleLoginButton/GoogleLoginButton';
import { MicrosoftLoginButton } from '../MicrosoftLoginButton/MicrosoftLoginButton';
import { DashboardButton } from '../DashboardButton/DashboardButton';

export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      {/* Divisor "O continuar con" */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300/30 dark:border-gray-600/30"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/95 dark:bg-[#1E2329]/85 backdrop-blur-sm">
            O continuar con
          </span>
        </div>
      </div>

      {/* Botones de providers en fila horizontal */}
      <div className="flex items-center justify-center gap-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <GoogleLoginButton />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <MicrosoftLoginButton />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <DashboardButton />
        </motion.div>
      </div>

      {/* Espacio para futuros providers */}
      {/* <GitHubLoginButton /> */}
      {/* <FacebookLoginButton /> */}
    </div>
  );
}
