'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-950 dark:via-carbon-900 dark:to-carbon-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-red-500/20 dark:text-red-500/10">
            500
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Error del servidor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lo sentimos, ocurrió un error inesperado. Por favor, intenta de nuevo.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary via-primary to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-2xl hover:shadow-primary/60 hover:scale-[1.02] transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary bg-transparent rounded-xl font-semibold hover:bg-primary hover:text-white transition-all duration-300"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
