'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { GoogleLoginButton } from '../GoogleLoginButton/GoogleLoginButton';

interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
}

export function SocialLoginButtons() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.organization) {
            setOrganization(data.user.organization);
          }
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, []);

  // Mostrar información de la organización si existe, sino mostrar valores por defecto
  const orgName = organization?.name || 'Aprende y Aplica';
  const orgLogo = organization?.logo_url || '/icono.png';

  return (
    <div className="space-y-4">
      {/* Logo y nombre de la empresa */}
      <div className="relative bg-gray-900 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 rounded-lg p-4 flex items-center gap-3">
        {/* Logo con gradiente */}
        <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden relative bg-gradient-to-r from-blue-400 to-teal-500 p-1">
          <div className="w-full h-full rounded-lg bg-gray-900 dark:bg-gray-800 flex items-center justify-center">
            {!loading && (
              <Image
                src={orgLogo}
                alt={`${orgName} Logo`}
                width={32}
                height={32}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  // Fallback al logo por defecto si hay error cargando el logo de la organización
                  (e.target as HTMLImageElement).src = '/icono.png';
                }}
              />
            )}
          </div>
        </div>
        
        {/* Nombre de la empresa */}
        <div className="flex flex-col">
          <span className="font-bold text-lg text-white">
            {loading ? 'Cargando...' : orgName}
          </span>
          <span className="text-sm text-gray-400 dark:text-gray-300">
            Business
          </span>
        </div>
      </div>

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
