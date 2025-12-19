'use client';

import { useParams, useRouter } from 'next/navigation';
import { SCORMPlayer, SCORMProgress, useScormPackage, useScormAttempts } from '@/features/scorm';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, MessageCircle, X } from 'lucide-react';
import { useOrganizationStyles } from '@/features/business-panel/hooks/useOrganizationStyles';
import { getBackgroundStyle, generateCSSVariables } from '@/features/business-panel/utils/styles';
import { AIChatAgent } from '@/core/components/AIChatAgent';
import type { ScormLessonContext } from '@/core/types/lia.types';

export default function BusinessUserScormPage() {
  const params = useParams();
  const router = useRouter();
  const packageId = params.packageId as string;

  const { styles } = useOrganizationStyles();
  const userDashboardStyles = styles?.userDashboard;
  const backgroundStyle = getBackgroundStyle(userDashboardStyles);
  const cssVariables = generateCSSVariables(userDashboardStyles);

  const { package_, isLoading: packageLoading, error: packageError } = useScormPackage({ packageId });
  const { attempts, latestAttempt, refetch: refetchAttempts } = useScormAttempts({ packageId });

  const [showHistory, setShowHistory] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState<{ status: string; score?: number } | null>(null);
  const [showLiaChat, setShowLiaChat] = useState(false);

  // Build SCORM context for LIA
  const scormContext: ScormLessonContext | null = useMemo(() => {
    if (!package_) return null;

    const manifestData = package_.manifest_data || {};
    const objectives = manifestData.objectives || [];
    const organizations = manifestData.organizations || [];

    // Build course structure string from organizations
    let courseStructure = '';
    if (organizations.length > 0) {
      courseStructure = organizations.map((org: any) => {
        const items = org.items || [];
        const itemsList = items.map((item: any, index: number) => {
          const subItems = item.children || [];
          const subItemsList = subItems.length > 0
            ? subItems.map((sub: any, subIndex: number) => `  ${index + 1}.${subIndex + 1}. ${sub.title || sub.identifier}`).join('\n')
            : '';
          return `${index + 1}. ${item.title || item.identifier}${subItemsList ? '\n' + subItemsList : ''}`;
        }).join('\n');
        return `${org.title || org.identifier}:\n${itemsList}`;
      }).join('\n\n');
    }

    // Calculate progress from latest attempt
    let currentProgress = 0;
    if (latestAttempt) {
      const lessonStatus = latestAttempt.lesson_status?.toLowerCase() || '';
      if (lessonStatus === 'completed' || lessonStatus === 'passed') {
        currentProgress = 100;
      } else if (latestAttempt.score_raw !== null && latestAttempt.score_max !== null && latestAttempt.score_max > 0) {
        currentProgress = Math.round((latestAttempt.score_raw / latestAttempt.score_max) * 100);
      }
    }

    return {
      contextType: 'scorm' as const,
      packageId: package_.id,
      packageTitle: package_.title || 'Curso SCORM',
      packageDescription: package_.description || manifestData.description,
      scormVersion: package_.version as 'SCORM_1.2' | 'SCORM_2004',
      objectives: objectives.map((obj: any) => ({
        id: obj.id || obj.identifier,
        description: obj.description
      })),
      courseStructure: courseStructure || 'Estructura no disponible',
      organizations: organizations,
      currentProgress,
      lessonStatus: latestAttempt?.lesson_status
    };
  }, [package_, latestAttempt]);

  const handleComplete = useCallback((status: string, score?: number) => {
    refetchAttempts();
    setCompletionData({ status, score });
    setShowCompletionModal(true);
  }, [refetchAttempts]);

  useEffect(() => {
    if (package_) {
      console.log('[BusinessUserScormPage] Package loaded:', package_.id);
      console.log('[BusinessUserScormPage] manifest_data:', package_.manifest_data);
    }
  }, [package_]);

  // Intercept window.close
  useEffect(() => {
    const originalClose = window.close;
    window.close = function () {
      if (completionData) {
        router.push('/business-user/dashboard');
        return;
      }
      if (package_) {
        handleComplete('completed', undefined);
        return;
      }
      return originalClose.call(window);
    };

    return () => {
      window.close = originalClose;
    };
  }, [completionData, router, package_, handleComplete]);

  const handleError = (error: string) => {
    console.error('SCORM Error:', error);
  };

  if (packageLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          ...backgroundStyle,
          ...cssVariables
        } as React.CSSProperties}
      >
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (packageError || !package_) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          ...backgroundStyle,
          ...cssVariables
        } as React.CSSProperties}
      >
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-red-400 font-medium text-lg">Error al cargar el curso</p>
          <p className="text-gray-400 text-sm mt-2">{packageError || 'Paquete no encontrado'}</p>
          <Link
            href="/business-user/dashboard"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const objectivesCount = package_.manifest_data?.objectives?.length || 0;

  return (
    <div
      className="min-h-screen bg-gray-950"
      style={{
        ...backgroundStyle,
        ...cssVariables
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/business-user/dashboard"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Volver</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-white truncate max-w-[300px] sm:max-w-none">
                  {package_.title}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                    {package_.version === 'SCORM_2004' ? 'SCORM 2004' : 'SCORM 1.2'}
                  </span>
                  {objectivesCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Target className="w-3.5 h-3.5" />
                      {objectivesCount} objetivos
                    </span>
                  )}
                  {attempts.length > 0 && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {attempts.length} {attempts.length === 1 ? 'intento' : 'intentos'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* LIA Toggle Button */}
            <motion.button
              onClick={() => setShowLiaChat(!showLiaChat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${showLiaChat
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showLiaChat ? 'Ocultar LIA' : 'Preguntar a LIA'}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* History */}
        {showHistory && attempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-3">Historial de Intentos</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attempts.map((attempt) => (
                <SCORMProgress key={attempt.id} attempt={attempt} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Player and LIA Chat Layout */}
        <div className={`grid gap-6 ${showLiaChat ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* SCORM Player */}
          <div className={showLiaChat ? 'lg:col-span-2' : ''}>
            <SCORMPlayer
              packageId={package_.id}
              version={package_.version}
              storagePath={package_.storage_path}
              entryPoint={package_.entry_point}
              onComplete={handleComplete}
              onError={handleError}
              className="aspect-video max-h-[700px] rounded-xl overflow-hidden shadow-2xl"
              objectives={
                package_.manifest_data?.objectives
                  ? package_.manifest_data.objectives.map((obj: any) => ({
                    id: obj.id,
                    description: obj.description || ''
                  }))
                  : []
              }
            />
          </div>

          {/* LIA Chat Panel */}
          {showLiaChat && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 h-[calc(100vh-8rem)] bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
                <AIChatAgent
                  assistantName="LIA"
                  initialMessage={`¡Hola! Soy LIA, tu asistente de aprendizaje. Estoy aquí para ayudarte con el curso "${package_.title}". ${objectivesCount > 0 ? `Este curso tiene ${objectivesCount} objetivos de aprendizaje.` : ''} ¿En qué puedo ayudarte?`}
                  context="scorm"
                  promptPlaceholder="Pregunta sobre el curso..."
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Description */}
        {package_.description && (
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800/50">
            <p className="text-gray-300 text-sm leading-relaxed">{package_.description}</p>
          </div>
        )}
      </main>

      {/* Completion Modal */}
      {showCompletionModal && completionData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-800"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {completionData.status === 'passed' ? '¡Felicidades!' :
                  completionData.status === 'failed' ? 'Curso Finalizado' :
                    '¡Curso Completado!'}
              </h3>
              <p className="text-gray-400 mb-2">
                {completionData.status === 'passed'
                  ? 'Has aprobado el curso exitosamente.'
                  : completionData.status === 'failed'
                    ? 'Has completado el curso. Puedes intentarlo nuevamente.'
                    : 'Has completado el curso.'}
              </p>
              {completionData.score !== undefined && (
                <p className="text-lg text-white font-semibold mb-6">
                  Puntuación: <span className="text-primary">{completionData.score}%</span>
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    router.push('/business-user/dashboard');
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Volver al Dashboard
                </button>
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Continuar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
