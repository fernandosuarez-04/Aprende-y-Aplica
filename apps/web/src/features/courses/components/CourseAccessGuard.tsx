'use client';

import { useRouter } from 'next/navigation';
import { useCourseAccess } from '../hooks/useCourseAccess';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface CourseAccessGuardProps {
    courseSlug: string;
    children: React.ReactNode;
}

/**
 * Componente que verifica el acceso al curso antes de renderizar el contenido
 * Muestra un loader mientras verifica, y un mensaje de error si no tiene acceso
 */
export function CourseAccessGuard({ courseSlug, children }: CourseAccessGuardProps) {
    const router = useRouter();
    const { hasAccess, isLoading, error } = useCourseAccess(courseSlug);
    const { user } = useAuth();

    // Mostrar loader mientras verifica el acceso
    if (isLoading || hasAccess === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1419]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#00D4B3] animate-spin mx-auto mb-4" />
                    <p className="text-white/70">Verificando acceso al curso...</p>
                </div>
            </div>
        );
    }

    // Mostrar mensaje de error si no tiene acceso
    if (!hasAccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1419] p-4">
                <div className="max-w-md w-full bg-[#1E2329] rounded-2xl border border-[#6C757D]/30 p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-3">
                        Acceso Restringido
                    </h2>

                    <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-400 text-sm text-left">
                            {error || 'No tienes acceso a este curso'}
                        </p>
                    </div>

                    <p className="text-white/60 mb-6">
                        Para acceder al contenido de este curso, primero debes adquirirlo o inscribirte en él.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.push(`/courses/${courseSlug}`)}
                            className="flex-1 bg-[#00D4B3] hover:bg-[#00D4B3]/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Ver Curso
                        </button>
                        <button
                            onClick={() => {
                                if (user?.organization?.slug) {
                                    router.push(`/${user.organization.slug}/dashboard`);
                                } else {
                                    router.push('/dashboard');
                                }
                            }}
                            className="flex-1 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                            Ir al Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Si tiene acceso, renderizar el contenido
    return <>{children}</>;
}
