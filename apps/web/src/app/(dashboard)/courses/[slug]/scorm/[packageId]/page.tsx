'use client';

import { useParams, useRouter } from 'next/navigation';
import { SCORMPlayer, SCORMProgress, useScormPackage, useScormAttempts } from '@/features/scorm';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ScormCoursePage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;
  const courseId = params.slug as string;

  const { package_, isLoading: packageLoading, error: packageError } = useScormPackage({ packageId });
  const { attempts, latestAttempt, refetch: refetchAttempts } = useScormAttempts({ packageId });

  const [showHistory, setShowHistory] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{ status: string; score?: number } | null>(null);

  // Debug: Log when package data is loaded
  useEffect(() => {
    if (package_) {
      console.log('[ScormCoursePage] Package loaded:', package_.id);
      console.log('[ScormCoursePage] manifest_data:', package_.manifest_data);
      console.log('[ScormCoursePage] objectives:', package_.manifest_data?.objectives);
    }
  }, [package_]);

  // Interceptar intentos de cerrar ventana desde el contenido SCORM
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Permitir que el contenido SCORM guarde antes de salir
      // No bloquear, solo permitir que termine correctamente
    };

    // Interceptar window.close() desde el iframe
    const originalClose = window.close;
    window.close = function() {
      // Si el contenido SCORM intenta cerrar, redirigir al curso en su lugar
      if (completionData) {
        router.push(`/courses/${courseId}`);
        return;
      }
      // Permitir cierre normal si no hay datos de completado
      return originalClose.call(window);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.close = originalClose;
    };
  }, [completionData, courseId, router]);

  const handleComplete = (status: string, score?: number) => {
    refetchAttempts();
    setCompletionData({ status, score });
    
    // Mostrar modal de completado
    if (status === 'completed' || status === 'passed' || status === 'failed') {
      setShowCompletionModal(true);
    }
  };

  const handleError = (error: string) => {
    console.error('SCORM Error:', error);
  };

  if (packageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (packageError || !package_) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-neutral-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-600 font-medium">Error al cargar el curso</p>
          <p className="text-neutral-500 text-sm mt-1">{packageError || 'Paquete no encontrado'}</p>
          <Link
            href={`/courses/${courseId}`}
            className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Volver al curso
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-neutral-900 min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <ol className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <li>
            <Link href="/courses" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Cursos
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href={`/courses/${courseId}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Curso
            </Link>
          </li>
          <li>/</li>
          <li className="text-neutral-900 dark:text-white font-medium truncate max-w-[200px]">
            {package_.title}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{package_.title}</h1>
        {package_.description && (
          <p className="text-neutral-700 dark:text-neutral-200 mt-2 text-base leading-relaxed">{package_.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="px-3 py-1.5 bg-primary-600 text-white rounded-md text-sm font-medium shadow-sm">
            {package_.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
          </span>
          {latestAttempt && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Ocultar historial' : `Ver historial (${attempts.length} intentos)`}
            </button>
          )}
        </div>
      </div>

      {/* Historial de intentos */}
      {showHistory && attempts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">Historial de Intentos</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attempts.map((attempt) => (
              <SCORMProgress key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </div>
      )}

      {/* Player */}
      <SCORMPlayer
        packageId={package_.id}
        version={package_.version}
        storagePath={package_.storage_path}
        entryPoint={package_.entry_point}
        onComplete={handleComplete}
        onError={handleError}
        className="aspect-video max-h-[700px]"
        objectives={
          package_.manifest_data?.objectives
            ? package_.manifest_data.objectives.map((obj: any) => ({
                id: obj.id,
                description: obj.description || ''
              }))
            : []
        }
      />

      {/* Modal de completado */}
      {showCompletionModal && completionData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {completionData.status === 'passed' ? '¡Curso Completado!' : 
                 completionData.status === 'failed' ? 'Curso Finalizado' : 
                 'Curso Completado'}
              </h3>
              {completionData.score !== undefined && (
                <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                  Puntuación: {completionData.score}%
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    router.push(`/courses/${courseId}`);
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Volver al Curso
                </button>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-6 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  Continuar Viendo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
