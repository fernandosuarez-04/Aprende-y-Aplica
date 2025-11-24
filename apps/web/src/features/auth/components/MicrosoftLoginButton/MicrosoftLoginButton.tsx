'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { initiateMicrosoftLogin } from '../../actions/oauth';

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <rect width="10" height="10" x="1" y="1" fill="#F25022" />
    <rect width="10" height="10" x="12" y="1" fill="#7FBA00" />
    <rect width="10" height="10" x="1" y="12" fill="#00A4EF" />
    <rect width="10" height="10" x="12" y="12" fill="#FFB900" />
  </svg>
);

export function MicrosoftLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await initiateMicrosoftLogin();
    } catch (error: any) {
      if (error && typeof error === 'object' && 'digest' in error) return;
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      className="
        w-12 h-12 sm:w-14 sm:h-14
        rounded-full
        bg-white dark:bg-gray-800
        border border-gray-300 dark:border-gray-600
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:border-gray-400 dark:hover:border-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center
        shadow-sm hover:shadow-md
      "
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-300" />
      ) : (
        <MicrosoftIcon />
      )}
    </motion.button>
  );
}


