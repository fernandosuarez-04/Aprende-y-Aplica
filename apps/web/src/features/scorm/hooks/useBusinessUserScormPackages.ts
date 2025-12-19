'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AssignedScormPackage {
  id: string;
  title: string;
  description?: string;
  version: 'SCORM_1.2' | 'SCORM_2004';
  progress: number;
  status: 'Asignado' | 'En progreso' | 'Completado';
  thumbnail?: string;
  storage_path: string;
  entry_point: string;
  assigned_at: string;
  manifest_data: any;
  objectives_count: number;
}

export interface ScormPackageStats {
  total: number;
  in_progress: number;
  completed: number;
}

interface UseBusinessUserScormPackagesReturn {
  packages: AssignedScormPackage[];
  stats: ScormPackageStats;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBusinessUserScormPackages(): UseBusinessUserScormPackagesReturn {
  const [packages, setPackages] = useState<AssignedScormPackage[]>([]);
  const [stats, setStats] = useState<ScormPackageStats>({
    total: 0,
    in_progress: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/business-user/scorm-packages', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener paquetes SCORM');
      }

      if (data.success) {
        setPackages(data.packages || []);
        setStats(data.stats || { total: 0, in_progress: 0, completed: 0 });
      } else {
        throw new Error(data.error || 'Error al obtener paquetes SCORM');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setPackages([]);
      setStats({ total: 0, in_progress: 0, completed: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  return {
    packages,
    stats,
    isLoading,
    error,
    refetch
  };
}
