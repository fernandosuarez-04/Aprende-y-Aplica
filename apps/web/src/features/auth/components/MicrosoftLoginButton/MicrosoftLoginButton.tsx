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
        w-14 h-14
        rounded-xl
        bg-white dark:bg-[#1E2329]
        border border-[#E9ECEF] dark:border-[#6C757D]/30
        hover:bg-gray-50 dark:hover:bg-[#2A2F35]
        hover:border-[#00D4B3] dark:hover:border-[#00D4B3]
        focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:ring-opacity-20
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        flex items-center justify-center
        shadow-md hover:shadow-lg hover:shadow-[#00D4B3]/10
      "
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#0A2540] dark:text-white" />
      ) : (
        <MicrosoftIcon />
      )}
    </motion.button>
  );
}


