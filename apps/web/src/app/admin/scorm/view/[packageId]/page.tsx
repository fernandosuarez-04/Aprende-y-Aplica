'use client';

import { useParams, useRouter } from 'next/navigation';
import { SCORMPlayer, SCORMProgress, useScormPackage, useScormAttempts } from '@/features/scorm';
import { useState, useCallback } from 'react';
import Link from 'next/link';

interface PackageStats {
    totalAttempts: number;
    uniqueUsers: number;
    completedCount: number;
    passedCount: number;
    failedCount: number;
    inProgressCount: number;
    completionRate: number;
    passRate: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalTime: string;
    averageTime: string;
}

export default function AdminScormViewPage() {
    const params = useParams();
    const router = useRouter();
    const packageId = params.packageId as string;

    const { package_, isLoading: packageLoading, error: packageError } = useScormPackage({ packageId });
    const { attempts, latestAttempt, refetch: refetchAttempts } = useScormAttempts({ packageId });

    const [showHistory, setShowHistory] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [completionData, setCompletionData] = useState<{ status: string; score?: number } | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [stats, setStats] = useState<PackageStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStats = useCallback(async (forceRefresh: boolean = false) => {
        if (stats && !forceRefresh) {
            setShowStats(!showStats);
            return;
        }
        setLoadingStats(true);
        try {
            const response = await fetch(`/api/scorm/packages/${packageId}/stats`, {
                credentials: 'include',
                cache: 'no-store'
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
                setShowStats(true);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoadingStats(false);
        }
    }, [packageId, stats, showStats]);

    const handleComplete = useCallback((status: string, score?: number) => {
        refetchAttempts();
        setCompletionData({ status, score });
        setShowCompletionModal(true);
        // Invalidar cache de stats para que se actualicen al volver a ver
        setStats(null);
    }, [refetchAttempts]);

    const handleError = (error: string) => {
        console.error('SCORM Error:', error);
    };

    if (packageLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
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
                    <p className="text-red-600 font-medium">Error al cargar el paquete SCORM</p>
                    <p className="text-neutral-500 text-sm mt-1">{packageError || 'Paquete no encontrado'}</p>
                    <Link
                        href="/admin/scorm"
                        className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        Volver a SCORM Admin
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="mb-4 text-sm">
                <ol className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <li>
                        <Link href="/admin" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            Admin
                        </Link>
                    </li>
                    <li>/</li>
                    <li>
                        <Link href="/admin/scorm" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            Paquetes SCORM
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
                    <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-md text-sm font-medium">
                        Vista de Admin
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
                    <button
                        onClick={() => fetchStats()}
                        disabled={loadingStats}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 disabled:opacity-50"
                    >
                        {loadingStats ? (
                            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        )}
                        {showStats ? 'Ocultar estadísticas' : 'Ver estadísticas'}
                    </button>
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

            {/* Estadísticas del paquete */}
            {showStats && stats && (
                <div className="mb-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Estadísticas del Paquete
                        </h2>
                        <button
                            onClick={() => fetchStats(true)}
                            disabled={loadingStats}
                            className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Actualizar estadísticas"
                        >
                            <svg className={`w-5 h-5 ${loadingStats ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Total Intentos</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalAttempts}</p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Usuarios Únicos</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.uniqueUsers}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                            <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">Completados</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completedCount}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Aprobados</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.passedCount}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                            <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">Reprobados</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.failedCount}</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">En Progreso</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.inProgressCount}</p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Tasa Completado</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.completionRate}%</p>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Tasa Aprobación</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.passRate}%</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Puntuaciones</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Promedio</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{stats.averageScore}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Más Alta</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.highestScore}%</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Más Baja</p>
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.lowestScore}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">Tiempo</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tiempo Total</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{stats.totalTime}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Tiempo Promedio</p>
                                <p className="text-lg font-bold text-neutral-900 dark:text-white">{stats.averageTime}</p>
                            </div>
                        </div>
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
                                {completionData.status === 'passed' ? '¡SCORM Completado!' :
                                    completionData.status === 'failed' ? 'SCORM Finalizado' :
                                        'SCORM Completado'}
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
                                        router.push('/admin/scorm');
                                    }}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Volver a Admin SCORM
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
