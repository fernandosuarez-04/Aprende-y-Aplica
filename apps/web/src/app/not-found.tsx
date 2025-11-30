'use client';

import Link from 'next/link';
import { Button } from '@aprende-y-aplica/ui';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-carbon-950 dark:via-carbon-900 dark:to-carbon-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary/20 dark:text-primary/10">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </Link>
          <Link href="/apps-directory">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              <Search className="w-4 h-4" />
              Explorar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

