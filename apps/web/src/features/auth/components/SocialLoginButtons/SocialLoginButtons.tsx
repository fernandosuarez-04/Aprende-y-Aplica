'use client';

import { GoogleLoginButton } from '../GoogleLoginButton/GoogleLoginButton';

export function SocialLoginButtons() {
  return (
    <div className="space-y-3">
      {/* Divisor "O continuar con" */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            O continuar con
          </span>
        </div>
      </div>

      {/* Botones de providers */}
      <GoogleLoginButton />

      {/* Espacio para futuros providers */}
      {/* <GitHubLoginButton /> */}
      {/* <FacebookLoginButton /> */}
    </div>
  );
}
