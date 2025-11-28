'use client';

/**
 * 🆘 ContextualHelpDialog Component
 *
 * Componente de diálogo inteligente que muestra ayuda hiperpersonalizada
 * basada en el análisis contextual de errores del usuario.
 *
 * Características:
 * - Mensaje personalizado según el tipo de error
 * - Acciones recomendadas con iconos
 * - Diseño amigable y no intrusivo
 * - Animaciones suaves
 * - Integración con LIA (chatbot)
 */

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  LightBulbIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import type { HelpData } from '@/hooks/useContextualHelp';

interface ContextualHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  helpData: HelpData | null;
  onActionClick?: (actionType: string, data?: any) => void;
}

export function ContextualHelpDialog({
  isOpen,
  onClose,
  onAccept,
  helpData,
  onActionClick
}: ContextualHelpDialogProps) {
  if (!helpData) return null;

  const getIconForHelpType = (helpType: HelpData['helpType']) => {
    switch (helpType) {
      case 'hint':
        return <LightBulbIcon className="h-8 w-8 text-yellow-500" />;
      case 'concept_review':
        return <BookOpenIcon className="h-8 w-8 text-blue-500" />;
      case 'example':
        return <DocumentTextIcon className="h-8 w-8 text-green-500" />;
      case 'simplification':
        return <SparklesIcon className="h-8 w-8 text-purple-500" />;
      case 'instructor_contact':
        return <AcademicCapIcon className="h-8 w-8 text-orange-500" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-500" />;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'show_hint':
        return <LightBulbIcon className="h-5 w-5" />;
      case 'review_concept':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'show_example':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'simplify_question':
        return <SparklesIcon className="h-5 w-5" />;
      case 'contact_instructor':
        return <AcademicCapIcon className="h-5 w-5" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = () => {
    if (!helpData.contextualAnalysis) return 'blue';

    switch (helpData.contextualAnalysis.interventionPriority) {
      case 'immediate':
        return 'red';
      case 'soon':
        return 'orange';
      default:
        return 'blue';
    }
  };

  const priorityColor = getPriorityColor();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog Panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all border-2 border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-${priorityColor}-100 dark:bg-${priorityColor}-900/30`}>
                      {getIconForHelpType(helpData.helpType)}
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {helpData.contextualAnalysis?.interventionPriority === 'immediate'
                          ? '🆘 Ayuda Inmediata'
                          : '💡 Sugerencia de Ayuda'}
                      </Dialog.Title>
                      {helpData.contextualAnalysis && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Confianza: {(helpData.contextualAnalysis.overallScore * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {helpData.message}
                  </p>
                </div>

                {/* 🆕 Ayuda Hiperpersonalizada con IA */}
                {helpData.aiHelp && (
                  <div className="mb-6 space-y-4">
                    {/* Explicación del Error */}
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                      <h5 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2 flex items-center gap-2">
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        ¿Por qué está mal?
                      </h5>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {helpData.aiHelp.whyWrong}
                      </p>
                    </div>

                    {/* Pista Específica */}
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                      <h5 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2 flex items-center gap-2">
                        <LightBulbIcon className="h-4 w-4" />
                        Pista para ti
                      </h5>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {helpData.aiHelp.hint}
                      </p>
                    </div>

                    {/* Ejemplo (si está disponible) */}
                    {helpData.aiHelp.example && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                        <h5 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                          <DocumentTextIcon className="h-4 w-4" />
                          Ejemplo
                        </h5>
                        <p className="text-sm text-green-800 dark:text-green-200">
                          {helpData.aiHelp.example}
                        </p>
                      </div>
                    )}

                    {/* Paso a Paso (si está disponible) */}
                    {helpData.aiHelp.stepByStep && helpData.aiHelp.stepByStep.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                        <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <BookOpenIcon className="h-4 w-4" />
                          Cómo resolverlo
                        </h5>
                        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                          {helpData.aiHelp.stepByStep.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Concepto Clave */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h5 className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-1 flex items-center gap-2">
                        <SparklesIcon className="h-3 w-3" />
                        Concepto clave a revisar
                      </h5>
                      <p className="text-sm text-purple-800 dark:text-purple-200">
                        {helpData.aiHelp.keyConceptToReview}
                      </p>
                    </div>
                  </div>
                )}

                {/* Estadísticas (si disponibles) */}
                {helpData.contextualAnalysis && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      📊 Tu Progreso Actual
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Preguntas totales</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {helpData.contextualAnalysis.stats.totalQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Intentadas</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {helpData.contextualAnalysis.stats.attemptedQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Saltadas</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">
                          {helpData.contextualAnalysis.stats.skippedQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Promedio intentos</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {helpData.contextualAnalysis.stats.averageAttemptsPerQuestion.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Acciones Recomendadas */}
                {helpData.recommendedActions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      🎯 Acciones Recomendadas
                    </h4>
                    <div className="space-y-2">
                      {helpData.recommendedActions.slice(0, 3).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            action.action();
                            onActionClick?.(action.type);
                          }}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left group"
                        >
                          <div className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            {getActionIcon(action.type)}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
                            {action.label}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información del Error (desarrollo) */}
                {helpData.contextualAnalysis && process.env.NODE_ENV === 'development' && (
                  <details className="mb-4 text-xs">
                    <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                      🔧 Debug Info
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-auto max-h-40 text-[10px]">
                      {JSON.stringify(helpData.contextualAnalysis, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Botones de acción */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
                  >
                    Ahora no
                  </button>
                  <button
                    onClick={() => {
                      onAccept();
                      onClose();
                    }}
                    className={`flex-1 px-4 py-2.5 bg-${priorityColor}-600 hover:bg-${priorityColor}-700 text-white font-medium rounded-lg transition-colors shadow-lg shadow-${priorityColor}-500/30`}
                  >
                    ✨ Obtener Ayuda
                  </button>
                </div>

                {/* Nota adicional */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  💬 Puedo ayudarte a entender mejor este concepto
                </p>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
