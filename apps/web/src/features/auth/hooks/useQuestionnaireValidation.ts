'use client';

import { useState, useEffect } from 'react';

interface QuestionnaireStatus {
  isGoogleOAuth: boolean;
  hasProfile: boolean;
  hasResponses: boolean;
  isCompleted: boolean;
  requiresQuestionnaire: boolean;
}

interface UseQuestionnaireValidationReturn {
  isRequired: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  status: QuestionnaireStatus | null;
  error: Error | null;
}

/**
 * Hook para validar el estado del cuestionario de un usuario
 * 
 * @param userId - ID del usuario a validar (opcional, se obtiene del servidor si no se proporciona)
 * @returns Estado del cuestionario y flags de validación
 */
export function useQuestionnaireValidation(userId?: string | null): UseQuestionnaireValidationReturn {
  const [status, setStatus] = useState<QuestionnaireStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/auth/questionnaire-status');
        
        if (!response.ok) {
          throw new Error('Error al obtener estado del cuestionario');
        }
        
        const questionnaireStatus = await response.json();
        setStatus(questionnaireStatus);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
        console.error('Error verificando estado del cuestionario:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [userId]); // userId como dependencia aunque no se use directamente, para revalidar si cambia

  return {
    isRequired: status?.requiresQuestionnaire ?? false,
    isCompleted: status?.isCompleted ?? false,
    isLoading,
    status,
    error,
  };
}

