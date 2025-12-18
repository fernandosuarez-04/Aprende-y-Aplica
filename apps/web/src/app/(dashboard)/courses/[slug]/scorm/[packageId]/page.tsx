'use client';

import { useParams } from 'next/navigation';
import { SCORMPlayer, SCORMProgress, useScormPackage, useScormAttempts } from '@/features/scorm';
import { useState } from 'react';
import Link from 'next/link';

export default function ScormCoursePage() {
  const params = useParams();
  const packageId = params.packageId as string;
  const courseId = params.slug as string;

  const { package_, isLoading: packageLoading, error: packageError } = useScormPackage({ packageId });
  const { attempts, latestAttempt, refetch: refetchAttempts } = useScormAttempts({ packageId });

  const [showHistory, setShowHistory] = useState(false);

  const handleComplete = (status: string, score?: number) => {
    refetchAttempts();
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
      />
    </div>
  );
}
