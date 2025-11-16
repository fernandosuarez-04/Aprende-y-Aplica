'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { initiateMicrosoftLogin } from '../../actions/oauth';

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
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
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      className="
        w-full px-4 py-2.5 rounded-lg
        bg-white dark:bg-gray-800
        border-2 border-gray-300 dark:border-gray-600
        text-gray-700 dark:text-gray-200
        font-medium text-sm
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:border-gray-400 dark:hover:border-gray-500
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center space-x-3
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Conectando...</span>
        </>
      ) : (
        <>
          <MicrosoftIcon />
          <span>Continuar con Microsoft</span>
        </>
      )}
    </button>
  );
}


