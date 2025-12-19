'use client';

import { useState, useEffect } from 'react';
import { ScormPackage } from '@/lib/scorm/types';

interface UseScormPackageOptions {
  packageId?: string;
  courseId?: string;
  organizationId?: string;
}

interface UseScormPackageReturn {
  package_: ScormPackage | null;
  packages: ScormPackage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useScormPackage(options: UseScormPackageOptions = {}): UseScormPackageReturn {
  const { packageId, courseId, organizationId } = options;
  const [package_, setPackage] = useState<ScormPackage | null>(null);
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackage = async () => {
    if (!packageId) return;

    try {
      const response = await fetch(`/api/scorm/packages/${packageId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener el paquete');
      }

      console.log('[useScormPackage] Received package data:', data.package);
      console.log('[useScormPackage] manifest_data:', data.package?.manifest_data);
      console.log('[useScormPackage] objectives:', data.package?.manifest_data?.objectives);
      setPackage(data.package);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener el paquete');
    }
  };

  const fetchPackages = async () => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (organizationId) params.append('organizationId', organizationId);

      const response = await fetch(`/api/scorm/packages?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener los paquetes');
      }

      setPackages(data.packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los paquetes');
    }
  };

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    if (packageId) {
      await fetchPackage();
    } else if (organizationId) {
      // Permitir buscar solo por organizationId (courseId es opcional)
      await fetchPackages();
    }

    setIsLoading(false);
  };

  useEffect(() => {
    // Solo hacer fetch si hay parámetros válidos
    if (packageId || organizationId) {
      refetch();
    } else {
      // Si no hay parámetros, no hacer loading
      setIsLoading(false);
      setPackages([]);
      setPackage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, courseId, organizationId]);

  return {
    package_,
    packages,
    isLoading,
    error,
    refetch
  };
}
