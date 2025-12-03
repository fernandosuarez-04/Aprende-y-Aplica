'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  BookOpen,
  XCircle,
  PauseCircle
} from 'lucide-react';
import { StudySession } from '@aprende-y-aplica/shared';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<StudySession | null>(null);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [courseInfo, setCourseInfo] = useState<{
    name: string;
    moduleName: string;
    activities: Array<{ title: string; type: string }>;
    canAccess: boolean;
    accessReason: string;
    currentLessonId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/study-planner/sessions/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar la sesión');
      }

      const data = await response.json();
      
      if (!data.session) {
        throw new Error('Sesión no encontrada');
      }

      setSession(data.session);

      // Obtener información detallada del curso, módulo y actividades
      if (data.session.course_id && data.session.lesson_id) {
        try {
          // Obtener información completa del curso, módulo y actividades
          const detailResponse = await fetch(`/api/study-planner/sessions/${sessionId}/details`);
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.course) {
              setCourseInfo({
                name: detailData.course.name,
                moduleName: detailData.module?.name || 'Módulo no especificado',
                activities: detailData.activities || [],
                canAccess: detailData.canAccess || false,
                accessReason: detailData.accessReason || '',
                currentLessonId: detailData.currentLessonId || null,
              });
            }
            if (detailData.course?.slug) {
              setCourseSlug(detailData.course.slug);
            }
          } else {
            // Fallback: obtener solo el slug del curso
            const courseResponse = await fetch(`/api/study-planner/courses/${data.session.course_id}/slug`);
            if (courseResponse.ok) {
              const courseData = await courseResponse.json();
              if (courseData.slug) {
                setCourseSlug(courseData.slug);
              }
              if (courseData.title) {
                setCourseInfo({
                  name: courseData.title,
                  moduleName: 'Módulo no especificado',
                  activities: [],
                  canAccess: false,
                  accessReason: 'No se pudo verificar el acceso a esta lección',
                  currentLessonId: null,
                });
              }
            }
          }
        } catch (err) {
          console.warn('No se pudo obtener la información detallada:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!session) return;

    try {
      setUpdatingStatus(true);
      
      const response = await fetch(`/api/study-planner/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      // Recargar los datos de la sesión
      await fetchSessionData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStartSession = () => {
    if (courseSlug) {
      // Navegar a la página de aprendizaje del curso usando el slug
      router.push(`/courses/${courseSlug}/learn`);
    } else if (session?.course_id) {
      // Fallback: intentar con el ID si no hay slug
      router.push(`/courses/${session.course_id}/learn`);
    } else {
      alert('No se pudo encontrar el curso asociado a esta sesión');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'planned':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'skipped':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'in_progress':
        return 'En progreso';
      case 'planned':
        return 'Planificada';
      case 'cancelled':
        return 'Cancelada';
      case 'skipped':
        return 'Omitida';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'in_progress':
        return <Play className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'skipped':
        return <PauseCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-300">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-300 mb-6">{error || 'Sesión no encontrada'}</p>
          <button
            onClick={() => router.push('/study-planner/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(session.start_time);
  const endDate = new Date(session.end_time);
  const isPast = endDate < new Date();
  const isNow = startDate <= new Date() && endDate >= new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{session.title}</h1>
                {session.description && (
                  <p className="text-slate-300">{session.description}</p>
                )}
              </div>
              <span
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${getStatusColor(session.status)}`}
              >
                {getStatusIcon(session.status)}
                {getStatusLabel(session.status)}
              </span>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Fecha</span>
                </div>
                <p className="text-white font-semibold">
                  {startDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Horario</span>
                </div>
                <p className="text-white font-semibold">
                  {startDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - {endDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Duración</span>
                </div>
                <p className="text-white font-semibold">
                  {session.duration_minutes} minutos
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">Acciones</h2>
          
          {courseInfo && !courseInfo.canAccess ? (
            <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-300 font-medium mb-1">Acceso Restringido</p>
                  <p className="text-yellow-200 text-sm">{courseInfo.accessReason}</p>
                  {courseInfo.currentLessonId && (
                    <p className="text-yellow-200 text-sm mt-2">
                      Debes continuar con la siguiente lección pendiente en tu plan de estudio.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {session.status === 'planned' && (
                <>
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updatingStatus || (courseInfo && !courseInfo.canAccess)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={courseInfo && !courseInfo.canAccess}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="w-5 h-5" />
                    Ver Lección
                  </button>
                </>
              )}

              {session.status === 'in_progress' && (
                <>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={updatingStatus || (courseInfo && !courseInfo.canAccess)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Marcar como Completada
                  </button>
                  <button
                    onClick={handleStartSession}
                    disabled={courseInfo && !courseInfo.canAccess}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BookOpen className="w-5 h-5" />
                    Continuar Lección
                  </button>
                </>
              )}

              {session.status === 'planned' && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={updatingStatus}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Cancelar Sesión
                </button>
              )}

              {session.status === 'completed' && (
                <button
                  onClick={handleStartSession}
                  disabled={courseInfo && !courseInfo.canAccess}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen className="w-5 h-5" />
                  Revisar Lección
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
        >
          <h2 className="text-xl font-bold text-white mb-4">Información de la Sesión</h2>
          
          <div className="space-y-4">
            {courseInfo ? (
              <>
                <div>
                  <span className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" />
                    Curso:
                  </span>
                  <p className="text-white font-semibold">{courseInfo.name}</p>
                </div>

                <div>
                  <span className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4" />
                    Módulo:
                  </span>
                  <p className="text-white">{courseInfo.moduleName}</p>
                </div>

                {courseInfo.activities.length > 0 && (
                  <div>
                    <span className="text-slate-400 text-sm flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      Actividades ({courseInfo.activities.length}):
                    </span>
                    <div className="space-y-2">
                      {courseInfo.activities.map((activity, idx) => (
                        <div
                          key={idx}
                          className="bg-white/5 rounded-lg p-3 border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{activity.title}</p>
                              <p className="text-slate-400 text-xs mt-1 capitalize">
                                Tipo: {activity.type === 'reflection' ? 'Reflexión' :
                                       activity.type === 'exercise' ? 'Ejercicio' :
                                       activity.type === 'quiz' ? 'Quiz' :
                                       activity.type === 'discussion' ? 'Discusión' :
                                       activity.type === 'ai_chat' ? 'Chat con IA' :
                                       activity.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {courseInfo.activities.length === 0 && (
                  <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                    <p className="text-slate-400 text-sm">Esta lección no tiene actividades adicionales</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {session.course_id && (
                  <div>
                    <span className="text-slate-400 text-sm">Curso ID:</span>
                    <p className="text-white">{session.course_id}</p>
                  </div>
                )}

                {session.lesson_id && (
                  <div>
                    <span className="text-slate-400 text-sm">Lección ID:</span>
                    <p className="text-white">{session.lesson_id}</p>
                  </div>
                )}
              </>
            )}

            {session.session_type && (
              <div>
                <span className="text-slate-400 text-sm">Tipo de Sesión:</span>
                <p className="text-white capitalize">
                  {session.session_type === 'short' ? 'Corta' :
                   session.session_type === 'medium' ? 'Media' :
                   session.session_type === 'long' ? 'Larga' :
                   session.session_type}
                </p>
              </div>
            )}

            {isPast && session.status === 'planned' && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Esta sesión ya pasó y aún está marcada como planificada. Considera actualizar su estado.
                </p>
              </div>
            )}

            {isNow && session.status === 'planned' && (
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 text-sm">
                  🎯 Esta sesión está programada para ahora. ¡Es hora de estudiar!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

